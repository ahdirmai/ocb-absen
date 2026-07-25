require("dotenv").config();
const dbpool = require("../src/config/database");

// Migrasi idempotent: tambah kolom audit absensi.updated_by + updated_at
// untuk fitur Koreksi Absen. Lihat docs/absensi-koreksi.sql.
(async () => {
  try {
    const [byCol] = await dbpool.query(
      "SHOW COLUMNS FROM absensi LIKE 'updated_by'"
    );
    if (byCol.length === 0) {
      await dbpool.query(
        "ALTER TABLE absensi ADD COLUMN updated_by INT NULL DEFAULT NULL AFTER approved_at"
      );
      console.log("[ok] kolom updated_by ditambah ke absensi");
    } else {
      console.log("[skip] kolom updated_by sudah ada");
    }

    const [atCol] = await dbpool.query(
      "SHOW COLUMNS FROM absensi LIKE 'updated_at'"
    );
    if (atCol.length === 0) {
      await dbpool.query(
        "ALTER TABLE absensi ADD COLUMN updated_at DATETIME NULL DEFAULT NULL AFTER updated_by"
      );
      console.log("[ok] kolom updated_at ditambah ke absensi");
    } else {
      console.log("[skip] kolom updated_at sudah ada");
    }

    console.log("Migrasi absensi-koreksi selesai.");
    process.exit(0);
  } catch (err) {
    console.error("Migrasi gagal:", err.message || err);
    process.exit(1);
  }
})();
