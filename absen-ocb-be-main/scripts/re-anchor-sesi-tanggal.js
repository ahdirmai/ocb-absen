require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dbpool = require("../src/config/database");

// ============================================================================
// RE-ANCHOR absensi_sesi.tanggal — perbaiki off-by-one dari backfill lama.
//
// AKAR MASALAH: backfill-sesi.js versi lama meng-anchor tanggal via
// `absen_time.toISOString().slice(0,10)` = UTC. Untuk masuk 00:00-07:59 WITA
// (16:00-24:00 UTC) tanggal tergeser ke HARI KEMARIN. Akibat: di rekap strict,
// completeMap (key user_YYYY-MM-DD) miss di hari benar → sesi lengkap tampil TL.
// (Live flow tak kena: pakai moment().tz. Bug murni data backfill historis.)
//
// PERBAIKAN: set tanggal = DATE(absen_time baris anchor). DATE() MySQL membaca
// literal wall-clock WITA dengan benar (verified) — tak perlu konversi TZ.
//   - sesi punya masuk  -> anchor ke DATE(masuk.absen_time)   [aturan utama]
//   - keluar-only orphan -> anchor ke DATE(keluar.absen_time) [konsistensi]
//
// IDEMPOTEN: hanya sentuh baris yang DATE(tanggal) <> DATE(anchor). Aman ulang.
// DRY-RUN default. Commit: APPLY=1 (atau --apply). WAJIB backup dulu.
//   npm run backup-db
//   node scripts/re-anchor-sesi-tanggal.js               # dry-run (preview)
//   node scripts/re-anchor-sesi-tanggal.js --summary     # dry-run rollup/bulan
//   APPLY=1 node scripts/re-anchor-sesi-tanggal.js       # eksekusi
// ============================================================================

const argv = process.argv.slice(2);
const APPLY = process.env.APPLY === "1" || argv.includes("--apply");
const SUMMARY = argv.includes("--summary");

const line = (s = "") => console.log(s);

const backupsDir = path.join(__dirname, "..", "backups");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const writeSnapshot = (tag, payload) => {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const f = path.join(backupsDir, `re-anchor-sesi-${tag}-${ts}.json`);
  fs.writeFileSync(f, JSON.stringify(payload, null, 2));
  return f;
};

// Baris mismatch: sesi.tanggal beda dari tanggal baris anchor (masuk > keluar).
const SELECT_MISMATCH = `
  SELECT s.sesi_id, s.user_id, s.status,
         DATE_FORMAT(s.tanggal, '%Y-%m-%d') AS tgl_lama,
         DATE_FORMAT(COALESCE(DATE(m.absen_time), DATE(k.absen_time)), '%Y-%m-%d') AS tgl_baru,
         CASE WHEN s.masuk_absensi_id IS NOT NULL THEN 'masuk' ELSE 'keluar' END AS anchor
    FROM absensi_sesi s
    LEFT JOIN absensi m ON m.absensi_id = s.masuk_absensi_id
    LEFT JOIN absensi k ON k.absensi_id = s.keluar_absensi_id
   WHERE COALESCE(DATE(m.absen_time), DATE(k.absen_time)) IS NOT NULL
     AND DATE(s.tanggal) <> COALESCE(DATE(m.absen_time), DATE(k.absen_time))
`;

(async () => {
  const conn = await dbpool.getConnection();
  try {
    line(`re-anchor-sesi-tanggal  APPLY=${APPLY}`);
    if (!APPLY) line("[DRY-RUN] preview saja — set APPLY=1 untuk commit.\n");

    const [rows] = await conn.query(SELECT_MISMATCH);
    line(`sesi mismatch: ${rows.length}`);
    if (rows.length === 0) {
      line("Tak ada yang perlu diperbaiki.");
      conn.release();
      process.exit(0);
    }

    // Rollup per bulan (tgl_baru = tanggal benar).
    const perBulan = {};
    for (const r of rows) {
      const b = r.tgl_baru.slice(0, 7);
      perBulan[b] = (perBulan[b] || 0) + 1;
    }
    line("\n=== mismatch per bulan (tanggal benar) ===");
    console.table(
      Object.entries(perBulan)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([bln, c]) => ({ bln, c }))
    );

    if (!SUMMARY) {
      line("\n=== sample (maks 20) ===");
      console.table(
        rows.slice(0, 20).map((r) => ({
          sesi_id: r.sesi_id, user_id: r.user_id, status: r.status,
          anchor: r.anchor, dari: r.tgl_lama, ke: r.tgl_baru,
        }))
      );
    }

    if (!APPLY) {
      line("\n[DRY-RUN] tak ada perubahan. Set APPLY=1 untuk commit.");
      conn.release();
      process.exit(0);
    }

    // Snapshot sebelum ubah (sesi_id + tanggal lama) untuk rollback manual.
    line(`\n[backup] ${writeSnapshot("plan", rows)}`);

    await conn.beginTransaction();
    // Update masuk-anchored.
    const [resMasuk] = await conn.query(`
      UPDATE absensi_sesi s
        JOIN absensi m ON m.absensi_id = s.masuk_absensi_id
         SET s.tanggal = DATE(m.absen_time), s.updated_at = NOW()
       WHERE s.masuk_absensi_id IS NOT NULL
         AND DATE(s.tanggal) <> DATE(m.absen_time)
    `);
    // Update keluar-only orphan.
    const [resKeluar] = await conn.query(`
      UPDATE absensi_sesi s
        JOIN absensi k ON k.absensi_id = s.keluar_absensi_id
         SET s.tanggal = DATE(k.absen_time), s.updated_at = NOW()
       WHERE s.masuk_absensi_id IS NULL
         AND s.keluar_absensi_id IS NOT NULL
         AND DATE(s.tanggal) <> DATE(k.absen_time)
    `);
    await conn.commit();

    line(`[applied] masuk-anchored: ${resMasuk.affectedRows}, keluar-orphan: ${resKeluar.affectedRows}`);
    line(`[total] ${resMasuk.affectedRows + resKeluar.affectedRows} sesi di-re-anchor.`);
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error("[fatal]", e.message);
    conn.release();
    process.exit(1);
  }
})();
