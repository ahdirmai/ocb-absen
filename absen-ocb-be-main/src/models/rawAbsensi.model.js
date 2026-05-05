const dbpool = require('../config/database');

/**
 * Sama persis dengan historyAbsensiAllUser, dengan tambahan:
 * - Filter ta.name LIKE '%masuk%' (hanya absen masuk)
 * - ta.start_time AS jam_masuk_seharusnya
 * - CASE status_kehadiran dari a.status_absen
 *
 * @param {string} startDate - Format: 'YYYY-MM-DD'
 * @param {string} endDate   - Format: 'YYYY-MM-DD'
 */
const getRawAbsensi = async (startDate, endDate) => {
    const SQLQuery = `
        SELECT
            a.absensi_id,
            a.user_id,
            u.name          AS nama_karyawan,
            a.absen_time,
            a.retail_id,
            r.name          AS retail_name,
            a.absen_type_id,
            ta.name         AS category_absen,
            ta.description,
            ta.fee,
            ta.start_time   AS jam_masuk_seharusnya,
            uz.name         AS Approval,
            a.is_valid,
            a.reason,
            a.photo_url,
            CASE
                WHEN a.status_absen = 1 THEN 'Ontime'
                WHEN a.status_absen = 2 THEN 'Telat'
                ELSE 'Tidak Diketahui'
            END             AS status_kehadiran
        FROM absensi a
        JOIN user u         ON u.user_id    = a.user_id
        JOIN retail r       ON r.retail_id  = a.retail_id
        JOIN tipe_absen ta  ON ta.absen_id  = a.absen_type_id
        LEFT JOIN user uz   ON uz.user_id   = a.approval_by
        WHERE DATE(a.absen_time) >= ?
          AND DATE(a.absen_time) <= ?
          AND ta.name LIKE '%masuk%'
        ORDER BY a.absen_time DESC
    `;
    return dbpool.execute(SQLQuery, [startDate, endDate]);
};

module.exports = { getRawAbsensi };
