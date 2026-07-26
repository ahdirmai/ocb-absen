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

// Cari sesi yang memuat 1 baris absensi (sbg masuk atau keluar) — untuk koreksi.
const findSesiByAbsensiId = async (conn, absenId) => {
  const [rows] = await conn.query(
    `SELECT * FROM absensi_sesi
     WHERE masuk_absensi_id = ? OR keluar_absensi_id = ?
     LIMIT 1`,
    [absenId, absenId]
  );
  return rows.length > 0 ? rows[0] : null;
};

// Update tanggal sesi (dipakai saat koreksi jam masuk menggeser tanggal).
// Hanya baris masuk yang meng-anchor sesi.tanggal.
const updateSesiTanggal = async (conn, sesiId, tanggal, updatedAt = null) => {
  const [result] = await conn.query(
    `UPDATE absensi_sesi SET tanggal = ?, updated_at = ? WHERE sesi_id = ?`,
    [tanggal, updatedAt, sesiId]
  );
  return result;
};

// Update kategori sesi (dipakai saat koreksi mengganti tipe absen ke shift beda).
// Jaga absensi_sesi.kategori_absen selaras kategori tipe baru agar findOpenSesi
// tetap bisa memasangkan masuk/keluar (cegah sesi pecah).
const updateSesiKategori = async (conn, sesiId, kategori, updatedAt = null) => {
  const [result] = await conn.query(
    `UPDATE absensi_sesi SET kategori_absen = ?, updated_at = ? WHERE sesi_id = ?`,
    [kategori, updatedAt, sesiId]
  );
  return result;
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

// ── Manage sesi (page Kelola Sesi Absensi) ──────────────────────────────────

// SELECT sesi paginated + filter, JOIN detail masuk/keluar + user + retail.
// has_candidate: 1 bila sesi incomplete punya pasangan potensial (orphan lawan
// arah, user+shift+is_lembur sama, window 20 jam) — untuk highlight FE.
const SESI_SELECT = `
  s.sesi_id, s.user_id, u.name AS nama_karyawan, u.username,
  s.retail_id, r.name AS retail_name, s.kategori_absen, s.tanggal,
  s.status, s.is_lembur, s.jadwal_id,
  s.masuk_absensi_id, am.absen_time AS masuk_time, tm.name AS masuk_shift, tm.description AS masuk_desc,
  s.keluar_absensi_id, ak.absen_time AS keluar_time, tk.name AS keluar_shift, tk.description AS keluar_desc,
  COALESCE(tm.name, tk.name) AS shift_name,
  EXISTS (
    SELECT 1 FROM absensi_sesi o
    JOIN absensi oa ON oa.absensi_id = COALESCE(o.masuk_absensi_id, o.keluar_absensi_id)
    JOIN tipe_absen ot ON ot.absen_id = oa.absen_type_id
    WHERE o.status = 'incomplete' AND o.user_id = s.user_id
      AND o.sesi_id <> s.sesi_id AND o.is_lembur = s.is_lembur
      AND ot.name = COALESCE(tm.name, tk.name)
      AND (
        (s.masuk_absensi_id IS NULL AND o.keluar_absensi_id IS NULL AND o.masuk_absensi_id IS NOT NULL)
        OR (s.keluar_absensi_id IS NULL AND o.masuk_absensi_id IS NULL AND o.keluar_absensi_id IS NOT NULL)
      )
      AND ABS(TIMESTAMPDIFF(HOUR, COALESCE(am.absen_time, ak.absen_time), oa.absen_time)) <= 20
  ) AS has_candidate
`;

const buildSesiFilter = (filters) => {
  const { status, userId, retailId, kategori, startDate, endDate, search } = filters;
  const where = [];
  const params = [];
  if (status) { where.push("s.status = ?"); params.push(status); }
  if (userId) { where.push("s.user_id = ?"); params.push(userId); }
  if (retailId) { where.push("s.retail_id = ?"); params.push(retailId); }
  if (kategori) { where.push("LOWER(s.kategori_absen) = LOWER(?)"); params.push(kategori); }
  if (startDate) { where.push("s.tanggal >= ?"); params.push(startDate); }
  if (endDate) { where.push("s.tanggal <= ?"); params.push(endDate); }
  if (search) {
    where.push("(u.name LIKE ? OR u.username LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
};

const listSesi = async (filters) => {
  const { whereSql, params } = buildSesiFilter(filters);
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(filters.limit) || 25));
  const offset = (page - 1) * limit;
  const [rows] = await dbpool.query(
    `SELECT ${SESI_SELECT}
       FROM absensi_sesi s
       JOIN user u ON u.user_id = s.user_id
       LEFT JOIN retail r ON r.retail_id = s.retail_id
       LEFT JOIN absensi am ON am.absensi_id = s.masuk_absensi_id
       LEFT JOIN tipe_absen tm ON tm.absen_id = am.absen_type_id
       LEFT JOIN absensi ak ON ak.absensi_id = s.keluar_absensi_id
       LEFT JOIN tipe_absen tk ON tk.absen_id = ak.absen_type_id
       ${whereSql}
       ORDER BY s.tanggal DESC, s.sesi_id DESC
       LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { rows, page, limit };
};

const countSesi = async (filters) => {
  const { whereSql, params } = buildSesiFilter(filters);
  const [[row]] = await dbpool.query(
    `SELECT COUNT(*) AS total
       FROM absensi_sesi s
       JOIN user u ON u.user_id = s.user_id
       ${whereSql}`,
    params
  );
  return row.total;
};

// 1 sesi + detail masuk/keluar (untuk validasi aksi). conn optional.
const getSesiById = async (sesiId, conn = dbpool) => {
  const [rows] = await conn.query(
    `SELECT s.*, am.absen_time AS masuk_time, ak.absen_time AS keluar_time,
            tm.name AS masuk_shift, tk.name AS keluar_shift
       FROM absensi_sesi s
       LEFT JOIN absensi am ON am.absensi_id = s.masuk_absensi_id
       LEFT JOIN tipe_absen tm ON tm.absen_id = am.absen_type_id
       LEFT JOIN absensi ak ON ak.absensi_id = s.keluar_absensi_id
       LEFT JOIN tipe_absen tk ON tk.absen_id = ak.absen_type_id
       WHERE s.sesi_id = ? LIMIT 1`,
    [sesiId]
  );
  return rows.length ? rows[0] : null;
};

// Kandidat pasangan untuk sesi incomplete: sesi incomplete lawan-arah milik user
// sama, shift name + is_lembur sama, waktu masuk < keluar dalam window 20 jam.
const findMatchCandidates = async (sesiId) => {
  const sesi = await getSesiById(sesiId);
  if (!sesi || sesi.status !== "incomplete") return { sesi, candidates: [] };
  const isKeluarOrphan = sesi.masuk_absensi_id == null && sesi.keluar_absensi_id != null;
  const isMasukOrphan = sesi.keluar_absensi_id == null && sesi.masuk_absensi_id != null;
  if (!isKeluarOrphan && !isMasukOrphan) return { sesi, candidates: [] };

  const shiftName = sesi.masuk_shift || sesi.keluar_shift;
  const anchorTime = sesi.masuk_time || sesi.keluar_time;
  // Orphan ini butuh pasangan arah berlawanan.
  const needDir = isKeluarOrphan ? "masuk" : "keluar";
  const [rows] = await dbpool.query(
    `SELECT s.sesi_id, s.tanggal, s.status, s.masuk_absensi_id, s.keluar_absensi_id,
            a.absen_time AS pair_time, t.name AS shift_name, t.description AS pair_desc
       FROM absensi_sesi s
       JOIN absensi a ON a.absensi_id = ${needDir === "masuk" ? "s.masuk_absensi_id" : "s.keluar_absensi_id"}
       JOIN tipe_absen t ON t.absen_id = a.absen_type_id
      WHERE s.status = 'incomplete' AND s.user_id = ? AND s.sesi_id <> ?
        AND s.is_lembur = ? AND t.name = ?
        AND ${needDir === "masuk" ? "s.keluar_absensi_id IS NULL" : "s.masuk_absensi_id IS NULL"}
        AND ABS(TIMESTAMPDIFF(HOUR, ?, a.absen_time)) <= 20
      ORDER BY ABS(TIMESTAMPDIFF(MINUTE, ?, a.absen_time)) ASC
      LIMIT 20`,
    [sesi.user_id, sesiId, sesi.is_lembur, shiftName, anchorTime, anchorTime]
  );
  return { sesi, candidates: rows, needDir };
};

// Gabung 2 sesi incomplete (1 masuk-only + 1 keluar-only) jadi 1 closed.
// Simpan masuk-sesi (anchor tanggal), isi keluar dari keluar-sesi, hapus keluar-sesi.
const matchSesi = async (conn, masukSesiId, keluarSesiId, updatedAt = null) => {
  const masuk = await getSesiById(masukSesiId, conn);
  const keluar = await getSesiById(keluarSesiId, conn);
  if (!masuk || !keluar) throw new Error("Sesi tidak ditemukan.");
  if (String(masuk.user_id) !== String(keluar.user_id))
    throw new Error("Dua sesi bukan milik user yang sama.");
  if (masuk.status !== "incomplete" || keluar.status !== "incomplete")
    throw new Error("Kedua sesi harus berstatus incomplete.");
  if (!(masuk.masuk_absensi_id != null && masuk.keluar_absensi_id == null))
    throw new Error("Sesi masuk harus punya absen masuk tanpa keluar.");
  if (!(keluar.keluar_absensi_id != null && keluar.masuk_absensi_id == null))
    throw new Error("Sesi keluar harus punya absen keluar tanpa masuk.");

  await conn.query(
    `UPDATE absensi_sesi
        SET keluar_absensi_id = ?, status = 'closed', updated_at = ?
      WHERE sesi_id = ?`,
    [keluar.keluar_absensi_id, updatedAt, masukSesiId]
  );
  await conn.query(`DELETE FROM absensi_sesi WHERE sesi_id = ?`, [keluarSesiId]);
  return { masukSesiId, keluarSesiId, keluar_absensi_id: keluar.keluar_absensi_id };
};

// Pisah sesi closed jadi 2 incomplete: sesi asal jadi masuk-only, sesi baru
// keluar-only (copy keluar_absensi_id + tanggal keluar). Kebalikan matchSesi.
const unmatchSesi = async (conn, sesiId, updatedAt = null) => {
  const sesi = await getSesiById(sesiId, conn);
  if (!sesi) throw new Error("Sesi tidak ditemukan.");
  if (sesi.status !== "closed" || sesi.masuk_absensi_id == null || sesi.keluar_absensi_id == null)
    throw new Error("Hanya sesi closed dengan masuk+keluar yang bisa di-unmatch.");

  const keluarTanggal = sesi.keluar_time
    ? String(sesi.keluar_time).slice(0, 10)
    : sesi.tanggal;
  const newKeluarSesiId = await createIncompleteSesi(conn, {
    user_id: sesi.user_id,
    tanggal: keluarTanggal,
    retail_id: sesi.retail_id,
    jadwal_id: sesi.jadwal_id,
    kategori_absen: sesi.kategori_absen,
    masuk_absensi_id: null,
    keluar_absensi_id: sesi.keluar_absensi_id,
    is_lembur: sesi.is_lembur,
    created_at: updatedAt,
  });
  await conn.query(
    `UPDATE absensi_sesi
        SET keluar_absensi_id = NULL, status = 'incomplete', updated_at = ?
      WHERE sesi_id = ?`,
    [updatedAt, sesiId]
  );
  return { sesiId, newKeluarSesiId };
};

// Set status manual (enum guard).
const updateSesiStatus = async (conn, sesiId, status, updatedAt = null) => {
  const allowed = ["open", "closed", "incomplete"];
  if (!allowed.includes(status)) throw new Error("Status tidak valid.");
  const [result] = await conn.query(
    `UPDATE absensi_sesi SET status = ?, updated_at = ? WHERE sesi_id = ?`,
    [status, updatedAt, sesiId]
  );
  return result;
};

// Hapus 1 sesi (orphan/duplikat). Tak menyentuh baris absensi.
const deleteSesi = async (conn, sesiId) => {
  const [result] = await conn.query(
    `DELETE FROM absensi_sesi WHERE sesi_id = ?`,
    [sesiId]
  );
  return result;
};

module.exports = {
  resolveJadwalId,
  openSesi,
  findOpenSesi,
  findAnyOpenSesi,
  getJadwalKeluarId,
  markStaleOpenSesiIncomplete,
  findSesiByAbsensiId,
  updateSesiTanggal,
  updateSesiKategori,
  closeSesi,
  createIncompleteSesi,
  getTodaySesiSummary,
  listSesi,
  countSesi,
  getSesiById,
  findMatchCandidates,
  matchSesi,
  unmatchSesi,
  updateSesiStatus,
  deleteSesi,
};
