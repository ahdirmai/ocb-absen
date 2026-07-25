require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dbpool = require("../src/config/database");

// Migrasi lengkap DB dari schema lama → fitur baru (jadwal_harian, absensi_sesi,
// cross-date, koreksi). Idempotent + urut dependency FK. Jalankan sekali.
// WAJIB backup dulu.

const colExists = async (table, col) => {
  const [r] = await dbpool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [col]);
  return r.length > 0;
};
const tableExists = async (table) => {
  const [r] = await dbpool.query(`SHOW TABLES LIKE ?`, [table]);
  return r.length > 0;
};

(async () => {
  try {
    // ── Step 1: shifting.uses_jadwal_harian + buang retail.uses_jadwal_harian ──
    if (!(await colExists("shifting", "uses_jadwal_harian"))) {
      await dbpool.query(
        "ALTER TABLE shifting ADD COLUMN uses_jadwal_harian TINYINT(1) NOT NULL DEFAULT 0 AFTER retail_id"
      );
      console.log("[ok] shifting.uses_jadwal_harian ditambah");
    } else {
      console.log("[skip] shifting.uses_jadwal_harian sudah ada");
    }
    if (await colExists("retail", "uses_jadwal_harian")) {
      await dbpool.query("ALTER TABLE retail DROP COLUMN uses_jadwal_harian");
      console.log("[ok] retail.uses_jadwal_harian dibuang");
    } else {
      console.log("[skip] retail.uses_jadwal_harian tak ada");
    }

    // ── Step 2: jadwal_harian (CREATE IF NOT EXISTS — TAK drop, jaga data) ──
    const jadwalSql = fs.readFileSync(
      path.resolve(__dirname, "../docs/jadwal-harian.sql"),
      "utf8"
    );
    await dbpool.query(jadwalSql);
    console.log("[ok] jadwal_harian dipastikan ada (CREATE IF NOT EXISTS)");

    // ── Step 2b: absensi.is_lembur ──
    if (!(await colExists("absensi", "is_lembur"))) {
      await dbpool.query(
        "ALTER TABLE absensi ADD COLUMN is_lembur TINYINT(1) NOT NULL DEFAULT 0 AFTER is_valid"
      );
      console.log("[ok] absensi.is_lembur ditambah");
    } else {
      console.log("[skip] absensi.is_lembur sudah ada");
    }

    // ── Step 2c: menu jadwal-harian (navigation_links + access) ──
    const menuPath = "/jadwal-harian";
    const [existMenu] = await dbpool.query(
      "SELECT id FROM navigation_links WHERE path = ? LIMIT 1",
      [menuPath]
    );
    let menuId;
    if (existMenu.length > 0) {
      menuId = existMenu[0].id;
      console.log(`[skip] menu jadwal-harian sudah ada (id=${menuId})`);
    } else {
      const [res] = await dbpool.query(
        "INSERT INTO navigation_links (name, path, icon, submenu_id, parent_id, is_active) VALUES (?,?,?,?,?,?)",
        ["Jadwal Shift Harian", menuPath, "mdi-calendar-check", null, null, 1]
      );
      menuId = res.insertId;
      console.log(`[ok] menu jadwal-harian dibuat (id=${menuId})`);
    }
    // Grant akses mirror menu Shift (id=8)
    const [shiftGrants] = await dbpool.query(
      "SELECT DISTINCT category_id FROM navigation_access WHERE menu_id = 8 AND is_deleted = 0"
    );
    for (const g of shiftGrants) {
      const [has] = await dbpool.query(
        "SELECT id FROM navigation_access WHERE category_id = ? AND menu_id = ? AND is_deleted = 0 LIMIT 1",
        [g.category_id, menuId]
      );
      if (has.length === 0) {
        await dbpool.query(
          "INSERT INTO navigation_access (category_id, menu_id, created_at, created_by) VALUES (?,?,NOW(),?)",
          [g.category_id, menuId, "migration"]
        );
        console.log(`[ok] grant kategori ${g.category_id} -> jadwal-harian`);
      }
    }

    // ── Step 3: absensi_sesi (butuh jadwal_harian) ──
    if (!(await tableExists("absensi_sesi"))) {
      const sesiSql = fs.readFileSync(
        path.resolve(__dirname, "../docs/absensi-sesi.sql"),
        "utf8"
      );
      await dbpool.query(sesiSql);
      console.log("[ok] absensi_sesi dibuat");
    } else {
      console.log("[skip] absensi_sesi sudah ada");
    }

    // ── Step 4: tipe_absen.is_cross_date + backfill ──
    if (!(await colExists("tipe_absen", "is_cross_date"))) {
      await dbpool.query(
        "ALTER TABLE tipe_absen ADD COLUMN is_cross_date TINYINT(1) NOT NULL DEFAULT 0 AFTER kategori_absen"
      );
      console.log("[ok] tipe_absen.is_cross_date ditambah");
    } else {
      console.log("[skip] tipe_absen.is_cross_date sudah ada");
    }
    const crossIds = [7, 49, 50, 51, 52, 8, 53, 54, 55, 56, 107, 108];
    const [cd] = await dbpool.query(
      "UPDATE tipe_absen SET is_cross_date = 1 WHERE absen_id IN (?)",
      [crossIds]
    );
    console.log(`[ok] backfill is_cross_date=1: ${cd.affectedRows} baris`);

    // ── Step 5: absensi audit (updated_by, updated_at) ──
    if (!(await colExists("absensi", "updated_by"))) {
      await dbpool.query(
        "ALTER TABLE absensi ADD COLUMN updated_by INT NULL DEFAULT NULL AFTER approved_at"
      );
      console.log("[ok] absensi.updated_by ditambah");
    } else {
      console.log("[skip] absensi.updated_by sudah ada");
    }
    if (!(await colExists("absensi", "updated_at"))) {
      await dbpool.query(
        "ALTER TABLE absensi ADD COLUMN updated_at DATETIME NULL DEFAULT NULL AFTER updated_by"
      );
      console.log("[ok] absensi.updated_at ditambah");
    } else {
      console.log("[skip] absensi.updated_at sudah ada");
    }

    console.log("\n=== MIGRASI SELESAI ===");
    console.log("Opsional: backfill sesi historis → node scripts/backfill-sesi.js (dry-run), lalu APPLY=1.");
    process.exit(0);
  } catch (err) {
    console.error("[FATAL] migrasi gagal:", err.message || err);
    process.exit(1);
  }
})();
