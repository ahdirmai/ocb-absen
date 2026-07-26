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
| POST | `/api/absensi/koreksi/:absenId` | Koreksi jam/status/catatan/**tipe** (recompute potongan + audit) |
| GET | `/api/absensi/tipe-absen?direction=masuk\|keluar` | Daftar tipe absen per arah (dropdown koreksi) |
| GET | `/api/absensi/sesi` | List sesi paginated + filter (`status`,`start_date`,`end_date`,`search`,`user_id`,`retail_id`,`kategori`,`page`,`limit`) |
| POST | `/api/absensi/sesi/create` | Buat sesi baru (absen masuk, status open) — multipart, foto opsional |
| GET | `/api/absensi/sesi/:sesiId/candidates` | Kandidat pasangan match untuk sesi incomplete |
| POST | `/api/absensi/sesi/match` | Gabung 2 incomplete (`masuk_sesi_id`+`keluar_sesi_id`) → closed |
| POST | `/api/absensi/sesi/:sesiId/unmatch` | Pisah closed → 2 incomplete |
| POST | `/api/absensi/sesi/:sesiId/status` | Ubah status sesi manual |
| POST | `/api/absensi/sesi/:sesiId/add-absen` | Tambah absen bagian hilang (isi slot + close) |
| POST | `/api/absensi/sesi/:sesiId/delete` | Hapus 1 sesi |

> **Validasi radius:** Absen ditolak (HTTP 400) jika lokasi GPS di luar `radius` retail. Hanya aktif bila retail punya `latitude`, `longitude`, dan `radius`. Pengecualian: jika di luar radius retail asal tapi masih dalam radius OC/Store lain yang aktif, absen diizinkan dengan `is_approval=1`.

> **Absen telat (Sales Toko/Trainee):** Absen lewat `end_time` → `status_approval=1` (waiting). Keluar diblok sampai masuk di-approve.

> **Window absen masuk (semua jalur):** Absen masuk hanya boleh dalam window: paling awal **1 jam sebelum** `start_time`, paling akhir **sebelum jam pulang** shift (= `start_time` tipe KELUAR pasangan, match by `name`). Lewat batas → HTTP 400. Cross-date (`is_cross_date=1`, keluar besok) tak kena batas atas. Ex: PAGI masuk 08:00 pulang 17:00 → masuk hanya 07:00–16:59. Berlaku jadwal-harian, lembur, DAN non-jadwal (retail biasa). Enforcement BE.

> **Koreksi Absen (admin):** Admin ubah `absen_time`/`status_absen`/`reason`/**`absen_type_id`** 1 baris. Sistem recompute `status_absen` (ontime/telat vs `end_time` tipe baru) + `potongan` (telat >15mnt) dari waktu baru — kecuali admin override status eksplisit. Ganti tipe wajib **searah** (masuk↔masuk / keluar↔keluar; beda arah → HTTP 400). Bila baris = `masuk_absensi_id` sesi & jam geser tanggal → `absensi_sesi.tanggal` ikut update; bila tipe berganti → `absensi_sesi.kategori_absen` disinkron ke kategori tipe baru (cegah sesi pecah). Audit `updated_by`/`updated_at` + `log_activity` (old→new). Transaksional. Retail tak diubah.

> **Kelola Sesi Absensi (admin):** Page `/sesi-absensi` view + manage `absensi_sesi`. **Match** dua sesi incomplete (1 masuk-only + 1 keluar-only, user+shift+is_lembur sama, window 20h) → 1 `closed` (isi keluar ke masuk-sesi, hapus keluar-orphan). **Unmatch** `closed` → 2 incomplete. **Buat sesi baru**: pilih karyawan+retail+shift (tipe masuk)+jam → insert `absensi` masuk manual + `openSesi` (status `open`); absen keluar diisi kemudian via tambah absen. Dropdown shift menyesuaikan karyawan dipilih (FE fetch `shift-user/:userId`, filter arah masuk — hanya shift yang di-assign ke user). **Tambah absen** bagian hilang: sesi incomplete → insert `absensi` manual, recompute `status_absen`/`potongan` dari jam vs `end_time` tipe (override boleh), isi slot + `closed`. Tipe di-resolve dari shift name arah slot hilang (atau kirim `absen_type_id`). Absen manual: **foto opsional** (multipart `photo_url`, fallback placeholder `manual-admin`), **lokasi none** (lat/lon 0), `reason` +`[input manual admin]`, `is_valid=1` approved. **Ubah status** manual + **hapus** sesi. `candidates` endpoint sarankan pasangan; flag `has_candidate` di list highlight orphan berpasangan. Semua transaksional + audit `log_activity` (label aksi di `dataquery`; kolom `action` = enum INSERT/UPDATE/DELETE). Match/unmatch/status/delete tak menyentuh baris `absensi`; add-absen menambah 1 baris `absensi`.

> **Lembur (Sales Toko):** User bisa lembur (gantikan karyawan toko lain) pakai tipe shift beda, pilih OC → submit → `is_lembur=1` + approval. Trainee dikecualikan.
> - **Non-jadwal:** tipe lembur = PAGI saja, wajib absen regular hari ini komplit dulu.
> - **Jadwal-harian:** tipe lembur = kategori KOMPLEMEN shift yang di-assign hari ini (assigned SUBUH → Pagi+Sore; Sore → Pagi+Subuh; Pagi → Sore+Subuh). Boleh lembur sebelum/sesudah shift regular, diblokir hanya saat sedang menjalani shift regular (sesi regular open).
> - **Batas jam lembur masuk:** sama dgn regular jadwal-harian — hanya boleh 1 jam sebelum `start_time` tipe (mis. SORE masuk 15:00 → mulai 14:00). Gantikan filter window lama.

### Jadwal Shift Harian
> **Aktivasi:** User masuk jalur jadwal harian bila punya shifting aktif hari ini (`start_date <= today <= end_date`) dengan flag `uses_jadwal_harian=1`. Set flag via toggle di halaman Shift. (Sebelumnya hardcode `category_user IN (18,21)`.)

| Method | URL | Keterangan |
|---|---|---|
| GET | `/api/jadwal-harian?month=YYYY-MM&retail_id=` | List jadwal per bulan |
| GET | `/api/jadwal-harian/active-retails` | OC dgn shift jadwal-harian aktif hari ini (filter dropdown) |
| GET | `/api/jadwal-harian/eligible-users` | User Sales Toko & Trainee |
| GET | `/api/jadwal-harian/kategori` | Opsi shift (S1/S2/S3/S4/S5/TRAINEE) |
| GET | `/api/jadwal-harian/by-date?retail_id=&tanggal=` | Jadwal satu retail satu tanggal |
| GET | `/api/jadwal-harian/employees/:retailId` | Karyawan retail dgn shift jadwal-harian aktif |
| POST | `/api/jadwal-harian/assign` | Upsert bulk (user_ids + retail + absen_masuk_id + absen_keluar_id + tanggal) |
| POST | `/api/jadwal-harian/set-date` | Replace atomik jadwal retail+tanggal |
| POST | `/api/jadwal-harian/delete/:id` | Soft delete |

### Shift Lintas Hari (`is_cross_date`)
> **Flag tipe absen:** Kolom `tipe_absen.is_cross_date` menandai shift yang masuk hari-N & keluar hari-N+1 (mis. SUBUH masuk 23:00 keluar 08:00, SORE 9 JAM masuk 16:00 keluar 01:00). Set via toggle "Absen Lintas Hari" di halaman Kelola Tipe Absen. Backfill awal via `docs/cross-date-flag.sql` / `scripts/migrate-cross-date-flag.js`.

> **Tipe keluar lintas-hari (jadwal-harian):** `getTypeAbsenByJadwal` normalnya cuma tipe jadwal `tanggal=CURDATE()`. Bila user punya sesi cross-date `open` dari shift kemarin (mis. SORE 9 JAM masuk kemarin, keluar 01:00 hari ini) sedang jadwal hari ini shift lain (mis. PAGI), tipe keluar shift kemarin tetap disertakan (`getCrossDateKeluarTypesByJadwal`, via `sesi.jadwal_id`) — agar user bisa absen keluar. Batas: belum lewat deadline keluar (`start_time` keluar +1 hari + grace 3h).

> **Arah absen:** Sesi cross-date `open` (masuk kemarin, belum keluar) → user diarahkan "keluar", bukan masuk baru. Sumber kebenaran = `absensi_sesi.status='open'` + flag `is_cross_date`, bukan tanggal/jam. Berlaku **regular DAN lembur** — masuk lembur cross-date (mis. SUBUH masuk 23:42, `is_lembur=1`) tetap terdeteksi esok hari selama sesi `open` & belum lewat deadline keluar (helper FE `isCrossDateSesiActive`): mode lembur aktif, card status masuk tampil, arah keluar + OC auto-select.

> **Batas 3 jam:** "Wajib keluar" berlaku sampai 3 jam setelah jam keluar terjadwal (`start_time` tipe keluar pasangan + grace 3 jam, konstanta `CROSS_DATE_KELUAR_GRACE_HOURS`). Lewat batas → dianggap lupa keluar: user boleh absen masuk baru.

> **Auto-close sesi basi:** Saat user absen masuk lagi, `markStaleOpenSesiIncomplete` tandai sesi open lampau jadi `incomplete` — same-day (`is_cross_date=0`) tanggal < hari ini, atau cross-date (`is_cross_date=1`) yang sudah lewat batas 3 jam. Cegah blokir + jaga akurasi lembur-guard.

> **Kategori tipe masuk = tipe keluar (WAJIB):** Pairing sesi cross-date match `absensi_sesi.kategori_absen`. `openSesi` ambil kategori dari tipe MASUK. Bila tipe MASUK `kategori_absen` NULL (mis. ter-null saat edit tipe absen di UI Kelola Tipe Absen), controller fallback ke kategori tipe KELUAR pasangan (`getKeluarKategoriByName`, match by `name`) agar masuk & keluar sekategori. **Jaga tipe masuk & keluar 1 shift punya `kategori_absen` SAMA** — beda kategori = sesi pecah (masuk menggantung open + keluar jadi `incomplete` terpisah). Banding kategori (guard tipe keluar FE + BE) **case-insensitive** — beda casing (mis. masuk `'sore'` vs keluar `'Sore'`) tetap dianggap sama agar tipe keluar tampil.

### Scripts Maintenance

Dry-run default; `APPLY=1` untuk commit. **Wajib `npm run backup-db` dulu.** Jalankan dari root BE.

| Script | Fungsi |
|---|---|
| `npm run backup-db` | Dump DB timestamped ke `backups/` (auto native `mysqldump` / `docker exec`) |
| `scripts/fix-cross-date-sesi.js` | Perbaiki sesi cross-date pecah akibat kategori tipe masuk NULL. **STEP 1** restore `tipe_absen.kategori_absen` masuk (NULL → kategori keluar pasangan); **STEP 2** pasangkan ulang sesi keluar-orphan ke absen masuknya. STEP 2 butuh scope `--since=YYYY-MM-DD` atau `--date=YYYY-MM-DD` (tanpa itu dilewati, cegah sentuh orphan historis non-bug). |
| `scripts/backfill-sesi.js` | Backfill `absensi_sesi` dari absensi historis (`APPLY=1`) |
| `scripts/migrate-*.js` | Migrasi schema (idempotent, jalankan sekali) |

Contoh fix cross-date sesi:
```bash
npm run backup-db
node scripts/fix-cross-date-sesi.js --since=2026-07-25            # dry-run preview
APPLY=1 node scripts/fix-cross-date-sesi.js --since=2026-07-25    # eksekusi
```

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
