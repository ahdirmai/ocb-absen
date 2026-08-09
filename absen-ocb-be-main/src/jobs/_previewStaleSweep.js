// Preview read-only: hitung berapa sesi yang AKAN ditandai incomplete oleh
// sweepStaleOpenSesiIncomplete. Tidak memutasi apa pun. Buang setelah verifikasi.
require("dotenv").config();
const dbpool = require("../config/database");

const CROSS_DATE_KELUAR_GRACE_HOURS = 3;

(async () => {
  const [rows] = await dbpool.query(
    `SELECT s.sesi_id, s.user_id, s.tanggal, ta.name AS tipe_masuk,
            COALESCE(ta.is_cross_date, 0) AS is_cross_date,
            tk.start_time AS keluar_start
       FROM absensi_sesi s
       JOIN absensi a ON a.absensi_id = s.masuk_absensi_id
       JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
       LEFT JOIN tipe_absen tk
         ON tk.name = ta.name AND tk.is_deleted = 0
        AND (LOWER(tk.description) LIKE '%keluar%' OR LOWER(tk.description) LIKE '%pulang%')
      WHERE s.status = 'open'
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
        )
      ORDER BY s.tanggal ASC
      LIMIT 20`,
    [CROSS_DATE_KELUAR_GRACE_HOURS]
  );

  const [[{ total }]] = await dbpool.query(
    `SELECT COUNT(*) AS total
       FROM absensi_sesi s
       JOIN absensi a ON a.absensi_id = s.masuk_absensi_id
       JOIN tipe_absen ta ON ta.absen_id = a.absen_type_id
       LEFT JOIN tipe_absen tk
         ON tk.name = ta.name AND tk.is_deleted = 0
        AND (LOWER(tk.description) LIKE '%keluar%' OR LOWER(tk.description) LIKE '%pulang%')
      WHERE s.status = 'open'
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
    [CROSS_DATE_KELUAR_GRACE_HOURS]
  );

  console.log(`TOTAL akan ditandai incomplete: ${total}`);
  console.table(rows);
  process.exit(0);
})().catch((e) => {
  console.error("PREVIEW ERR", e.message);
  process.exit(1);
});
