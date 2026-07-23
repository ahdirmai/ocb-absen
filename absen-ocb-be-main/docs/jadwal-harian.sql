-- Migrasi: tabel jadwal_harian
-- Jadwal shift harian per-orang untuk Sales Toko (category_user=18) & Trainee Sales Toko (21).
-- 1 baris = 1 user pada 1 tanggal, menentukan retail + kategori_absen shift.
-- UNIQUE(user_id, tanggal) => 1 shift per orang per hari (di-upsert saat re-assign).

CREATE TABLE IF NOT EXISTS `jadwal_harian` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `retail_id` int NOT NULL,
  `kategori_absen` varchar(45) NOT NULL,
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
  KEY `idx_user_tanggal_active` (`user_id`, `tanggal`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
