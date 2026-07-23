# Changelog

## [Unreleased]

### Added
- **Rekap Kalender Absensi** — `GET /api/absensi/rekap-kalender?month=YYYY-MM&retail_id=optional`
  - Status per hari per karyawan per retail: hadir / terlambat / alpha / libur / belum
  - Filter hanya tipe absen `description LIKE 'Absen Masuk%'`
  - Timezone Asia/Makassar konsisten untuk semua kalkulasi tanggal

- **Migration Endpoints** — protected by `X-Migration-Key` header
  - `GET /api/migration/retail` — semua retail termasuk soft-deleted, include `is_deleted`
  - `GET /api/migration/user-categories` — kategori user
  - `GET /api/migration/users` — semua user aktif, include `upline_name` (resolve dari upline user_id)
  - `GET /api/migration/shifts` — semua shift + employees[], `start_date`/`end_date` format `YYYY-MM-DD`
  - `GET /api/migration/absen-categories` — semua tipe absen termasuk soft-deleted

### Changed
- **Validasi radius absen** — absen di luar radius retail sekarang diblokir (HTTP 400), sebelumnya hanya ditandai `is_approval=1`
  - Berlaku hanya jika retail punya `latitude`, `longitude`, dan `radius`; retail tanpa data lokasi tetap lolos
  - Pesan: `"Anda berada di luar radius lokasi absen. Absen tidak dapat dilakukan."`
  - **Pengecualian OC/Store terdekat** — jika di luar radius retail asal tetapi masih dalam radius OC/Store lain yang aktif, absen tetap diizinkan dengan `is_approval=1` dan `reason` mencatat nama store terdekat
  - Ditolak hanya jika di luar radius retail asal DAN tidak dekat OC/Store manapun

### Fixed
- **Sinkronisasi `is_valid` dengan approval** — approve absen sekarang set `is_valid=1`, reject set `is_valid=0`
  - Sebelumnya `approveAbsen`/`rejectAbsen` hanya ubah `status_approval`, `is_valid` tetap 0 sehingga absen approved masih tampil "Menunggu approval" di FE
  - Approve → valid; reject → invalid dan user bisa absen ulang kategori waktu yang sama (dup-check exclude `status_approval=3`)
- Migration `/shifts` — `start_date`/`end_date` pakai `DATE_FORMAT` agar tidak ada timezone offset dari Node.js driver
- Migration `/retail` — expose semua retail (termasuk `is_deleted=1`) agar referensi dari shifting tidak orphan
- Rekap kalender — date extraction pakai `moment.tz(Asia/Makassar)` agar tidak shift 1 hari akibat UTC conversion
