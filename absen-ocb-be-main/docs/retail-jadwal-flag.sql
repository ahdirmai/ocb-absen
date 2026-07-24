-- Tambah flag uses_jadwal_harian ke tabel retail.
-- 0 = tidak pakai jadwal harian (default, backward-compatible).
-- 1 = pakai jadwal harian.

ALTER TABLE retail ADD COLUMN uses_jadwal_harian TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active;
