require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dbpool = require("../src/config/database");

(async () => {
  try {
    // 1. Buat tabel jadwal_harian
    const ddl = fs.readFileSync(
      path.resolve(__dirname, "../docs/jadwal-harian.sql"),
      "utf8"
    );
    await dbpool.query(ddl);
    console.log("[ok] tabel jadwal_harian dibuat / sudah ada");

    // 2. Menu sidebar: navigation_links (idempotent by path)
    const menuPath = "/jadwal-harian";
    const [existing] = await dbpool.query(
      "SELECT id FROM navigation_links WHERE path = ? LIMIT 1",
      [menuPath]
    );

    let menuId;
    if (existing.length > 0) {
      menuId = existing[0].id;
      console.log(`[skip] menu sudah ada (id=${menuId})`);
    } else {
      const [res] = await dbpool.query(
        "INSERT INTO navigation_links (name, path, icon, submenu_id, parent_id, is_active) VALUES (?,?,?,?,?,?)",
        ["Jadwal Shift Harian", menuPath, "mdi-calendar-check", null, null, 1]
      );
      menuId = res.insertId;
      console.log(`[ok] menu dibuat (id=${menuId})`);
    }

    // 3. Grant akses: mirror kategori yang punya menu Shift (id=8)
    const [shiftGrants] = await dbpool.query(
      "SELECT DISTINCT category_id FROM navigation_access WHERE menu_id = 8 AND is_deleted = 0"
    );
    const categories = shiftGrants.map((r) => r.category_id);
    console.log(`[info] kategori target: ${categories.join(", ") || "(none)"}`);

    for (const catId of categories) {
      const [has] = await dbpool.query(
        "SELECT id FROM navigation_access WHERE category_id = ? AND menu_id = ? AND is_deleted = 0 LIMIT 1",
        [catId, menuId]
      );
      if (has.length > 0) {
        console.log(`[skip] grant kategori ${catId} sudah ada`);
        continue;
      }
      await dbpool.query(
        "INSERT INTO navigation_access (category_id, menu_id, created_at, created_by) VALUES (?,?,NOW(),?)",
        [catId, menuId, "migration"]
      );
      console.log(`[ok] grant kategori ${catId} -> menu ${menuId}`);
    }

    console.log("Migrasi selesai.");
    process.exit(0);
  } catch (err) {
    console.error("Migrasi gagal:", err.message || err);
    process.exit(1);
  }
})();
