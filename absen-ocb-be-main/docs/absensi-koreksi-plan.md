# Plan: Koreksi Absen (Attendance Correction)

Dokumen desain fitur koreksi absen. Status: **plan, belum diimplementasi.**

## Context

Admin butuh mengoreksi baris `absensi` yang datanya salah — **jam absen salah**, **status ontime/telat salah**, atau **catatan perlu dibetulkan**. Saat ini tidak ada jalur edit: satu-satunya operasi UPDATE pada tabel `absensi` hanya membalik status approval (`approveAbsen`/`rejectAbsen`/`validasiAbsen` di `src/models/absensi.model.js:68-85`) — tidak ada yang bisa mengubah `absen_time`, `status_absen`, `reason`, atau `potongan`.

Masalah turunan:
- Tabel `absensi` **tidak punya audit** (`updated_by`/`updated_at`) — tidak bisa ditelusuri siapa mengoreksi apa.
- Baris `absensi` bisa jadi anggota `absensi_sesi` (via `masuk_absensi_id`/`keluar_absensi_id`, lihat `docs/absensi-sesi.sql`). Koreksi jam masuk yang menggeser tanggal bisa membuat `sesi.tanggal` tidak sinkron.

**Outcome**: admin bisa membuka modal "Koreksi" di halaman Absensi, mengubah jam/status/catatan satu baris, sistem menghitung ulang `status_absen` + `potongan` telat, mencatat audit ke `log_activity`, dan menyinkronkan `absensi_sesi` bila baris itu bagian sesi — semua dalam satu transaksi.

## Keputusan desain

1. **Scope field**: `absen_time`, `status_absen` (ontime/telat), `reason`. `potongan` **dihitung ulang** dari waktu baru — tidak diinput manual. Tipe absen & retail **tidak** diubah (di luar scope).
2. **Audit**: ALTER `absensi` +`updated_by` +`updated_at`; tiap koreksi di-log ke `log_activity` (old→new).
3. **Sesi sync**: bila baris punya sesi, update sesi terkait dalam transaksi yang sama.

---

## Perubahan

### 1. Migrasi DB — `docs/absensi-koreksi.sql` (baru)

```sql
ALTER TABLE absensi
  ADD COLUMN updated_by INT NULL DEFAULT NULL AFTER approved_at,
  ADD COLUMN updated_at DATETIME NULL DEFAULT NULL AFTER updated_by;
```

- Idempotent apply lewat script node one-shot (cek `information_schema.columns` dulu, pola sama migrasi shifting-jadwal-flag).
- `updated_by` = user_id admin yang mengoreksi; `updated_at` = timestamp Asia/Makassar.
- Tidak perlu kolom `corrected` terpisah — `updated_at IS NOT NULL` sudah menandai baris pernah dikoreksi.

### 2. Backend model — `src/models/absensi.model.js`

Tambah `koreksiAbsen(conn, absenId, fields)` **transaksional** (terima `conn`, pola sama `createAbsensi` yang sudah pakai `conn = dbpool`):

```
UPDATE absensi
SET absen_time = ?, status_absen = ?, potongan = ?, reason = ?, updated_by = ?, updated_at = ?
WHERE absensi_id = ?
```
- Parameterized (konsisten dengan `approveAbsen`).
- `getAbsensiById(absenId)` — SELECT * WHERE absensi_id, untuk ambil nilai LAMA (audit + cek sesi) sebelum update.
- `logKoreksi(conn, absenId, oldRow, newRow, adminId)` — INSERT ke `log_activity(table_name='absensi', action='UPDATE', dataquery, user_id=adminId)`; `dataquery` berisi ringkasan `old→new` (pola escape sama `createAbsensi` di `absensi.model.js:32-44`).

### 3. Backend model — `src/models/absensiSesi.model.js`

Tambah 2 helper (terima `conn`, pola sama fungsi existing):
- `findSesiByAbsensiId(conn, absenId)` — `SELECT * FROM absensi_sesi WHERE masuk_absensi_id = ? OR keluar_absensi_id = ? LIMIT 1`.
- `updateSesiTanggal(conn, sesiId, tanggal, updatedAt)` — update `tanggal` + `updated_at` bila jam masuk dikoreksi lintas-tanggal. (Hanya baris `masuk_absensi_id` yang meng-anchor `sesi.tanggal`; koreksi keluar tidak menggeser tanggal.)

### 4. Backend controller — `src/controller/absensi.controller.js`

Tambah `koreksiAbsen(req, res)`:
1. `absenId` dari `req.params`; `adminId = req.user.id` (JWT payload `{id, name}`, lihat `user.controller.js:159`); `{ absen_time, status_absen, reason }` dari `req.body`.
2. Ambil baris lama via `getAbsensiById`. 404 kalau tidak ada.
3. **Recompute** `status_absen` + `potongan`:
   - Ambil `tipe_absen` (start/end time) via `getTimeDB(old.absen_type_id)` + potongan value via `getPotonganLate(1)` (pola `absensi.controller.js:60-67,207-233`).
   - Bila admin kirim `status_absen` eksplisit → pakai itu; kalau tidak → derive dari `absen_time` baru vs `end_time` (>= end → telat=2).
   - `potongan`: kalau status telat DAN diff dari `end_time` > 15 menit → `potonganLate`; else 0 (reuse logika `:226-233`).
   - Timezone Asia/Makassar via `moment.tz`.
4. Buka transaksi (`dbpool.getConnection` + `beginTransaction`, pola `:255-258`):
   - `koreksiAbsen(conn, ...)` + `logKoreksi(conn, ...)`.
   - `findSesiByAbsensiId(conn, absenId)`; bila ada & baris = `masuk_absensi_id` & tanggal(absen_time baru) ≠ `sesi.tanggal` → `updateSesiTanggal`.
   - `commit`; `rollback` on error.
5. Response JSON pola existing (`status/status_code/data`).

### 5. Route — `src/routes/absensi.js`

```js
router.post('/koreksi/:absenId', authenticateToken, absensiController.koreksiAbsen);
```
Pola sama `/approve-absensi/:absenId`. **Catatan**: tidak ada role middleware di app ini (`authMiddleware.js` hanya cek token) — koreksi terlindung token saja, sama seperti approve/reject yang sudah ada. Batasi admin = peningkatan terpisah.

### 6. Frontend — `src/Pages/Absensi.jsx`

Ikut pola edit-modal Retail/Shift (`Retail.jsx:82-155,333-457`):
- State: `selectedKoreksi` (`{}`), `koreksiModalVisible` (false).
- Row action baru **"Koreksi"** (button di kolom aksi, samping Ignore/Validasi).
- `handleKoreksi(row)` → set `selectedKoreksi = row`, buka modal.
- Modal `react-bootstrap`:
  - **Waktu Absen** — `<input type="datetime-local">` bind `selectedKoreksi.absen_time`.
  - **Status** — `<select>` Ontime(1)/Telat(2), prefill dari `status_absen`.
  - **Catatan** — `<textarea>` bind `reason`.
- `handleSaveKoreksi()`:
  - token dari `localStorage`, `adminId` dari `sessionStorage.getItem("userData")` → `userData?.id` (pola Retail; `userData` sudah di-set di Login).
  - `POST ${VITE_API_URL}/absensi/koreksi/${selectedKoreksi.absensi_id}` body `{ absen_time, status_absen, reason }`.
  - Sukses → `Swal.fire`, optimistic update `setAbsensies` via `.map()`, tutup modal.
- Pastikan SELECT history di `absensi.model.js` expose `a.status_absen` mentah (saat ini JOIN `absen_status` tapi kolom mentah belum di SELECT list) untuk prefill.

### 7. Dokumentasi

- `CHANGELOG.md` — entry "Added: Koreksi Absen".
- `README.md` — tabel Absensi tambah row `POST /api/absensi/koreksi/:absenId`.

---

## File yang disentuh

| File | Aksi |
|---|---|
| `docs/absensi-koreksi.sql` | baru — ALTER +updated_by +updated_at |
| `src/models/absensi.model.js` | +`koreksiAbsen`, +`getAbsensiById`, +`logKoreksi` |
| `src/models/absensiSesi.model.js` | +`findSesiByAbsensiId`, +`updateSesiTanggal` |
| `src/controller/absensi.controller.js` | +`koreksiAbsen` handler, export |
| `src/routes/absensi.js` | +route `/koreksi/:absenId` |
| `src/Pages/Absensi.jsx` | +row action, +modal, +handler |
| `CHANGELOG.md`, `README.md` | dokumentasi |

## Verifikasi (end-to-end)

1. Apply migrasi; cek `absensi` punya `updated_by`,`updated_at` (query `information_schema`).
2. BE lokal `npm start` (port 4000), FE `npm run dev` (5173). Re-login (populate `userData`).
3. Halaman Absensi → pilih baris telat → **Koreksi** → geser jam ke sebelum `end_time` → simpan. Cek response 200; baris update; DB: `status_absen=1`, `potongan=0`, `updated_by`/`updated_at` terisi.
4. Koreksi baris ontime → geser jam ke lewat `end_time` +>15mnt → cek `status_absen=2`, `potongan=potonganLate`.
5. Koreksi baris yang punya sesi (`absensi_sesi.masuk_absensi_id`) dengan jam lintas tengah malam → cek `sesi.tanggal` ikut update.
6. Cek `log_activity` ada row `action='UPDATE', table_name='absensi', user_id=<adminId>` dengan old→new.
7. Edge: `absensi_id` tidak ada → 404; body kosong → 400.
