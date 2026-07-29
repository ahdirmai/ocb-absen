require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dbpool = require("../src/config/database");

// ============================================================================
// FIX sesi pairing durasi NEGATIF (off-by-one) — pengganti fix-sameday-mispair.
//
// AKAR MASALAH sebenarnya: sesi 'closed' dgn keluar_time <= masuk_time (durasi
// nol/negatif) — mustahil sesi kerja nyata. Pola off-by-one: keluar hari-N
// tersambung ke masuk hari-(N+1). Termasuk kasus SUBUH (masuk 21 Jul 23:00,
// keluar seharusnya 22 Jul 08:00, tapi ke-pasang 21 Jul 08:00 → negatif).
//
// !!! KENAPA BUKAN "DATE(masuk) <> DATE(keluar)" (versi lama fix-sameday) !!!
// Banyak shift (SORE/K2/SUBUH) ber-flag is_cross_date=0 PADAHAL nyata lintas
// tengah malam (masuk 15:24 → keluar 00:23 besok = durasi POSITIF, sesi SAH).
// Deteksi beda-tanggal salah menandai itu "broken" lalu regroup by DATE →
// merusaknya jadi negatif. Deteksi yang BENAR = durasi negatif (keluar < masuk).
//
// RE-PAIR KRONOLOGIS (bukan group-by-DATE): per (user, is_lembur), urutkan
// SEMUA absensi yang dibebaskan by waktu, jalan maju — tiap MASUK pasang ke
// KELUAR berikutnya (dalam window jam). Natural handle lintas hari, durasi
// selalu positif. Cross-midnight sah TAK tersentuh (tak pernah dibebaskan,
// sesi-nya durasi positif = tak broken).
//
// DRY-RUN default. Commit: APPLY=1 (atau --apply). WAJIB backup + COPY DB dulu.
//   npm run backup-db
//   node scripts/fix-negative-pairing-sesi.js --all              # dry-run semua
//   APPLY=1 node scripts/fix-negative-pairing-sesi.js --all      # eksekusi semua
//   node scripts/fix-negative-pairing-sesi.js --user=366         # 1 user
//   node scripts/fix-negative-pairing-sesi.js --since=2026-07-28 # rentang
//   --summary   rollup per-user (tanpa tabel detail)
//   --window=20 batas jam durasi masuk↔keluar (default 20)
//
// SCOPE WAJIB: --all ATAU --user=<id> ATAU --since=YYYY-MM-DD (cegah tak sengaja).
// ============================================================================

const argv = process.argv.slice(2);
const getArg = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const APPLY = process.env.APPLY === "1" || argv.includes("--apply");
const ALL = argv.includes("--all");
const USER_ID = getArg("user", null);
const SINCE_DATE = getArg("since", null);
const SUMMARY = argv.includes("--summary");
const WINDOW_HOURS = Number(getArg("window", "20"));

const line = (s = "") => console.log(s);

const backupsDir = path.join(__dirname, "..", "backups");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const writeSnapshot = (tag, payload) => {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const f = path.join(backupsDir, `fix-negpair-${tag}-${ts}.json`);
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
const hm = (v) =>
  v instanceof Date
    ? `${String(v.getHours()).padStart(2, "0")}:${String(v.getMinutes()).padStart(2, "0")}`
    : String(v).slice(11, 16);
const dt = (v) => `${ymd(v)} ${hm(v)}`;
const ms = (v) => new Date(v).getTime();

// Kategori sesi = kategori tipe MASUK; fallback kategori tipe KELUAR pasangan
// (by name) bila NULL — selaras engine live (absensi.controller.js).
async function resolveKategori(conn, typeName, kategori) {
  if (kategori) return kategori;
  if (!typeName) return null;
  const [rows] = await conn.query(
    `SELECT kategori_absen FROM tipe_absen
      WHERE name = ? AND is_deleted = 0
        AND (LOWER(description) LIKE '%keluar%' OR LOWER(description) LIKE '%pulang%')
        AND kategori_absen IS NOT NULL AND kategori_absen <> ''
      ORDER BY absen_id LIMIT 1`,
    [typeName]
  );
  return rows.length > 0 ? rows[0].kategori_absen : null;
}

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

// Pasangkan kronologis: events sorted asc by absen_time. Tiap MASUK pasang ke
// KELUAR berikutnya bila durasi 0<dur<=window; else masuk jadi incomplete
// (lupa keluar) & keluar orphan incomplete.
function pairChrono(events, windowHours) {
  const out = [];
  let pending = null; // row masuk yang menunggu keluar
  for (const e of events) {
    if (e.dir === "masuk") {
      if (pending) out.push({ type: "incomplete", masuk: pending, keluar: null });
      pending = e.row;
    } else {
      // keluar
      if (pending) {
        const dur = (ms(e.row.absen_time) - ms(pending.absen_time)) / 3600000;
        if (dur > 0 && dur <= windowHours) {
          out.push({ type: "closed", masuk: pending, keluar: e.row });
          pending = null;
        } else {
          out.push({ type: "incomplete", masuk: pending, keluar: null });
          out.push({ type: "incomplete", masuk: null, keluar: e.row });
          pending = null;
        }
      } else {
        out.push({ type: "incomplete", masuk: null, keluar: e.row });
      }
    }
  }
  if (pending) out.push({ type: "incomplete", masuk: pending, keluar: null });
  return out;
}

(async () => {
  const conn = await dbpool.getConnection();
  const stats = { broken: 0, freedAbsensi: 0, deletedSesi: 0, rebuiltClosed: 0, rebuiltIncomplete: 0 };
  try {
    line(`fix-negative-pairing-sesi  APPLY=${APPLY}  window=${WINDOW_HOURS}h${USER_ID ? `  user=${USER_ID}` : ""}${SINCE_DATE ? `  since=${SINCE_DATE}` : ""}${ALL ? "  all" : ""}`);
    if (!APPLY) line("[DRY-RUN] preview saja — set APPLY=1 untuk commit.");
    if (!ALL && !USER_ID && !SINCE_DATE) {
      line("[stop] SCOPE wajib — beri --all atau --user=<id> atau --since=YYYY-MM-DD.");
      conn.release();
      process.exit(1);
    }

    // ── STEP 1: deteksi sesi broken = closed durasi negatif (keluar <= masuk) ──
    const params = [];
    let scope = "";
    if (USER_ID) { scope += " AND s.user_id = ?"; params.push(USER_ID); }
    if (SINCE_DATE) { scope += " AND s.tanggal >= ?"; params.push(SINCE_DATE); }

    const [broken] = await conn.query(
      `SELECT s.sesi_id, s.user_id, u.username, s.is_lembur,
              s.masuk_absensi_id, s.keluar_absensi_id,
              am.absen_time AS masuk_time, ak.absen_time AS keluar_time,
              tm.name AS shift_name
         FROM absensi_sesi s
         JOIN absensi am     ON am.absensi_id = s.masuk_absensi_id
         JOIN absensi ak     ON ak.absensi_id = s.keluar_absensi_id
         JOIN tipe_absen tm  ON tm.absen_id   = am.absen_type_id
         LEFT JOIN user u    ON u.user_id     = s.user_id
        WHERE s.status = 'closed'
          AND ak.absen_time <= am.absen_time
          ${scope}
        ORDER BY s.user_id, am.absen_time`,
      params
    );
    stats.broken = broken.length;
    line(`\n[broken] sesi closed durasi negatif (keluar<=masuk): ${broken.length}`);
    if (broken.length === 0) {
      line("[done] tak ada sesi broken dalam scope.");
      conn.release();
      process.exit(0);
    }
    if (SUMMARY) {
      const per = new Map();
      for (const b of broken) {
        const k = `${b.user_id}|${b.username || ""}`;
        if (!per.has(k)) per.set(k, { user_id: b.user_id, user: b.username, n: 0 });
        per.get(k).n++;
      }
      console.table([...per.values()].sort((a, b) => b.n - a.n).map((u) => ({ user_id: u.user_id, user: u.user, broken: u.n })));
      line(`[summary] ${per.size} user, ${broken.length} sesi broken.`);
    } else {
      console.table(
        broken.slice(0, 60).map((b) => ({
          sesi_id: b.sesi_id, user: b.username, shift: b.shift_name,
          masuk: dt(b.masuk_time), keluar: dt(b.keluar_time),
        }))
      );
      if (broken.length > 60) line(`… (${broken.length - 60} baris lagi, pakai --summary untuk rollup)`);
    }

    // ── STEP 2: bebaskan absensi dari sesi broken, regroup per (user,is_lembur) ──
    const brokenSesiIds = broken.map((b) => b.sesi_id);
    const freedIds = new Set();
    for (const b of broken) { freedIds.add(b.masuk_absensi_id); freedIds.add(b.keluar_absensi_id); }
    stats.freedAbsensi = freedIds.size;

    const freedArr = [...freedIds];
    const [freedRows] = await conn.query(
      `SELECT a.absensi_id, a.user_id, a.retail_id, a.absen_time, a.is_lembur,
              a.absen_type_id, ta.name AS type_name, ta.description, ta.kategori_absen
         FROM absensi a
         JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
        WHERE a.absensi_id IN (${freedArr.map(() => "?").join(",")})
        ORDER BY a.user_id, a.is_lembur, a.absen_time`,
      freedArr
    );

    // Grup per user|is_lembur, kumpulkan events berarah, urut waktu.
    const groups = new Map();
    for (const r of freedRows) {
      const dir = direction(r.description);
      if (dir === "neither") continue;
      const key = `${r.user_id}|${r.is_lembur === 1 ? 1 : 0}`;
      if (!groups.has(key)) groups.set(key, { user_id: r.user_id, is_lembur: r.is_lembur === 1 ? 1 : 0, events: [] });
      groups.get(key).events.push({ dir, row: r });
    }

    // Rencana pairing kronologis.
    const plan = [];
    for (const g of groups.values()) {
      g.events.sort((a, b) => ms(a.row.absen_time) - ms(b.row.absen_time));
      const paired = pairChrono(g.events, WINDOW_HOURS);
      for (const p of paired) plan.push({ ...p, user_id: g.user_id, is_lembur: g.is_lembur });
    }
    stats.rebuiltClosed = plan.filter((p) => p.type === "closed").length;
    stats.rebuiltIncomplete = plan.filter((p) => p.type === "incomplete").length;

    line(`\n[plan] rebuild → closed: ${stats.rebuiltClosed}, incomplete: ${stats.rebuiltIncomplete}`);
    // Sanity: rencana TAK boleh punya closed durasi negatif (bukti algoritma benar).
    const negPlan = plan.filter((p) => p.type === "closed" && ms(p.keluar.absen_time) <= ms(p.masuk.absen_time));
    line(`[sanity] closed durasi negatif di rencana: ${negPlan.length} (harus 0)`);
    if (!SUMMARY) {
      console.table(
        plan.slice(0, 60).map((p) => ({
          user: p.user_id, status: p.type,
          masuk: p.masuk ? dt(p.masuk.absen_time) : "—",
          keluar: p.keluar ? dt(p.keluar.absen_time) : "—",
        }))
      );
    }

    if (!APPLY) {
      line("\n[DRY-RUN] tidak ada perubahan. Set APPLY=1 untuk commit.");
      conn.release();
      process.exit(0);
    }
    if (negPlan.length > 0) {
      line("[abort] rencana masih mengandung durasi negatif — tak di-apply. Cek data.");
      conn.release();
      process.exit(1);
    }

    // ── STEP 3: eksekusi (transaksi) ──
    await conn.beginTransaction();
    const [snap] = await conn.query(
      `SELECT * FROM absensi_sesi WHERE sesi_id IN (${brokenSesiIds.map(() => "?").join(",")})`,
      brokenSesiIds
    );
    line(`[backup] ${writeSnapshot("sesi", { broken, snapshot: snap })}`);

    const [del] = await conn.query(
      `DELETE FROM absensi_sesi WHERE sesi_id IN (${brokenSesiIds.map(() => "?").join(",")})`,
      brokenSesiIds
    );
    stats.deletedSesi = del.affectedRows;

    for (const p of plan) {
      const anchor = p.masuk || p.keluar;
      const tanggal = ymd(anchor.absen_time);
      const src = p.masuk || p.keluar;
      const kategori = await resolveKategori(conn, src.type_name, src.kategori_absen);
      const jadwalId = await resolveJadwal(conn, p.user_id, tanggal, [p.masuk?.absen_type_id, p.keluar?.absen_type_id]);
      await conn.query(
        `INSERT INTO absensi_sesi
           (user_id, tanggal, retail_id, jadwal_id, kategori_absen,
            masuk_absensi_id, keluar_absensi_id, is_lembur, status, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          p.user_id, tanggal, anchor.retail_id, jadwalId, kategori,
          p.masuk ? p.masuk.absensi_id : null,
          p.keluar ? p.keluar.absensi_id : null,
          p.is_lembur, p.type, anchor.absen_time,
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
