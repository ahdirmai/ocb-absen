const dbpool = require("../config/database");

// Model absensi_sesi: pairing absen masuk <-> keluar jadi 1 kesatuan kerja.
// Fungsi open/close/find menerima `conn` (koneksi transaksi) agar atomic dgn
// insert absensi. resolveJadwalId dipakai saat masuk untuk link ke jadwal_harian.
// Lihat docs/absensi-sesi-plan.md.

// Cari jadwal_harian hari itu yang tipe absennya (masuk/keluar) cocok.
// Return jadwal_harian.id atau null (non-shift / tak ada jadwal / lembur).
const resolveJadwalId = async (userId, absenTypeId, tanggal, conn = dbpool) => {
  const [rows] = await conn.query(
    `SELECT id FROM jadwal_harian
     WHERE user_id = ?
       AND tanggal = ?
       AND is_deleted = 0
       AND (absen_masuk_id = ? OR absen_keluar_id = ?)
     LIMIT 1`,
    [userId, tanggal, absenTypeId, absenTypeId]
  );
  return rows.length > 0 ? rows[0].id : null;
};

// Buka sesi baru (absen masuk). Return insertId (sesi_id).
const openSesi = async (conn, sesi) => {
  const {
    user_id,
    tanggal,
    retail_id,
    jadwal_id = null,
    kategori_absen = null,
    masuk_absensi_id,
    is_lembur = 0,
    created_at,
  } = sesi;

  const [result] = await conn.query(
    `INSERT INTO absensi_sesi
       (user_id, tanggal, retail_id, jadwal_id, kategori_absen,
        masuk_absensi_id, is_lembur, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
    [
      user_id,
      tanggal,
      retail_id,
      jadwal_id,
      kategori_absen,
      masuk_absensi_id,
      is_lembur ? 1 : 0,
      created_at || null,
    ]
  );
  return result.insertId;
};

// Cari sesi open milik user untuk dipasangkan dgn absen keluar.
// Match is_lembur + kategori/jadwal. includeYesterday utk shift cross-midnight.
// Ambil sesi terbaru (created_at DESC) bila ada beberapa.
const findOpenSesi = async (conn, params) => {
  const {
    user_id,
    is_lembur = 0,
    kategori_absen = null,
    jadwal_id = null,
    includeYesterday = false,
  } = params;

  const dateFilter = includeYesterday
    ? "s.tanggal >= (CURDATE() - INTERVAL 1 DAY)"
    : "s.tanggal = CURDATE()";

  // Kategori/jadwal cocokkan bila tersedia; keduanya boleh NULL (non-shift).
  const [rows] = await conn.query(
    `SELECT s.sesi_id, s.tanggal, s.kategori_absen, s.jadwal_id
     FROM absensi_sesi s
     WHERE s.user_id = ?
       AND s.status = 'open'
       AND s.is_lembur = ?
       AND ${dateFilter}
       AND (
         (? IS NOT NULL AND s.jadwal_id = ?)
         OR (? IS NOT NULL AND s.kategori_absen = ?)
         OR (? IS NULL AND ? IS NULL)
       )
     ORDER BY s.created_at DESC, s.sesi_id DESC
     LIMIT 1`,
    [
      user_id,
      is_lembur ? 1 : 0,
      jadwal_id,
      jadwal_id,
      kategori_absen,
      kategori_absen,
      jadwal_id,
      kategori_absen,
    ]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Cari sesi open user TANPA filter kategori/jadwal — untuk validasi tipe keluar
// (tahu kategori/jadwal sesi yang sedang berjalan). Beda dgn findOpenSesi yang
// dipakai untuk pairing. includeYesterday utk shift cross-midnight.
const findAnyOpenSesi = async (params, conn = dbpool) => {
  const {
    user_id,
    is_lembur = 0,
    includeYesterday = false,
  } = params;

  const dateFilter = includeYesterday
    ? "s.tanggal >= (CURDATE() - INTERVAL 1 DAY)"
    : "s.tanggal = CURDATE()";

  const [rows] = await conn.query(
    `SELECT s.sesi_id, s.tanggal, s.kategori_absen, s.jadwal_id, s.is_lembur
     FROM absensi_sesi s
     WHERE s.user_id = ?
       AND s.status = 'open'
       AND s.is_lembur = ?
       AND ${dateFilter}
     ORDER BY s.created_at DESC, s.sesi_id DESC
     LIMIT 1`,
    [user_id, is_lembur ? 1 : 0]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Ambil absen_keluar_id dari jadwal_harian tertentu — untuk validasi tipe keluar
// pada jalur jadwal harian (tipe keluar harus == absen_keluar_id jadwalnya).
const getJadwalKeluarId = async (jadwalId, conn = dbpool) => {
  const [rows] = await conn.query(
    `SELECT absen_keluar_id FROM jadwal_harian WHERE id = ? AND is_deleted = 0 LIMIT 1`,
    [jadwalId]
  );
  return rows.length > 0 ? rows[0].absen_keluar_id : null;
};

// Batas grace keluar cross-date (jam) — sinkron dgn FE
// CROSS_DATE_KELUAR_GRACE_HOURS di AbsenKaryawan.jsx.
const CROSS_DATE_KELUAR_GRACE_HOURS = 3;

// Tandai sesi open BASI (lupa keluar) jadi 'incomplete'. Dua kasus basi:
//   1. Same-day (is_cross_date=0) tanggal < CURDATE() → lupa keluar.
//   2. Cross-date (is_cross_date=1) yang sudah LEWAT batas: jam keluar terjadwal
//      = start_time tipe KELUAR pasangannya (tk, match by name), pada tanggal
//      masuk +1 hari; deadline = + grace 3 jam. Lewat itu = lupa keluar juga.
//      Pakai start_time keluar, BUKAN ta.end_time masuk (window masuk sempit).
// Cross-date yang masih dalam window (belum lewat deadline) TIDAK ditutup —
// user memang belum waktunya keluar. Dipanggil transaksional saat user absen
// masuk lagi, cegah blokir + jaga akurasi lembur-guard.
const markStaleOpenSesiIncomplete = async (conn, userId, isLembur = 0) => {
  const [result] = await conn.query(
    `UPDATE absensi_sesi s
       JOIN absensi a ON a.absensi_id = s.masuk_absensi_id
       JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
       LEFT JOIN tipe_absen tk
         ON tk.name = ta.name AND tk.is_deleted = 0
        AND (LOWER(tk.description) LIKE '%keluar%' OR LOWER(tk.description) LIKE '%pulang%')
     SET s.status = 'incomplete', s.updated_at = NOW()
     WHERE s.user_id = ?
       AND s.is_lembur = ?
       AND s.status = 'open'
       AND (
         (COALESCE(ta.is_cross_date, 0) = 0 AND s.tanggal < CURDATE())
         OR (
           COALESCE(ta.is_cross_date, 0) = 1
           AND tk.start_time IS NOT NULL
           AND (
             TIMESTAMP(s.tanggal + INTERVAL 1 DAY, tk.start_time)
             + INTERVAL ? HOUR
           ) < NOW()
         )
       )`,
    [userId, isLembur ? 1 : 0, CROSS_DATE_KELUAR_GRACE_HOURS]
  );
  return result.affectedRows || 0;
};

// Tutup sesi (absen keluar). Set keluar + status='closed'.
const closeSesi = async (conn, sesiId, keluarAbsensiId, updatedAt = null) => {
  const [result] = await conn.query(
    `UPDATE absensi_sesi
     SET keluar_absensi_id = ?, status = 'closed', updated_at = ?
     WHERE sesi_id = ?`,
    [keluarAbsensiId, updatedAt, sesiId]
  );
  return result;
};

// Buat sesi incomplete (keluar sepihak tanpa sesi open, atau backfill orphan).
const createIncompleteSesi = async (conn, sesi) => {
  const {
    user_id,
    tanggal,
    retail_id,
    jadwal_id = null,
    kategori_absen = null,
    masuk_absensi_id = null,
    keluar_absensi_id = null,
    is_lembur = 0,
    created_at,
  } = sesi;

  const [result] = await conn.query(
    `INSERT INTO absensi_sesi
       (user_id, tanggal, retail_id, jadwal_id, kategori_absen,
        masuk_absensi_id, keluar_absensi_id, is_lembur, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'incomplete', ?)`,
    [
      user_id,
      tanggal,
      retail_id,
      jadwal_id,
      kategori_absen,
      masuk_absensi_id,
      keluar_absensi_id,
      is_lembur ? 1 : 0,
      created_at || null,
    ]
  );
  return result.insertId;
};

// Ringkasan sesi hari ini per is_lembur, untuk hard-guard lembur.
// hasClosed = ada sesi selesai (masuk+keluar). hasOpen = ada sesi terbuka (masuk saja).
// includeYesterday utk shift cross-midnight.
const getTodaySesiSummary = async (user_id, isLembur, includeYesterday = false, conn = dbpool) => {
  const dateFilter = includeYesterday
    ? "tanggal >= (CURDATE() - INTERVAL 1 DAY)"
    : "tanggal = CURDATE()";

  const [rows] = await conn.query(
    `SELECT
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_count,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count
     FROM absensi_sesi
     WHERE user_id = ?
       AND is_lembur = ?
       AND ${dateFilter}`,
    [user_id, isLembur ? 1 : 0]
  );

  const s = rows[0] || {};
  return {
    hasClosed: Number(s.closed_count || 0) > 0,
    hasOpen: Number(s.open_count || 0) > 0,
    closedCount: Number(s.closed_count || 0),
    openCount: Number(s.open_count || 0),
  };
};

module.exports = {
  resolveJadwalId,
  openSesi,
  findOpenSesi,
  findAnyOpenSesi,
  getJadwalKeluarId,
  markStaleOpenSesiIncomplete,
  closeSesi,
  createIncompleteSesi,
  getTodaySesiSummary,
};
