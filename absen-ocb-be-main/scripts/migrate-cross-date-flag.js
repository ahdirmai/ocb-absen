require("dotenv").config();
const dbpool = require("../src/config/database");

// Migrasi idempotent: tambah kolom tipe_absen.is_cross_date + backfill.
// Menandai shift yang keluarnya lewat tengah malam (masuk hari-N, keluar N+1).
// Lihat docs/cross-date-flag.sql + docs/cross-date-flag-plan.md.
(async () => {
  try {
    // 1. Tambah kolom is_cross_date (idempotent via SHOW COLUMNS).
    const [col] = await dbpool.query(
      "SHOW COLUMNS FROM tipe_absen LIKE 'is_cross_date'"
    );
    if (col.length === 0) {
      await dbpool.query(
        "ALTER TABLE tipe_absen ADD COLUMN is_cross_date TINYINT(1) NOT NULL DEFAULT 0 AFTER kategori_absen"
      );
      console.log("[ok] kolom is_cross_date ditambah ke tipe_absen");
    } else {
      console.log("[skip] kolom is_cross_date sudah ada");
    }

    // 2. Backfill konservatif: tipe yang JELAS cross-date by konvensi.
    //    SORE 9 JAM: 7,49,50,51,52 | SUBUH 9 JAM: 8,53,54,55,56
    //    SUBUH standalone: 107,108. Sisanya set manual via toggle CatAbsen.
    const crossIds = [7, 49, 50, 51, 52, 8, 53, 54, 55, 56, 107, 108];
    const [res] = await dbpool.query(
      `UPDATE tipe_absen SET is_cross_date = 1 WHERE absen_id IN (?)`,
      [crossIds]
    );
    console.log(`[ok] backfill is_cross_date=1: ${res.affectedRows} baris terpengaruh`);

    // 3. Verifikasi hasil.
    const [rows] = await dbpool.query(
      `SELECT absen_id, name, kategori_absen, is_cross_date
       FROM tipe_absen WHERE is_cross_date = 1 ORDER BY absen_id`
    );
    console.log(`[info] total tipe cross-date sekarang: ${rows.length}`);
    rows.forEach((r) =>
      console.log(`  #${r.absen_id} ${r.name} (${r.kategori_absen || "-"})`)
    );

    console.log("Migrasi cross-date-flag selesai.");
    process.exit(0);
  } catch (err) {
    console.error("Migrasi gagal:", err.message || err);
    process.exit(1);
  }
})();
