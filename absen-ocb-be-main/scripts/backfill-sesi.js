require("dotenv").config();
const moment = require("moment-timezone");
const dbpool = require("../src/config/database");

const timezone = "Asia/Makassar";

// Backfill absensi_sesi dari data absensi historis (forward-only companion).
// Grup per (user_id, DATE, kategori_absen, is_lembur). Pasangkan masuk<->keluar.
// - balanced (1 masuk + 1 keluar) -> sesi 'closed'
// - orphan (masuk saja / keluar saja) -> sesi 'incomplete'
// - multi (>1 masuk / >1 keluar) -> pasangkan by urutan waktu (nearest), sisa incomplete
// IDEMPOTEN: skip absensi_id yang sudah tereferensi di absensi_sesi.
//
// WAJIB jalankan di COPY DB dulu. Backup via `npm run backup-db` sebelum ini.
// Dry-run default; set APPLY=1 untuk commit.

const APPLY = process.env.APPLY === "1";

const direction = (desc) => {
  const d = String(desc || "").toLowerCase();
  if (d.includes("keluar") || d.includes("pulang")) return "keluar";
  if (d.includes("masuk")) return "masuk";
  return "neither";
};

(async () => {
  const conn = await dbpool.getConnection();
  const stats = {
    groups: 0,
    closed: 0,
    incompleteMasuk: 0,
    incompleteKeluar: 0,
    multiExtra: 0,
    neither: 0,
    skippedExisting: 0,
  };

  try {
    // absensi_id yang SUDAH punya sesi (idempotency).
    const [existingRows] = await conn.query(
      `SELECT masuk_absensi_id AS id FROM absensi_sesi WHERE masuk_absensi_id IS NOT NULL
       UNION
       SELECT keluar_absensi_id AS id FROM absensi_sesi WHERE keluar_absensi_id IS NOT NULL`
    );
    const alreadyLinked = new Set(existingRows.map((r) => String(r.id)));

    // Semua absensi non-rejected + metadata tipe. Urut waktu utk pairing.
    const [rows] = await conn.query(
      `SELECT a.absensi_id, a.user_id, a.retail_id, a.absen_time, a.is_lembur,
              a.status_approval, ta.description, ta.kategori_absen
       FROM absensi a
       JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
       WHERE (a.status_approval IS NULL OR a.status_approval <> 3)
       ORDER BY a.user_id, DATE(a.absen_time), ta.kategori_absen, a.absen_time`
    );

    // Grup by user | date | kategori | is_lembur.
    const groups = new Map();
    for (const r of rows) {
      if (alreadyLinked.has(String(r.absensi_id))) {
        stats.skippedExisting++;
        continue;
      }
      const dir = direction(r.description);
      if (dir === "neither") {
        stats.neither++;
        continue;
      }
      // Anchor tanggal WITA (bukan UTC). toISOString() sebelumnya menggeser
      // masuk 00:00-07:59 WITA ke hari kemarin -> sesi mis-anchor -> strict TL.
      const dateStr = moment(r.absen_time).tz(timezone).format("YYYY-MM-DD");
      const lembur = r.is_lembur === 1 ? 1 : 0;
      const key = `${r.user_id}|${dateStr}|${r.kategori_absen || ""}|${lembur}`;
      if (!groups.has(key)) {
        groups.set(key, {
          user_id: r.user_id,
          retail_id: r.retail_id,
          tanggal: dateStr,
          kategori_absen: r.kategori_absen || null,
          is_lembur: lembur,
          masuk: [],
          keluar: [],
        });
      }
      const g = groups.get(key);
      if (dir === "masuk") g.masuk.push(r);
      else g.keluar.push(r);
    }

    if (APPLY) await conn.beginTransaction();

    const insertClosed = async (g, m, k) => {
      stats.closed++;
      if (!APPLY) return;
      const jadwalId = await resolveJadwal(conn, g, m.absensi_id, k.absensi_id);
      await conn.query(
        `INSERT INTO absensi_sesi
           (user_id, tanggal, retail_id, jadwal_id, kategori_absen,
            masuk_absensi_id, keluar_absensi_id, is_lembur, status, created_at)
         VALUES (?,?,?,?,?,?,?,?, 'closed', ?)`,
        [
          g.user_id, g.tanggal, m.retail_id, jadwalId, g.kategori_absen,
          m.absensi_id, k.absensi_id, g.is_lembur, m.absen_time,
        ]
      );
    };

    const insertIncomplete = async (g, row, dir) => {
      if (dir === "masuk") stats.incompleteMasuk++;
      else stats.incompleteKeluar++;
      if (!APPLY) return;
      const jadwalId = await resolveJadwal(conn, g, row.absensi_id, null);
      await conn.query(
        `INSERT INTO absensi_sesi
           (user_id, tanggal, retail_id, jadwal_id, kategori_absen,
            masuk_absensi_id, keluar_absensi_id, is_lembur, status, created_at)
         VALUES (?,?,?,?,?,?,?,?, 'incomplete', ?)`,
        [
          g.user_id, g.tanggal, row.retail_id, jadwalId, g.kategori_absen,
          dir === "masuk" ? row.absensi_id : null,
          dir === "keluar" ? row.absensi_id : null,
          g.is_lembur, row.absen_time,
        ]
      );
    };

    for (const g of groups.values()) {
      stats.groups++;
      // Pasangkan by urutan waktu (masuk[i] <-> keluar[i]).
      const n = Math.min(g.masuk.length, g.keluar.length);
      for (let i = 0; i < n; i++) {
        await insertClosed(g, g.masuk[i], g.keluar[i]);
        if (i > 0) stats.multiExtra++;
      }
      // Sisa masuk (tanpa keluar) -> incomplete.
      for (let i = n; i < g.masuk.length; i++) {
        await insertIncomplete(g, g.masuk[i], "masuk");
      }
      // Sisa keluar (tanpa masuk) -> incomplete.
      for (let i = n; i < g.keluar.length; i++) {
        await insertIncomplete(g, g.keluar[i], "keluar");
      }
    }

    if (APPLY) {
      await conn.commit();
      console.log("[APPLIED] backfill committed.");
    } else {
      console.log("[DRY-RUN] tidak ada perubahan. Set APPLY=1 untuk commit.");
    }

    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  } catch (e) {
    if (APPLY) await conn.rollback();
    console.error("[fatal]", e.message);
    process.exit(1);
  } finally {
    conn.release();
  }
})();

// Resolve jadwal_harian.id: match user+tanggal+type (masuk atau keluar).
async function resolveJadwal(conn, g, masukId, keluarId) {
  const typeIds = [];
  if (masukId) {
    const [[m]] = await conn.query(
      "SELECT absen_type_id FROM absensi WHERE absensi_id = ?",
      [masukId]
    );
    if (m) typeIds.push(m.absen_type_id);
  }
  if (keluarId) {
    const [[k]] = await conn.query(
      "SELECT absen_type_id FROM absensi WHERE absensi_id = ?",
      [keluarId]
    );
    if (k) typeIds.push(k.absen_type_id);
  }
  if (typeIds.length === 0) return null;

  const [rows] = await conn.query(
    `SELECT id FROM jadwal_harian
     WHERE user_id = ? AND tanggal = ? AND is_deleted = 0
       AND (absen_masuk_id IN (?) OR absen_keluar_id IN (?))
     LIMIT 1`,
    [g.user_id, g.tanggal, typeIds, typeIds]
  );
  return rows.length > 0 ? rows[0].id : null;
}
