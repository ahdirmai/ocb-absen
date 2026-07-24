# Plan: Sesi Absen (gabung masuk↔keluar jadi 1 kesatuan)

## Context
Absen masuk & keluar tersimpan sebagai baris terpisah di `absensi` tanpa link eksplisit. Pairing masuk→keluar **implisit** — dimatch via `description LIKE '%masuk%'/'%keluar%'` + kesamaan `kategori_absen`/`start_time`. Rapuh: butuh hack cross-midnight (`getMasukCountIncludingYesterday`), lembur masuk↔keluar dimatch via string nama di FE (`AbsenKaryawan.jsx:378`), tak ada konstrain "1 sesi terbuka per kategori".

Tujuan: tabel **`absensi_sesi`** — kawinkan masuk↔keluar jadi 1 kesatuan kerja (eksplisit, FK), terhubung ke `jadwal_harian`. Ganti pairing implisit dengan link eksplisit.

Fitur **leave (cuti/izin/sakit) DITUNDA** — fase terpisah. Dokumen ini fokus sesi.

### Kenapa mempermudah sistem lembur (motivasi utama)
Lembur = konsumen terberat pairing implisit.

| Pertanyaan lembur | Sekarang (rapuh) | Dengan sesi |
|---|---|---|
| Regular komplit? | 2× `SUM(LIKE '%masuk%')`/`'%keluar%'` | `sesi WHERE is_lembur=0 AND status='closed'` ada? |
| Lembur jalan? | rekonstruksi FE dari filter+LIKE | `sesi WHERE is_lembur=1 AND status='open'` |
| Masuk↔keluar lembur pasangan? | match string nama (`AbsenKaryawan.jsx:378`, pernah bug) | `sesi_id` sama (1 baris) |
| Lembur selesai? | filter+LIKE tiap render (`:325-336`) | `sesi.status='closed'` |
| Cross-midnight | hack `INTERVAL 1 DAY` | anchor tanggal natural |

- Hard-guard lembur (fase audit) jadi 1 cek: "ada sesi regular closed?".
- FE `lemburComplete`/`effectiveLemburMode` (`:325-336`): dari ~20 baris derivasi LIKE → baca `sesi_status`. Reload-safe (state dari DB).
- Setelah port guard+FE ke sesi, **kelas bug pairing hilang**: salah-match nama, cross-midnight, `is_lembur` ambigu jadi mustahil.

### Keputusan final
- Migrasi: **forward-only** + backfill best-effort (hanya grup balanced).
- Approval: TETAP per-event di `absensi` (tak diduplikasi ke sesi).
- Sesi terhubung ke `jadwal_harian` via `jadwal_id`.

### Data reality (probe live DB, 100.831 rows, Jan 2025–Jul 2026)
- Arah: masuk 58.081 / keluar 40.464 / neither 2.286.
- Pairing per (user+tgl+kategori) = 61.787 grup: **balanced 59%**, masuk-tanpa-keluar 34%, keluar-tanpa-masuk 5.7%, multi 0.5%.
- Konsekuensi: backfill 59% jadi sesi utuh; 41% jadi `incomplete`. Event `absensi` asli TIDAK dibuang — sumber kebenaran; `absensi_sesi` layer di atasnya.

---

## Skema: `absensi_sesi`
```sql
CREATE TABLE `absensi_sesi` (
  `sesi_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tanggal` date NOT NULL,                 -- tanggal absen masuk (anchor)
  `retail_id` int NOT NULL,
  `jadwal_id` int DEFAULT NULL,            -- FK -> jadwal_harian.id (NULL utk non-shift/lembur/backfill)
  `kategori_absen` varchar(45) DEFAULT NULL,
  `masuk_absensi_id` int DEFAULT NULL,     -- FK -> absensi.absensi_id (NULL hanya utk backfill keluar-tanpa-masuk)
  `keluar_absensi_id` int DEFAULT NULL,    -- FK -> absensi.absensi_id (NULL = sesi terbuka)
  `is_lembur` tinyint DEFAULT 0,
  `status` enum('open','closed','incomplete') DEFAULT 'open',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`sesi_id`),
  KEY `idx_user_tanggal` (`user_id`,`tanggal`),
  KEY `idx_jadwal` (`jadwal_id`),
  CONSTRAINT `fk_sesi_masuk` FOREIGN KEY (`masuk_absensi_id`) REFERENCES `absensi`(`absensi_id`),
  CONSTRAINT `fk_sesi_keluar` FOREIGN KEY (`keluar_absensi_id`) REFERENCES `absensi`(`absensi_id`),
  CONSTRAINT `fk_sesi_jadwal` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_harian`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
DDL disimpan di `docs/absensi-sesi.sql` (ikut pola `docs/jadwal-harian.sql`).

**Invariant:**
- `status`: `open` (masuk saja) → `closed` (keluar terisi) → `incomplete` (backfill orphan / sesi ditinggalkan).
- 1 sesi = 1 pasang. Lembur = sesi kedua hari itu, `is_lembur=1`.
- Tak tambah kolom di `absensi` (hindari alter 100k rows). Link satu arah header → event.
- **`jadwal_id` → `jadwal_harian`** (kontrak: user+tanggal → retail + `absen_masuk_id`/`absen_keluar_id`). NULLABLE: non-shift, lembur, backfill pra-jadwal. Regular Sales Toko/Trainee: WAJIB refer jadwal hari itu.
- **TANPA `status_approval` di sesi.** Approval per-event tetap di `absensi` (source of truth). "Sesi approved?" diturunkan saat query:
  ```sql
  (m.status_approval = 2 OR m.status_approval IS NULL)
    AND (s.keluar_absensi_id IS NULL OR k.status_approval = 2 OR k.status_approval IS NULL)
  ```
  `is_lembur` tetap di sesi (properti sesi, bukan per-event).

---

## Perubahan kode

### 1. Insert path — buka/tutup sesi (`absensi.controller.js` `createAbsensi`)
Titik tunggal insert absensi (`absensi.model.js:5`) → wiring sesi terpusat.
Setelah `absensiModel.createAbsensi(...)` sukses (dapat `insertId`):
- **Masuk** (`!isKeluar`): resolve `jadwal_id` — Sales Toko/Trainee ambil `jadwal_harian` hari itu (reuse pola `absenManagement.model.js` getTypeAbsenByJadwal), lembur/non-shift → NULL. Buat row `absensi_sesi`: `masuk_absensi_id=insertId`, `jadwal_id`, `status='open'`, `is_lembur=body.is_lembur`, `kategori_absen`+`retail_id`.
- **Keluar** (`isKeluar`): cari sesi `open` user (match `is_lembur` + `jadwal_id`/kategori, anchor termasuk kemarin utk cross-midnight) → set `keluar_absensi_id=insertId`, `status='closed'`. Tak ada sesi open → buat `incomplete`.
- **Konsistensi jadwal**: regular Sales Toko/Trainee → `absen_type_id` WAJIB cocok `jadwal_harian.absen_masuk_id`/`absen_keluar_id`. Perkuat authz fase audit dengan link FK eksplisit. Tak cocok → sudah 403 oleh authz existing.
- File baru `models/absensiSesi.model.js`: `openSesi()`, `closeSesi()`, `findOpenSesi()`, `resolveJadwalId()`.
- **Transaksi**: insert absensi + open/close sesi dalam 1 DB transaction (hindari orphan). Cek `config/database.js` support `getConnection()`.

### 2. Rework 5 query pairing implisit → baca sesi (dual-path)
File `absensi.model.js`. Selama cutover, prefer sesi, fallback LIKE utk data pra-deploy:

| Fungsi | Ganti jadi |
|---|---|
| `getTodayAttendanceDirectionSummary` | hitung dari `absensi_sesi` (open/closed) |
| `getTodayDirectionSummaryByLembur` | `absensi_sesi WHERE is_lembur=?` |
| `getMasukCountIncludingYesterday` | sesi anchor kemarin+hari ini (hack INTERVAL hilang) |
| `getApprovedMasukCount` | sesi + JOIN absensi masuk utk status_approval (derived) |
| `cekAbsensiTodayByTimeCategory` | cek sesi open per kategori (konstrain jelas) |

Hard-guard lembur (`absensi.controller.js`, dari fase audit) tetap, tapi baca sesi bukan LIKE.

### 3. History endpoint expose sesi (`absensi.model.js` `historyAbsensiPerUser`)
- Tambah `sesi_id` + `sesi_status` di response (LEFT JOIN `absensi_sesi` on masuk/keluar id).

### 4. FE lembur match (`AbsenKaryawan.jsx`)
- Ganti match nama string (:378) → `sesi_id` dari history.
- `effectiveLemburMode`/`lemburComplete` (`:325-336`) baca `sesi_status`, bukan rekonstruksi LIKE.
- Attempt aktif tampil pasangan sesi eksplisit: "Sesi — Masuk ✓ / Keluar ⧗".
- Empty-state lembur (dari fase audit) tetap.

### 5. Rekap kalender (`absensi.controller.js` ~:505-568) — OPSIONAL
- Bisa tetap baca `absensi` langsung (dual-path). Migrasi ke sesi menyusul. Tak wajib untuk gabung sesi.

---

## Migrasi data (forward-only + backfill best-effort)
Script `scripts/backfill-sesi.js` (idempoten, jalankan di copy DB dulu):
1. Grup `absensi` non-rejected per (user_id, DATE, kategori_absen).
2. **Balanced (59%)** → sesi `closed`, `is_lembur` dari row. Isi `jadwal_id` bila `jadwal_harian` match (user+tanggal+type), else NULL.
3. **Orphan masuk-tanpa-keluar (34%)** → sesi `incomplete`, keluar NULL.
4. **Keluar-tanpa-masuk (5.7%)** → sesi `incomplete`, masuk NULL. JANGAN tebak-pasang lintas hari.
5. **Multi (0.5%)** → log, pasangkan by nearest time atau skip manual.
6. **neither (2.286)** → tak masuk sesi; tetap di `absensi`.
- Forward: mulai deploy, insert path #1 isi sesi.
- Dual-path baca (#2/#3) dihapus setelah cutover (~2 bulan).

---

## Task list (urut, dependency dari atas)

### T0 — Backup DB (WAJIB sebelum DDL/migrasi)
- Script `scripts/backup-db.js`: `mysqldump` DB `absen_management` → `backups/absen_management_<YYYYMMDD_HHMMSS>.sql` (kredensial dari `.env`).
- Tambah `backups/` ke `.gitignore`.
- Timestamped, tak overwrite. Assert file terbentuk + size > 0.
- Verifikasi: `tail` dump ada `-- Dump completed`.
- **Jalankan sebelum T1 (DDL) dan T7 (backfill).**

### T1 — Skema + DDL
- Tulis `docs/absensi-sesi.sql`.
- Jalankan DDL di dev DB. Verifikasi FK + index.

### T2 — Model sesi baru (`models/absensiSesi.model.js`)
- `openSesi(conn, {...})`, `closeSesi(conn, sesi_id, keluar_absensi_id)`
- `findOpenSesi(conn, {user_id, is_lembur, kategori_absen, jadwal_id, includeYesterday})`
- `resolveJadwalId(user_id, absen_type_id, tanggal)`
- Cek `config/database.js` support `getConnection()`.

### T3 — Wiring insert path (`absensi.controller.js` `createAbsensi`)
- Bungkus insert absensi + open/close sesi dalam 1 transaksi.
- Masuk → `openSesi`. Keluar → `findOpenSesi` → `closeSesi`, else `incomplete`.
- Resolve `jadwal_id` regular Sales Toko/Trainee.

### T4 — Rework query baca dual-path — DONE (scope diperkecil)
- **Keputusan**: 3 fungsi summary-count (`getTodayAttendanceDirectionSummary`, `getTodayDirectionSummaryByLembur`, `getMasukCountIncludingYesterday`, `getApprovedMasukCount`) TIDAK di-rewrite. Alasan: yang brittle cuma PAIRING (sudah beres di T3 insert path). Klasifikasi 1 event via `LIKE '%masuk%'` + kolom `is_lembur` (trusted post-audit) sudah benar. Rewrite ke SQL sesi tambah risiko divergence cutover tanpa gain correctness.
- **Yang dikerjakan**: hard-guard lembur (`absensi.controller.js`) baca sesi via helper baru `sesiModel.getTodaySesiSummary()`. Dual-path: prefer `absensi_sesi` (regular closed? / lembur open-or-closed?), fallback count LIKE bila user belum punya sesi (data pra-deploy). Ini payoff utama — guard tak lagi bergantung 2× SUM LIKE.

### T5 — History expose sesi (`absensi.model.js` `historyAbsensiPerUser`)
- LEFT JOIN `absensi_sesi`, tambah `sesi_id` + `sesi_status`.

### T6 — FE lembur pakai sesi (`AbsenKaryawan.jsx`)
- Match nama string (:378) → `sesi_id`.
- `effectiveLemburMode`/`lemburComplete` (:325-336) baca `sesi_status`.
- Tampil pasangan sesi eksplisit.
- `npx vite build` pass.

### T7 — Backfill script (`scripts/backfill-sesi.js`)
- Idempoten. Jalankan di COPY DB dulu.
- Validasi: sesi `closed`≈36.5k, `incomplete`≈24.5k, `COUNT(absensi)` tetap.

### T8 — Rekap migrasi (opsional/menyusul)
- Bisa tetap dual-path. Tak blok gabung sesi.

---

## Verifikasi
- **Backup**: dump timestamped di `backups/`, size > 0, footer `-- Dump completed`. SEBELUM DDL + backfill.
- **Schema**: DDL jalan di dev, FK + index kebentuk.
- **Insert masuk**: sesi `open` + `jadwal_id` terisi utk Sales Toko.
- **Insert keluar**: sesi `closed` + `keluar_absensi_id` terisi.
- **Cross-midnight**: masuk 23:00 + keluar 01:00 → 1 sesi span 2 tanggal (tanpa hack INTERVAL).
- **Transaksi**: simulasi sesi gagal → absensi rollback (tak ada absensi tanpa sesi di path baru).
- **Link jadwal**: sesi regular refer `jadwal_harian.id` benar; type di luar jadwal → 403 + tak buat sesi.
- **Lembur**: regular komplit → mulai lembur → sesi `is_lembur=1` terpisah; guard reject lembur tanpa regular.
- **Backfill**: di copy DB → sesi `closed`≈36.5k, `incomplete`≈24.5k, `COUNT(absensi)` tetap (0 event hilang).
- **FE**: `npx vite build` pass; flow lembur pakai sesi_id benar; reload mid-sesi state konsisten dari `sesi_status`.
- **Regression**: history, fee, approval list, rekap tetap jalan (dual-path fallback).
