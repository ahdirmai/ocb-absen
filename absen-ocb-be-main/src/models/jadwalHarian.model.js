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
      j.retail_id, j.kategori_absen,
      u.name AS user_name, r.name AS retail_name,
      j.created_at, j.created_by, j.updated_at, j.updated_by
    FROM jadwal_harian j
    JOIN user u ON u.user_id = j.user_id
    JOIN retail r ON r.retail_id = j.retail_id
    WHERE j.is_deleted = 0
      AND DATE_FORMAT(j.tanggal, '%Y-%m') = ?
      ${retailFilter}
    ORDER BY j.tanggal ASC, u.name ASC`;
  return dbpool.query(SQLQuery, params);
};

// Upsert bulk: banyak user x banyak tanggal ke retail + kategori_absen yang sama.
// UNIQUE(user_id, tanggal) => re-assign meng-update baris, bukan menduplikat.
const assignJadwal = (rows) => {
  const values = rows.map((r) => [
    r.user_id,
    r.tanggal,
    r.retail_id,
    r.kategori_absen,
    r.created_at,
    r.created_by,
  ]);

  const SQLQuery = `
    INSERT INTO jadwal_harian
      (user_id, tanggal, retail_id, kategori_absen, created_at, created_by)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      retail_id = VALUES(retail_id),
      kategori_absen = VALUES(kategori_absen),
      updated_at = VALUES(created_at),
      updated_by = VALUES(created_by),
      is_deleted = 0,
      deleted_at = NULL,
      deleted_by = NULL`;
  return dbpool.query(SQLQuery, [values]);
};

// Opsi kategori_absen (shift) yang tersedia untuk sebuah retail.
const getKategoriByRetail = (retailId) => {
  const SQLQuery = `
    SELECT DISTINCT kategori_absen
    FROM tipe_absen
    WHERE retail_id = ? AND is_deleted = 0
      AND kategori_absen IS NOT NULL AND kategori_absen <> ''
    ORDER BY kategori_absen ASC`;
  return dbpool.query(SQLQuery, [retailId]);
};

const deleteJadwal = (body, id) => {
  const SQLQuery = `
    UPDATE jadwal_harian
    SET is_deleted = 1, deleted_at = ?, deleted_by = ?
    WHERE id = ?`;
  return dbpool.query(SQLQuery, [body.deleted_at, body.deleted_by, id]);
};

module.exports = {
  SHIFT_SCHEDULED_CATEGORIES,
  getEligibleUsers,
  getJadwalByMonth,
  getKategoriByRetail,
  assignJadwal,
  deleteJadwal,
};
