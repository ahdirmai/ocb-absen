-- Audit kolom untuk fitur Koreksi Absen. updated_by = user_id admin yang
-- mengoreksi baris absensi; updated_at = timestamp koreksi (Asia/Makassar).
-- updated_at IS NOT NULL menandai baris pernah dikoreksi (tak perlu flag terpisah).
-- Lihat docs/absensi-koreksi-plan.md.

ALTER TABLE absensi
  ADD COLUMN updated_by INT NULL DEFAULT NULL AFTER approved_at,
  ADD COLUMN updated_at DATETIME NULL DEFAULT NULL AFTER updated_by;
