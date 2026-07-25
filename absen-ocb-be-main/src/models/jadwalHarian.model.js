const dbpool = require("../config/database");

// Kategori user yang memakai jadwal shift harian: Sales Toko (18) & Trainee Sales Toko (21).
const SHIFT_SCHEDULED_CATEGORIES = [18, 21];

const getEligibleUsers = () => {
  const placeholders = SHIFT_SCHEDULED_CATEGORIES.map(() => "?").join(",");
  const SQLQuery = `
    SELECT user_id, name, username, category_user
    FROM user
    WHERE category_user IN (${placeholders}) AND is_deleted = 0
    ORDER BY name ASC`;
  return dbpool.query(SQLQuery, SHIFT_SCHEDULED_CATEGORIES);
};

const getJadwalByMonth = (month, retailId) => {
  const params = [month];
  let retailFilter = "";
  if (retailId) {
    retailFilter = "AND j.retail_id = ?";
    params.push(retailId);
  }

  const SQLQuery = `
    SELECT
      j.id, j.user_id, DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal,
      j.retail_id, j.absen_masuk_id, j.absen_keluar_id,
      tm.name AS shift_name, tm.kategori_absen,
      u.name AS user_name, r.name AS retail_name,
      j.created_at, j.created_by, j.updated_at, j.updated_by
    FROM jadwal_harian j
    JOIN user u ON u.user_id = j.user_id
    JOIN retail r ON r.retail_id = j.retail_id
    JOIN tipe_absen tm ON tm.absen_id = j.absen_masuk_id
    WHERE j.is_deleted = 0
      AND DATE_FORMAT(j.tanggal, '%Y-%m') = ?
      ${retailFilter}
    ORDER BY j.tanggal ASC, u.name ASC`;
  return dbpool.query(SQLQuery, params);
};

// Upsert bulk: banyak user x banyak tanggal ke retail + shift (absen_masuk_id, absen_keluar_id).
// UNIQUE(user_id, tanggal) => re-assign meng-update baris, bukan menduplikat.
const assignJadwal = (rows) => {
  const values = rows.map((r) => [
    r.user_id,
    r.tanggal,
    r.retail_id,
    r.absen_masuk_id,
    r.absen_keluar_id,
    r.created_at,
    r.created_by,
  ]);

  const SQLQuery = `
    INSERT INTO jadwal_harian
      (user_id, tanggal, retail_id, absen_masuk_id, absen_keluar_id, created_at, created_by)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      retail_id = VALUES(retail_id),
      absen_masuk_id = VALUES(absen_masuk_id),
      absen_keluar_id = VALUES(absen_keluar_id),
      updated_at = VALUES(created_at),
      updated_by = VALUES(created_by),
      is_deleted = 0,
      deleted_at = NULL,
      deleted_by = NULL`;
  return dbpool.query(SQLQuery, [values]);
};

// Karyawan yang terhubung ke sebuah retail lewat shifting + shift_employes.
// shifting.retail_id bisa CSV ("13,4,2") -> pakai FIND_IN_SET.
// HANYA yang shift jadwal-harian AKTIF: uses_jadwal_harian=1 + periode shift
// mencakup hari ini (start <= CURDATE() <= end). Selaras userUsesJadwalHarian —
// user tanpa shift jadwal-harian aktif tak masuk matrix (tak bisa dijadwal).
const getEmployeesByRetail = (retailId) => {
  const SQLQuery = `
    SELECT DISTINCT u.user_id, u.name, u.username
    FROM shift_employes se
    JOIN shifting s ON s.shifting_id = se.shifting_id AND s.is_deleted = 0
    JOIN user u ON u.user_id = se.user_id AND u.is_deleted = 0
    WHERE se.user_id <> 0
      AND FIND_IN_SET(?, REPLACE(s.retail_id, ' ', ''))
      AND s.uses_jadwal_harian = 1
      AND s.start_date <= CURDATE()
      AND s.end_date >= CURDATE()
    ORDER BY u.name ASC`;
  return dbpool.query(SQLQuery, [retailId]);
};

// Opsi shift spesifik untuk Sales Toko / Trainee.
// Return: shift_name, kategori_absen (grup Pagi/Sore/Malam), absen_masuk_id, absen_keluar_id.
// Satu shift = 1 masuk + 1 keluar, pivot via GROUP BY name.
const getKategoriShift = () => {
  const placeholders = SHIFT_SCHEDULED_CATEGORIES.map(() => "?").join(",");
  const SQLQuery = `
    SELECT
      TRIM(t.name) AS shift_name,
      MIN(t.kategori_absen) AS kategori_absen,
      MAX(CASE WHEN LOWER(t.description) LIKE '%masuk%' THEN t.absen_id END) AS absen_masuk_id,
      MAX(CASE WHEN LOWER(t.description) LIKE '%keluar%' OR LOWER(t.description) LIKE '%pulang%' THEN t.absen_id END) AS absen_keluar_id
    FROM group_absen ga
    JOIN tipe_absen t ON t.absen_id = ga.absen_type_id AND t.is_deleted = 0
    WHERE (ga.id_category IN (${placeholders}) OR ga.id_category = 0)
      AND t.name IS NOT NULL AND t.name <> ''
    GROUP BY TRIM(t.name)
    HAVING absen_masuk_id IS NOT NULL AND absen_keluar_id IS NOT NULL
    ORDER BY shift_name ASC`;
  return dbpool.query(SQLQuery, SHIFT_SCHEDULED_CATEGORIES);
};

const deleteJadwal = (body, id) => {
  const SQLQuery = `
    UPDATE jadwal_harian
    SET is_deleted = 1, deleted_at = ?, deleted_by = ?
    WHERE id = ?`;
  return dbpool.query(SQLQuery, [body.deleted_at, body.deleted_by, id]);
};

// Jadwal aktif untuk satu retail pada satu tanggal (pre-fill form edit).
const getJadwalByDate = (retailId, tanggal) => {
  const SQLQuery = `
    SELECT
      j.id, j.user_id, DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal,
      j.retail_id, j.absen_masuk_id, j.absen_keluar_id,
      tm.name AS shift_name, tm.kategori_absen,
      u.name AS user_name
    FROM jadwal_harian j
    JOIN user u ON u.user_id = j.user_id
    JOIN tipe_absen tm ON tm.absen_id = j.absen_masuk_id
    WHERE j.retail_id = ? AND j.tanggal = ? AND j.is_deleted = 0
    ORDER BY tm.name ASC, u.name ASC`;
  return dbpool.query(SQLQuery, [retailId, tanggal]);
};

// Replace seluruh jadwal retail+tanggal secara atomik.
// rows: [{ user_id, absen_masuk_id, absen_keluar_id }]. User yang tak ada di rows -> soft delete.
const setJadwalByDate = async (retailId, tanggal, rows, meta) => {
  const conn = await dbpool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Soft-delete semua jadwal aktif retail+tanggal (baseline kosong).
    await conn.query(
      `UPDATE jadwal_harian
       SET is_deleted = 1, deleted_at = ?, deleted_by = ?
       WHERE retail_id = ? AND tanggal = ? AND is_deleted = 0`,
      [meta.at, meta.by, retailId, tanggal]
    );

    // 2. Upsert baris payload -> revive + set FK.
    if (rows.length > 0) {
      const values = rows.map((r) => [
        r.user_id,
        tanggal,
        retailId,
        r.absen_masuk_id,
        r.absen_keluar_id,
        meta.at,
        meta.by,
      ]);
      await conn.query(
        `INSERT INTO jadwal_harian
           (user_id, tanggal, retail_id, absen_masuk_id, absen_keluar_id, created_at, created_by)
         VALUES ?
         ON DUPLICATE KEY UPDATE
           retail_id = VALUES(retail_id),
           absen_masuk_id = VALUES(absen_masuk_id),
           absen_keluar_id = VALUES(absen_keluar_id),
           updated_at = VALUES(created_at),
           updated_by = VALUES(created_by),
           is_deleted = 0,
           deleted_at = NULL,
           deleted_by = NULL`,
        [values]
      );
    }

    await conn.commit();
    return { total: rows.length };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// Retail yang punya shift jadwal-harian AKTIF hari ini (uses_jadwal_harian=1 +
// periode mencakup CURDATE()). shifting.retail_id bisa CSV ("13,4,2") -> expand
// via join retail + FIND_IN_SET. Dipakai FE filter dropdown OC: hanya OC yang
// jadwal-hariannya aktif yang bisa dipilih.
const getActiveJadwalRetails = () => {
  const SQLQuery = `
    SELECT DISTINCT r.retail_id, r.name
    FROM shifting s
    JOIN retail r
      ON FIND_IN_SET(r.retail_id, REPLACE(s.retail_id, ' ', ''))
     AND r.is_deleted = 0
    WHERE s.is_deleted = 0
      AND s.uses_jadwal_harian = 1
      AND s.start_date <= CURDATE()
      AND s.end_date >= CURDATE()
    ORDER BY r.name ASC`;
  return dbpool.query(SQLQuery);
};

module.exports = {
  SHIFT_SCHEDULED_CATEGORIES,
  getEligibleUsers,
  getActiveJadwalRetails,
  getEmployeesByRetail,
  getJadwalByMonth,
  getKategoriShift,
  getJadwalByDate,
  assignJadwal,
  setJadwalByDate,
  deleteJadwal,
};
