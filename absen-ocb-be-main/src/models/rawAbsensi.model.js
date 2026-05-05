const dbpool = require('../config/database');

/**
 * Sama persis dengan historyAbsensiAllUser, dengan tambahan:
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
                WHEN a.absensi_id IS NULL   THEN 'Belum Absen'
                WHEN a.status_absen = 1     THEN 'Ontime'
                WHEN a.status_absen = 2     THEN 'Telat'
                ELSE 'Tidak Diketahui'
            END             AS status_kehadiran
        FROM user u
        LEFT JOIN (
            SELECT ab.*
            FROM absensi ab
            JOIN tipe_absen ts ON ts.absen_id = ab.absen_type_id
                              AND ts.description LIKE '%masuk%'
            WHERE DATE(ab.absen_time) BETWEEN ? AND ?
        ) a ON a.user_id = u.user_id
        LEFT JOIN retail r      ON r.retail_id = a.retail_id
        LEFT JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
        LEFT JOIN user uz       ON uz.user_id  = a.approval_by
        WHERE u.is_deleted = 0
        ORDER BY u.name ASC, a.absen_time DESC
    `;
    return dbpool.execute(SQLQuery, [startDate, endDate]);
};

module.exports = { getRawAbsensi };
