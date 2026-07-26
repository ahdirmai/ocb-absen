require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// Normalisasi tipe_absen.kategori_absen → Title Case (mis. 'sore'→'Sore',
// 'malam'→'Malam', 'pagi'→'Pagi'). Casing campur bikin banding kategori
// masuk↔keluar gagal (guard tipe keluar FE/BE case-sensitive di build lama) →
// tipe keluar cross-date tak tampil. Setelah normalisasi, masuk & keluar
// sekategori dgn casing sama → cocok tanpa perlu rebuild FE.
//
// DRY-RUN default. Set APPLY=1 untuk commit. Snapshot before → backups/.
//   node scripts/normalize-kategori-absen.js
//   APPLY=1 node scripts/normalize-kategori-absen.js

const argv = process.argv.slice(2);
const APPLY = process.env.APPLY === "1" || argv.includes("--apply");

const DB_HOST_RAW = process.env.DB_HOST || "127.0.0.1";
const DB_HOST = DB_HOST_RAW === "localhost" ? "127.0.0.1" : DB_HOST_RAW;
const dbConfig = {
  host: DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
  dateStrings: true,
};

const titleCase = (s) => {
  const str = String(s || "").trim();
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

(async () => {
  const conn = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await conn.query(
      `SELECT absen_id, name, description, kategori_absen
         FROM tipe_absen
        WHERE is_deleted = 0
          AND kategori_absen IS NOT NULL AND kategori_absen <> ''`
    );
    // Baris yg butuh normalisasi (casing beda dari Title Case).
    const changes = rows
      .map((r) => ({ ...r, normalized: titleCase(r.kategori_absen) }))
      .filter((r) => r.kategori_absen !== r.normalized);

    console.log(`\n[plan] normalisasi kategori_absen → Title Case  APPLY=${APPLY}`);
    console.table(
      changes.map((r) => ({
        absen_id: r.absen_id,
        name: r.name,
        from: r.kategori_absen,
        to: r.normalized,
      }))
    );
    console.log(`[stats] akan berubah: ${changes.length}`);

    if (changes.length === 0) {
      console.log("[done] semua kategori sudah Title Case.");
      await conn.end();
      process.exit(0);
    }
    if (!APPLY) {
      console.log("\n[DRY-RUN] tidak ada perubahan. Set APPLY=1 untuk commit.");
      await conn.end();
      process.exit(0);
    }

    // Snapshot before.
    const backupsDir = path.join(__dirname, "..", "backups");
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupsDir, `normalize-kategori-${ts}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({ changes }, null, 2));
    console.log(`[backup] ${changes.length} baris → ${backupFile}`);

    await conn.beginTransaction();
    let updated = 0;
    for (const r of changes) {
      const [res] = await conn.query(
        `UPDATE tipe_absen SET kategori_absen = ?, updated_at = NOW() WHERE absen_id = ?`,
        [r.normalized, r.absen_id]
      );
      updated += res.affectedRows;
    }
    await conn.commit();
    console.log(`\n[APPLIED] ${updated} baris di-normalisasi.`);

    const [after] = await conn.query(
      `SELECT kategori_absen, COUNT(*) c FROM tipe_absen
        WHERE is_deleted = 0 AND kategori_absen IS NOT NULL AND kategori_absen <> ''
        GROUP BY kategori_absen ORDER BY kategori_absen`
    );
    console.log("[verify] distinct kategori sesudah:");
    console.table(after);

    await conn.end();
    process.exit(0);
  } catch (e) {
    try { if (APPLY) await conn.rollback(); } catch (_) {}
    console.error("[fatal]", e.message);
    await conn.end().catch(() => {});
    process.exit(1);
  }
})();
