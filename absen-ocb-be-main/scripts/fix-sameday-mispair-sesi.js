require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dbpool = require("../src/config/database");

// ============================================================================
// FIX sesi same-day mispair (off-by-one) — jalankan sekali di server.
//
// Akar masalah: sesi 'closed' shift SAME-DAY (is_cross_date=0) yang absen
// masuk & keluarnya JATUH DI TANGGAL BERBEDA. Untuk shift harian (mis. PAGI
// sales: masuk 07:00, keluar 16:00 hari sama) ini mustahil benar — pertanda
// pairing salah, mis. keluar hari-N tersambung ke masuk hari-N+1 (geser +1
// hari). Umumnya lahir dari MATCH MANUAL lama (window ABS <= 20 jam, kini
// sudah diperketat jadi terarah di findMatchCandidates/matchSesi).
//
// fix-cross-date-sesi.js TIDAK menangani kelas ini (filternya is_cross_date=1).
//
// Strategi (idempoten, per user dalam scope):
//   1. Deteksi sesi closed broken: is_lembur=0, tipe masuk is_cross_date=0,
//      DATE(masuk) <> DATE(keluar).
//   2. Bebaskan SEMUA absensi (masuk+keluar) yang tereferensi sesi broken itu.
//   3. Hapus sesi broken (snapshot dulu).
//   4. Regroup absensi bebas by user|DATE(absen_time)|is_lembur, pasangkan
//      SAME-DAY urut waktu (masuk[i] <-> keluar[i]) -> closed; sisa -> incomplete.
//   Boundary orphan (masuk hari-1 / keluar hari-akhir yang tadinya ter-mispair)
//   jadi incomplete — benar, memang tak ada pasangan same-day.
//
// BATAS: hanya membebaskan absensi dari sesi BROKEN. Bila pasangan same-day yg
// benar sedang nyangkut di sesi INCOMPLETE terpisah (bukan broken-closed), ia tak
// ikut dibebaskan → hasil rebuild bisa 2 incomplete alih-alih 1 closed. Aman (tak
// bikin pairing palsu), tapi tak selalu sembuh penuh. Review tabel dry-run; sisa
// incomplete bisa di-match manual (kini guard kronologi sudah ketat).
//
// DRY-RUN default. Commit: APPLY=1 (atau --apply). WAJIB backup + COPY DB dulu.
//   npm run backup-db
//   node scripts/fix-sameday-mispair-sesi.js --user=511            # dry-run
//   APPLY=1 node scripts/fix-sameday-mispair-sesi.js --user=511    # eksekusi
//   node scripts/fix-sameday-mispair-sesi.js --since=2026-07-01    # lintas user
//
// SCOPE WAJIB (cegah sentuh histori luas): --user=<id> ATAU --since=YYYY-MM-DD.
//   --user=<id>         batasi ke satu user.
//   --since=YYYY-MM-DD  batasi ke sesi broken dgn tanggal >= ini.
// Tanpa keduanya → script berhenti (tak melakukan apa-apa).
//
// SEMUA user sekaligus: pakai --since dgn tanggal sebelum data paling awal.
//   node scripts/fix-sameday-mispair-sesi.js --since=2026-01-01 --summary  # rollup per-user
//   APPLY=1 node scripts/fix-sameday-mispair-sesi.js --since=2026-01-01
//
// --summary  tampilkan rollup per-user (jumlah broken + rentang tanggal) alih-alih
//            tabel detail per-sesi. Enak untuk review massal sebelum APPLY.
// ============================================================================

const argv = process.argv.slice(2);
const getArg = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const APPLY = process.env.APPLY === "1" || argv.includes("--apply");
const USER_ID = getArg("user", null);
const SINCE_DATE = getArg("since", null);
const SUMMARY = argv.includes("--summary"); // ringkas per-user, tanpa tabel detail

const line = (s = "") => console.log(s);

const backupsDir = path.join(__dirname, "..", "backups");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const writeSnapshot = (tag, payload) => {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const f = path.join(backupsDir, `fix-sameday-${tag}-${ts}.json`);
  fs.writeFileSync(f, JSON.stringify(payload, null, 2));
  return f;
};

const direction = (desc) => {
  const d = String(desc || "").toLowerCase();
  if (d.includes("keluar") || d.includes("pulang")) return "keluar";
  if (d.includes("masuk")) return "masuk";
  return "neither";
};

const ymd = (v) =>
  v instanceof Date
    ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`
    : String(v).slice(0, 10);

// Kategori sesi = kategori tipe MASUK; fallback kategori tipe KELUAR pasangan
// (by name) bila NULL — selaras engine live (absensi.controller.js).
async function resolveKategori(conn, masukType) {
  if (masukType.kategori_absen) return masukType.kategori_absen;
  if (!masukType.name) return null;
  const [rows] = await conn.query(
    `SELECT kategori_absen FROM tipe_absen
      WHERE name = ? AND is_deleted = 0
        AND (LOWER(description) LIKE '%keluar%' OR LOWER(description) LIKE '%pulang%')
        AND kategori_absen IS NOT NULL AND kategori_absen <> ''
      ORDER BY absen_id LIMIT 1`,
    [masukType.name]
  );
  return rows.length > 0 ? rows[0].kategori_absen : null;
}

// jadwal_harian.id via match user+tanggal+type (masuk atau keluar).
async function resolveJadwal(conn, userId, tanggal, typeIds) {
  const ids = typeIds.filter((t) => t != null);
  if (ids.length === 0) return null;
  const [rows] = await conn.query(
    `SELECT id FROM jadwal_harian
      WHERE user_id = ? AND tanggal = ? AND is_deleted = 0
        AND (absen_masuk_id IN (?) OR absen_keluar_id IN (?))
      LIMIT 1`,
    [userId, tanggal, ids, ids]
  );
  return rows.length > 0 ? rows[0].id : null;
}

(async () => {
  const conn = await dbpool.getConnection();
  const stats = {
    broken: 0,
    freedAbsensi: 0,
    deletedSesi: 0,
    rebuiltClosed: 0,
    rebuiltIncomplete: 0,
  };
  try {
    line(`fix-sameday-mispair-sesi  APPLY=${APPLY}${USER_ID ? `  user=${USER_ID}` : ""}${SINCE_DATE ? `  since=${SINCE_DATE}` : ""}`);
    if (!APPLY) line("[DRY-RUN] preview saja — set APPLY=1 untuk commit.");

    if (!USER_ID && !SINCE_DATE) {
      line("[stop] SCOPE wajib — beri --user=<id> atau --since=YYYY-MM-DD.");
      conn.release();
      process.exit(1);
    }

    // ── STEP 1: deteksi sesi broken ──
    const params = [];
    let scope = "";
    if (USER_ID) { scope += " AND s.user_id = ?"; params.push(USER_ID); }
    if (SINCE_DATE) { scope += " AND s.tanggal >= ?"; params.push(SINCE_DATE); }

    const [broken] = await conn.query(
      `SELECT s.sesi_id, s.user_id, u.username, s.tanggal, s.retail_id,
              s.masuk_absensi_id, s.keluar_absensi_id,
              am.absen_time AS masuk_time, ak.absen_time AS keluar_time,
              tm.name AS shift_name
         FROM absensi_sesi s
         JOIN absensi am     ON am.absensi_id = s.masuk_absensi_id
         JOIN absensi ak     ON ak.absensi_id = s.keluar_absensi_id
         JOIN tipe_absen tm  ON tm.absen_id   = am.absen_type_id
         LEFT JOIN user u    ON u.user_id     = s.user_id
        WHERE s.status = 'closed'
          AND s.is_lembur = 0
          AND COALESCE(tm.is_cross_date, 0) = 0
          AND DATE(am.absen_time) <> DATE(ak.absen_time)
          ${scope}
        ORDER BY s.user_id, am.absen_time`,
      params
    );
    stats.broken = broken.length;
    line(`\n[broken] sesi closed same-day beda tanggal: ${broken.length}`);
    if (SUMMARY) {
      // Rollup per-user: jumlah sesi broken + rentang tanggal. Enak utk review massal.
      const perUser = new Map();
      for (const b of broken) {
        const k = `${b.user_id}|${b.username || ""}`;
        if (!perUser.has(k)) perUser.set(k, { user_id: b.user_id, user: b.username, broken: 0, min: null, max: null });
        const u = perUser.get(k);
        u.broken++;
        const d = ymd(b.masuk_time);
        if (!u.min || d < u.min) u.min = d;
        if (!u.max || d > u.max) u.max = d;
      }
      console.table(
        [...perUser.values()]
          .sort((a, b) => b.broken - a.broken)
          .map((u) => ({ user_id: u.user_id, user: u.user, broken: u.broken, dari: u.min, sampai: u.max }))
      );
      line(`[summary] ${perUser.size} user terdampak, ${broken.length} sesi broken.`);
    } else {
      console.table(
        broken.map((b) => ({
          sesi_id: b.sesi_id, user: b.username, shift: b.shift_name,
          masuk: ymd(b.masuk_time) + " " + String(b.masuk_time).slice(11, 16),
          keluar: ymd(b.keluar_time) + " " + String(b.keluar_time).slice(11, 16),
        }))
      );
    }
    if (broken.length === 0) {
      line("[done] tak ada sesi broken dalam scope.");
      conn.release();
      process.exit(0);
    }

    // ── STEP 2: kumpulkan absensi yang dibebaskan (per user) ──
    // Ambil semua absensi_id yang tereferensi sesi broken.
    const brokenSesiIds = broken.map((b) => b.sesi_id);
    const freedIds = new Set();
    for (const b of broken) {
      freedIds.add(b.masuk_absensi_id);
      freedIds.add(b.keluar_absensi_id);
    }
    stats.freedAbsensi = freedIds.size;

    // Detail absensi bebas + tipe (untuk regroup same-day).
    const freedArr = [...freedIds];
    const [freedRows] = await conn.query(
      `SELECT a.absensi_id, a.user_id, a.retail_id, a.absen_time, a.is_lembur,
              a.absen_type_id, ta.name AS type_name, ta.description, ta.kategori_absen
         FROM absensi a
         JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
        WHERE a.absensi_id IN (${freedArr.map(() => "?").join(",")})
        ORDER BY a.user_id, a.absen_time`,
      freedArr
    );

    // Regroup by user|DATE|is_lembur (is_lembur pasti 0 di sini, tapi jaga eksplisit).
    const groups = new Map();
    for (const r of freedRows) {
      const key = `${r.user_id}|${ymd(r.absen_time)}|${r.is_lembur === 1 ? 1 : 0}`;
      if (!groups.has(key)) groups.set(key, { user_id: r.user_id, tanggal: ymd(r.absen_time), masuk: [], keluar: [] });
      const g = groups.get(key);
      const dir = direction(r.description);
      if (dir === "masuk") g.masuk.push(r);
      else if (dir === "keluar") g.keluar.push(r);
    }

    // Rencana pairing same-day.
    const plan = [];
    for (const g of groups.values()) {
      const n = Math.min(g.masuk.length, g.keluar.length);
      for (let i = 0; i < n; i++) plan.push({ type: "closed", g, masuk: g.masuk[i], keluar: g.keluar[i] });
      for (let i = n; i < g.masuk.length; i++) plan.push({ type: "incomplete", g, masuk: g.masuk[i], keluar: null });
      for (let i = n; i < g.keluar.length; i++) plan.push({ type: "incomplete", g, masuk: null, keluar: g.keluar[i] });
    }
    stats.rebuiltClosed = plan.filter((p) => p.type === "closed").length;
    stats.rebuiltIncomplete = plan.filter((p) => p.type === "incomplete").length;

    line(`\n[plan] rebuild → closed: ${stats.rebuiltClosed}, incomplete: ${stats.rebuiltIncomplete}`);
    if (!SUMMARY) {
      console.table(
        plan.map((p) => ({
          tgl: p.g.tanggal,
          user: p.g.user_id,
          status: p.type,
          masuk: p.masuk ? String(p.masuk.absen_time).slice(0, 16) : "—",
          keluar: p.keluar ? String(p.keluar.absen_time).slice(0, 16) : "—",
        }))
      );
    }

    if (!APPLY) {
      line("\n[DRY-RUN] tidak ada perubahan. Set APPLY=1 untuk commit.");
      conn.release();
      process.exit(0);
    }

    // ── STEP 3: eksekusi (transaksi) ──
    await conn.beginTransaction();

    // Snapshot sesi broken sebelum hapus.
    const [snap] = await conn.query(
      `SELECT * FROM absensi_sesi WHERE sesi_id IN (${brokenSesiIds.map(() => "?").join(",")})`,
      brokenSesiIds
    );
    line(`[backup] ${writeSnapshot("sesi", { broken, plan: plan.map((p) => ({ ...p, g: undefined, tanggal: p.g.tanggal, user_id: p.g.user_id })), snapshot: snap })}`);

    // Hapus sesi broken.
    const [del] = await conn.query(
      `DELETE FROM absensi_sesi WHERE sesi_id IN (${brokenSesiIds.map(() => "?").join(",")})`,
      brokenSesiIds
    );
    stats.deletedSesi = del.affectedRows;

    // Insert sesi hasil rebuild.
    for (const p of plan) {
      const anchor = p.masuk || p.keluar;
      const masukType = p.masuk
        ? { name: p.masuk.type_name, kategori_absen: p.masuk.kategori_absen }
        : { name: p.keluar.type_name, kategori_absen: p.keluar.kategori_absen };
      const kategori = await resolveKategori(conn, masukType);
      const jadwalId = await resolveJadwal(conn, p.g.user_id, p.g.tanggal, [
        p.masuk?.absen_type_id,
        p.keluar?.absen_type_id,
      ]);
      await conn.query(
        `INSERT INTO absensi_sesi
           (user_id, tanggal, retail_id, jadwal_id, kategori_absen,
            masuk_absensi_id, keluar_absensi_id, is_lembur, status, created_at)
         VALUES (?,?,?,?,?,?,?,0,?,?)`,
        [
          p.g.user_id,
          p.g.tanggal,
          anchor.retail_id,
          jadwalId,
          kategori,
          p.masuk ? p.masuk.absensi_id : null,
          p.keluar ? p.keluar.absensi_id : null,
          p.type,
          anchor.absen_time,
        ]
      );
    }

    await conn.commit();
    line(`\n[COMMIT] sukses.`);
    line("[summary] " + JSON.stringify(stats));
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error("[fatal]", e.message);
    conn.release();
    process.exit(1);
  }
})();
