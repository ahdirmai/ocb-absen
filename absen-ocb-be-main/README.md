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

> **Validasi radius:** Absen ditolak (HTTP 400) jika lokasi GPS di luar `radius` retail. Hanya aktif bila retail punya `latitude`, `longitude`, dan `radius`.

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
