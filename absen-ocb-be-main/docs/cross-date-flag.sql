-- Flag is_cross_date di tipe_absen: menandai shift yang keluarnya lewat tengah
-- malam (masuk hari-N, keluar hari-N+1). Contoh: SUBUH 9 JAM (masuk 23:00,
-- keluar 08:00), SORE 9 JAM (masuk 16:00, keluar 01:00).
-- Dipakai untuk bedakan "cross-date sah" vs "lupa keluar (sesi basi)".
-- 0 = same-day (default). 1 = cross-date.

ALTER TABLE tipe_absen
  ADD COLUMN is_cross_date TINYINT(1) NOT NULL DEFAULT 0 AFTER kategori_absen;

-- Backfill konservatif: hanya tipe yang JELAS cross-date by konvensi.
-- SORE 9 JAM (masuk/keluar/durasi): 7, 49, 50, 51, 52
-- SUBUH 9 JAM (masuk/keluar/durasi): 8, 53, 54, 55, 56
-- SUBUH standalone (masuk 23:00 / keluar 07:00): 107, 108
-- Tipe cross-date custom retail lain (MALAM, dsb) → set manual via toggle CatAbsen.
UPDATE tipe_absen SET is_cross_date = 1
  WHERE absen_id IN (7, 49, 50, 51, 52, 8, 53, 54, 55, 56, 107, 108);
