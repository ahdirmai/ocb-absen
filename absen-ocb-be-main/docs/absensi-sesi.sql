-- Migrasi: tabel absensi_sesi (gabung absen masuk <-> keluar jadi 1 kesatuan).
-- 1 baris = 1 sesi kerja: masuk + keluar dipasangkan eksplisit via FK ke absensi.
-- Terhubung ke jadwal_harian (kontrak absen harian) via jadwal_id.
-- Approval TIDAK diduplikasi di sini; tetap per-event di absensi (source of truth).
-- Lihat docs/absensi-sesi-plan.md untuk detail desain.

CREATE TABLE IF NOT EXISTS `absensi_sesi` (
  `sesi_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tanggal` date NOT NULL COMMENT 'tanggal absen masuk (anchor)',
  `retail_id` int NOT NULL,
  `jadwal_id` int DEFAULT NULL COMMENT 'FK -> jadwal_harian.id (NULL utk non-shift/lembur/backfill)',
  `kategori_absen` varchar(45) DEFAULT NULL,
  `masuk_absensi_id` int DEFAULT NULL COMMENT 'FK -> absensi.absensi_id (NULL hanya utk backfill keluar-tanpa-masuk)',
  `keluar_absensi_id` int DEFAULT NULL COMMENT 'FK -> absensi.absensi_id (NULL = sesi terbuka)',
  `is_lembur` tinyint DEFAULT 0,
  `status` enum('open','closed','incomplete') DEFAULT 'open',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`sesi_id`),
  KEY `idx_user_tanggal` (`user_id`, `tanggal`),
  KEY `idx_jadwal` (`jadwal_id`),
  KEY `idx_masuk` (`masuk_absensi_id`),
  KEY `idx_keluar` (`keluar_absensi_id`),
  CONSTRAINT `fk_sesi_masuk` FOREIGN KEY (`masuk_absensi_id`) REFERENCES `absensi` (`absensi_id`),
  CONSTRAINT `fk_sesi_keluar` FOREIGN KEY (`keluar_absensi_id`) REFERENCES `absensi` (`absensi_id`),
  CONSTRAINT `fk_sesi_jadwal` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_harian` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
