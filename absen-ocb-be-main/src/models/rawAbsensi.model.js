const dbpool = require('../config/database');

/**
 * Struktur JOIN mengacu pada historyAbsensiAllUser, dengan tambahan:
 * - Filter hanya tipe absen masuk (ta.name LIKE '%masuk%')
 * - ta.start_time sebagai jam_masuk_seharusnya
 * - CASE status_kehadiran (Ontime / Telat / Belum Absen)
 * - FROM user sebagai base agar user yang belum absen tetap muncul
 *
 * @param {string} startDate - Format: 'YYYY-MM-DD'
 * @param {string} endDate   - Format: 'YYYY-MM-DD'
 */
const getRawAbsensi = async (startDate, endDate) => {
    const SQLQuery = `
        SELECT
            u.user_id,
            u.name                              AS nama_karyawan,
            a.absensi_id,
            a.absen_time,
            a.retail_id,
            r.name                              AS retail_name,
            a.absen_type_id,
            ta.name                             AS category_absen,
            ta.description,
            ta.fee,
            ta.start_time                       AS jam_masuk_seharusnya,
            uz.name                             AS approval,
            a.is_valid,
            a.reason,
            a.photo_url,
            CASE
                WHEN a.absensi_id IS NULL       THEN 'Belum Absen'
                WHEN a.status_absen = 1         THEN 'Ontime'
                WHEN a.status_absen = 2         THEN 'Telat'
                ELSE 'Tidak Diketahui'
            END                                 AS status_kehadiran
        FROM user u
        LEFT JOIN absensi a
            ON  a.user_id = u.user_id
            AND DATE(a.absen_time) BETWEEN ? AND ?
        LEFT JOIN retail r        ON r.retail_id  = a.retail_id
        LEFT JOIN tipe_absen ta   ON ta.absen_id  = a.absen_type_id
        LEFT JOIN user uz         ON uz.user_id   = a.approval_by
        WHERE u.is_deleted = 0
          AND u.enabled    = 1
          AND (ta.name LIKE '%masuk%' OR a.absensi_id IS NULL)
        ORDER BY u.name ASC, a.absen_time ASC
    `;
    return dbpool.execute(SQLQuery, [startDate, endDate]);
};

/**
 * Versi harian — satu tanggal spesifik.
 *
 * @param {string} date - Format: 'YYYY-MM-DD'
 */
const getRawAbsensiHarian = async (date) => {
    const SQLQuery = `
        SELECT
            u.user_id,
            u.name                              AS nama_karyawan,
            a.absensi_id,
            a.absen_time,
            a.retail_id,
            r.name                              AS retail_name,
            a.absen_type_id,
            ta.name                             AS category_absen,
            ta.description,
            ta.fee,
            ta.start_time                       AS jam_masuk_seharusnya,
            uz.name                             AS approval,
            a.is_valid,
            a.reason,
            a.photo_url,
            CASE
                WHEN a.absensi_id IS NULL       THEN 'Belum Absen'
                WHEN a.status_absen = 1         THEN 'Ontime'
                WHEN a.status_absen = 2         THEN 'Telat'
                ELSE 'Tidak Diketahui'
            END                                 AS status_kehadiran
        FROM user u
        LEFT JOIN absensi a
            ON  a.user_id = u.user_id
            AND DATE(a.absen_time) = ?
        LEFT JOIN retail r        ON r.retail_id  = a.retail_id
        LEFT JOIN tipe_absen ta   ON ta.absen_id  = a.absen_type_id
        LEFT JOIN user uz         ON uz.user_id   = a.approval_by
        WHERE u.is_deleted = 0
          AND u.enabled    = 1
          AND (ta.name LIKE '%masuk%' OR a.absensi_id IS NULL)
        ORDER BY u.name ASC, a.absen_time ASC
    `;
    return dbpool.execute(SQLQuery, [date]);
};

module.exports = {
    getRawAbsensi,
    getRawAbsensiHarian,
};
