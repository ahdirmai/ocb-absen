-- Migrasi: tabel jadwal_harian (FK absen_masuk_id + absen_keluar_id)
-- Jadwal shift harian per-orang untuk Sales Toko (category_user=18) & Trainee Sales Toko (21).
-- 1 baris = 1 user pada 1 tanggal, menentukan retail + tipe absen masuk & keluar (FK ke tipe_absen.absen_id).

CREATE TABLE IF NOT EXISTS `jadwal_harian` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `retail_id` int NOT NULL,
  `absen_masuk_id` int NOT NULL COMMENT 'FK -> tipe_absen.absen_id (Absen Masuk)',
  `absen_keluar_id` int NOT NULL COMMENT 'FK -> tipe_absen.absen_id (Absen Keluar)',
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `is_deleted` int DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_tanggal` (`user_id`, `tanggal`),
  KEY `idx_tanggal` (`tanggal`),
  CONSTRAINT `fk_jadwal_masuk` FOREIGN KEY (`absen_masuk_id`) REFERENCES `tipe_absen` (`absen_id`),
  CONSTRAINT `fk_jadwal_keluar` FOREIGN KEY (`absen_keluar_id`) REFERENCES `tipe_absen` (`absen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
