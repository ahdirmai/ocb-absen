# OCB Absensi — Backend

Node.js + Express REST API untuk sistem absensi karyawan OCB Group.

## Stack

- Node.js + Express
- MySQL (mysql2)
- JWT Auth
- moment-timezone (Asia/Makassar)

## Setup

```bash
cp .env.example .env
# isi DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME, JWT_SECRET, MIGRATION_API_KEY
npm install
node src/index.js
```

## Environment Variables

| Key | Keterangan |
|---|---|
| `PORT` | Port server (default 4000) |
| `DB_HOST` | MySQL host |
| `DB_USERNAME` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Nama database |
| `JWT_SECRET` | Secret untuk JWT token |
| `MIGRATION_API_KEY` | API key untuk migration endpoints |

## API Endpoints

### Auth
| Method | URL | Keterangan |
|---|---|---|
| POST | `/api/users/login-dashboard` | Login dashboard |
| POST | `/api/users/logout` | Logout |

### Absensi
| Method | URL | Keterangan |
|---|---|---|
| GET | `/api/absensi/history` | Histori semua absensi |
| POST | `/api/absensi/history-user/:userId` | Histori per user |
| GET | `/api/absensi/rekap-kalender` | Rekap kalender per retail (`?month=YYYY-MM`) |
| POST | `/api/absensi/approve-absensi/:absenId` | Approve absensi |
| POST | `/api/absensi/reject-absensi/:absenId` | Reject absensi |
| POST | `/api/absensi/validasi/:absenId` | Validasi absensi |

> **Validasi radius:** Absen ditolak (HTTP 400) jika lokasi GPS di luar `radius` retail. Hanya aktif bila retail punya `latitude`, `longitude`, dan `radius`. Pengecualian: jika di luar radius retail asal tapi masih dalam radius OC/Store lain yang aktif, absen diizinkan dengan `is_approval=1`.

> **Absen telat (Sales Toko/Trainee):** Absen lewat `end_time` → `status_approval=1` (waiting). Keluar diblok sampai masuk di-approve.

> **Lembur (Sales Toko/Trainee):** Setelah absen regular, user bisa lembur pakai tipe Pagi lain (S1/S2). Pilih OC → submit → `is_lembur=1` + approval.

### Jadwal Shift Harian
> **Aktivasi:** User masuk jalur jadwal harian bila punya shifting aktif hari ini (`start_date <= today <= end_date`) dengan flag `uses_jadwal_harian=1`. Set flag via toggle di halaman Shift. (Sebelumnya hardcode `category_user IN (18,21)`.)

| Method | URL | Keterangan |
|---|---|---|
| GET | `/api/jadwal-harian?month=YYYY-MM&retail_id=` | List jadwal per bulan |
| GET | `/api/jadwal-harian/eligible-users` | User Sales Toko & Trainee |
| GET | `/api/jadwal-harian/kategori` | Opsi shift (S1/S2/S3/S4/S5/TRAINEE) |
| GET | `/api/jadwal-harian/by-date?retail_id=&tanggal=` | Jadwal satu retail satu tanggal |
| GET | `/api/jadwal-harian/employees/:retailId` | Karyawan terhubung ke retail |
| POST | `/api/jadwal-harian/assign` | Upsert bulk (user_ids + retail + absen_masuk_id + absen_keluar_id + tanggal) |
| POST | `/api/jadwal-harian/set-date` | Replace atomik jadwal retail+tanggal |
| POST | `/api/jadwal-harian/delete/:id` | Soft delete |

### Lembur
| Method | URL | Keterangan |
|---|---|---|
| GET | `/api/absen-management/lembur-types/:userId` | Tipe absen lembur (Pagi, exclude assigned shift) |

### Migration (X-Migration-Key required)
| Method | URL | Keterangan |
|---|---|---|
| GET | `/api/migration/retail` | Semua retail + is_deleted |
| GET | `/api/migration/user-categories` | Kategori user |
| GET | `/api/migration/users` | User + upline_name |
| GET | `/api/migration/shifts` | Shift + employees[] |
| GET | `/api/migration/absen-categories` | Tipe absen + is_deleted |

Migration endpoints butuh header:
```
X-Migration-Key: <MIGRATION_API_KEY>
```

## Rekap Kalender

```
GET /api/absensi/rekap-kalender?month=2025-05
Authorization: Bearer <token>
```

Response per retail → per user → per hari:
- `hadir` — absen masuk ontime
- `terlambat` — absen masuk lewat end_time
- `alpha` — tidak absen di hari kerja
- `libur` — terdaftar offday
- `belum` — tanggal belum tiba
