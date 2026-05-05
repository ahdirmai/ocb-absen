const dbpool = require('../config/database');

/**
 * Ambil semua user aktif beserta data absensi mereka pada rentang tanggal tertentu.
 * User yang belum absen pada hari itu tetap muncul dengan status "Belum Absen".
 *
 * @param {string} startDate - Format: 'YYYY-MM-DD'
 * @param {string} endDate   - Format: 'YYYY-MM-DD'
 */
const getRawAbsensi = async (startDate, endDate) => {
    const SQLQuery = `
        SELECT
            u.user_id,
            u.name                              AS nama,
            ta.name                             AS tipe_absen,
            ta.start_time                       AS jam_masuk_seharusnya,
            a.absen_time                        AS jam_absen,
            CASE
                WHEN a.absensi_id IS NULL       THEN 'Belum Absen'
                WHEN a.status_absen = 1         THEN 'Ontime'
                WHEN a.status_absen = 2         THEN 'Telat'
                ELSE 'Tidak Diketahui'
            END                                 AS status_kehadiran,
            a.absensi_id,
            a.absen_type_id,
            a.retail_id,
            r.name                              AS retail_name,
            a.reason,
            a.photo_url,
            a.is_valid
        FROM user u
        LEFT JOIN (
            SELECT *
            FROM absensi
            WHERE DATE(absen_time) BETWEEN ? AND ?
        ) a ON a.user_id = u.user_id
        LEFT JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
        LEFT JOIN retail r ON r.retail_id = a.retail_id
        WHERE u.is_deleted = 0
          AND u.enabled   = 1
        ORDER BY u.name ASC, a.absen_time ASC
    `;
    return dbpool.execute(SQLQuery, [startDate, endDate]);
};

/**
 * Sama seperti getRawAbsensi tapi hanya untuk satu tanggal (harian).
 * Setiap user yang belum absen pada tanggal tersebut tetap disertakan.
 *
 * @param {string} date - Format: 'YYYY-MM-DD'
 */
const getRawAbsensiHarian = async (date) => {
    const SQLQuery = `
        SELECT
            u.user_id,
            u.name                              AS nama,
            ta.name                             AS tipe_absen,
            ta.start_time                       AS jam_masuk_seharusnya,
            a.absen_time                        AS jam_absen,
            CASE
                WHEN a.absensi_id IS NULL       THEN 'Belum Absen'
                WHEN a.status_absen = 1         THEN 'Ontime'
                WHEN a.status_absen = 2         THEN 'Telat'
                ELSE 'Tidak Diketahui'
            END                                 AS status_kehadiran,
            a.absensi_id,
            a.absen_type_id,
            a.retail_id,
            r.name                              AS retail_name,
            a.reason,
            a.photo_url,
            a.is_valid
        FROM user u
        LEFT JOIN absensi a
            ON  a.user_id = u.user_id
            AND DATE(a.absen_time) = ?
        LEFT JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
        LEFT JOIN retail r ON r.retail_id = a.retail_id
        WHERE u.is_deleted = 0
          AND u.enabled   = 1
        ORDER BY u.name ASC, a.absen_time ASC
    `;
    return dbpool.execute(SQLQuery, [date]);
};

module.exports = {
    getRawAbsensi,
    getRawAbsensiHarian,
};
