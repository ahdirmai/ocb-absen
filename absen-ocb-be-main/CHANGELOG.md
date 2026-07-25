# Changelog

## [Unreleased]

### Added
- **Jadwal Shift Harian per-orang** — hanya untuk Sales Toko (`category_user=18`) & Trainee Sales Toko (`21`)
  - Tabel `jadwal_harian` (lihat `docs/jadwal-harian.sql`) — 1 baris = user + tanggal + retail + `absen_masuk_id` + `absen_keluar_id` (FK ke `tipe_absen.absen_id`), `UNIQUE(user_id, tanggal)`
  - Hanya tipe absen Masuk + Keluar yang ditampilkan (Kebersihan/Parkir/Display tidak)
  - Endpoint (auth):
    - `GET /api/jadwal-harian?month=YYYY-MM&retail_id=optional` — list jadwal per bulan
    - `GET /api/jadwal-harian/eligible-users` — user Sales Toko & Trainee saja
    - `GET /api/jadwal-harian/kategori` — opsi shift spesifik (`{shift_name, kategori_absen, absen_masuk_id, absen_keluar_id}`)
    - `GET /api/jadwal-harian/by-date?retail_id=&tanggal=` — jadwal satu retail satu tanggal
    - `GET /api/jadwal-harian/employees/:retailId` — karyawan terhubung ke retail via shifting
    - `POST /api/jadwal-harian/assign` — upsert bulk (banyak user × rentang tanggal, perlu `absen_masuk_id` + `absen_keluar_id`)
    - `POST /api/jadwal-harian/set-date` — replace atomik semua jadwal retail+tanggal
    - `POST /api/jadwal-harian/delete/:id` — soft delete
  - `getTypeAbsenPerShift` (`POST /api/absen-management/shift-user/:userId`): untuk kategori 18/21 yang sudah punya jadwal hari ini → tampilkan hanya 2 tipe absen (Masuk+Keluar) via FK langsung; belum di-assign → kosong (tak bisa absen); kategori lain → perilaku lama (tak berubah)
  - Absen telat Sales Toko/Trainee → butuh approval (`status_approval=1`); keluar diblok sampai masuk di-approve
  - Halaman admin FE `JadwalHarian.jsx` (`/jadwal-harian`): matrix karyawan × tanggal 1-31, klik cell → assign shift spesifik (S1/S2/S3/S4/S5/TRAINEE)

- **Fitur Lembur Sales Toko / Trainee**
  - Flag `is_lembur` (TINYINT 1, default 0) di tabel `absensi`
  - Endpoint: `GET /api/absen-management/lembur-types/:userId` — tipe absen lembur = masuk+keluar Pagi (S1-PAGI 8 JAM + S2-PAGI 9 JAM), exclude TRAINEE, exclude tipe yang sudah dipakai regular
  - FE Absen Karyawan (`/absen`):
    - Tombol "Mulai Lembur" muncul saat ada jadwal + ada tipe lembur tersedia
    - Dropdown pilih OC/Store (filter OC 1-40) → jadi lokasi absen & radius check
    - Tipe lembur filter berdasarkan jam (shift window: Pagi 06:00-16:00, Sore 14:00-00:00, Malam 22:00-08:00)
    - Tipe lembur filter berdasarkan attempt (belum lembur masuk → tampilkan masuk; sudah → tampilkan keluar)
    - Submit → `is_lembur=1` + `is_approval=1` (perlu approval atasan)
  - Riwayat absen: badge "Lembur" oranye untuk absen dengan `is_lembur=1`

- **Absen telat butuh approval (Sales Toko/Trainee)**
  - Absen lewat `end_time` tipe absen → `status_approval=1` (waiting), `is_valid=0`
  - Absen keluar diblok sampai masuk di-approve (`getApprovedMasukCount`)
  - Hanya untuk kategori 18/21; kategori lain tetap langsung sah

- **Ignore absen di admin** — tombol "Ignore" di page Absensi (history admin) → `reject-absensi` → `status_approval=3`, user bisa absen ulang
  - `isRejectedAttendance` di FE: tambah cek `includes("reject")` (sesuaikan dgn `approval_status.description_status`)

- **Jadwal_harian FK schema** — `absen_masuk_id` + `absen_keluar_id` (FK ke `tipe_absen.absen_id`), ganti `kategori_absen` string
  - `getTypeAbsenByJadwal`: join langsung via FK, return 2 tipe (masuk+keluar) saja
  - `is_absen_today` subquery: ganti `is_valid=1` → `status_approval IS NULL OR status_approval <> 3` (include waiting)

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
- **Flag `uses_jadwal_harian` pindah dari `retail` ke `shifting`** (lihat `docs/shifting-jadwal-flag.sql`)
  - Alasan: keputusan "pakai jadwal harian" milik periode shift, bukan retail. Satu retail bisa punya shift jadwal-harian & non-jadwal.
  - Kolom `retail.uses_jadwal_harian` di-DROP; `shifting.uses_jadwal_harian TINYINT(1) DEFAULT 0` ditambah
  - **Gating absen tidak lagi hardcode `category_user IN (18,21)`** — `getTypeAbsenPerShift` & `getShiftJadwalStatus` sekarang cek helper `userUsesJadwalHarian`: user punya shifting aktif hari ini (`start_date <= CURDATE() <= end_date`, `is_deleted=0`) dengan `uses_jadwal_harian=1`
  - FE `Shift.jsx`: toggle "Pakai Jadwal Harian?" di form create + update shift
  - FE `Retail.jsx`: toggle & kolom flag dihapus (revert)
  - FE `JadwalHarian.jsx`: dropdown retail tampilkan semua OC (filter flag retail dihapus)
  - `updateShifting` di-parameterize sekalian (sebelumnya string-interpolation → rawan SQL injection)
  - Catatan: approval telat Sales Toko/Trainee di `absensi.controller.js` tetap pakai `category_user IN (18,21)` (konsep terpisah dari gating jadwal)

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
