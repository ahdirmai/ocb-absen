-- Pindah flag uses_jadwal_harian dari retail ke shifting.
-- Alasan: keputusan "pakai jadwal harian" milik periode shift (shifting),
-- bukan retail. Satu retail bisa punya shift jadwal-harian & non-jadwal.
-- 0 = tidak pakai jadwal harian (default). 1 = pakai jadwal harian.

ALTER TABLE shifting ADD COLUMN uses_jadwal_harian TINYINT(1) NOT NULL DEFAULT 0 AFTER retail_id;

-- Buang kolom lama di retail (salah tempat).
ALTER TABLE retail DROP COLUMN uses_jadwal_harian;
