# Plan: Flag `is_cross_date` + Auto-Close Sesi Basi

Dokumen desain. Status: **implemented.**

## Context

Sistem sesi (`absensi_sesi`) memasangkan masuk↔keluar. Sesi masuk yang belum keluar berstatus `status='open'`. Ada **dua kasus berbeda** yang menghasilkan sesi open, tapi butuh perlakuan berlawanan:

| Kasus | Contoh | Sesi | Perlakuan benar |
|---|---|---|---|
| **Cross-date sah** | SUBUH masuk 23:00, keluar 08:00 besok. SORE 9 JAM masuk 16:00, keluar 01:00 besok | open | Besok arahkan user ke **keluar** (shift belum selesai) |
| **Lupa keluar (basi)** | PAGI masuk 08:00, lupa keluar | open | Besok **jangan blokir** — izinkan masuk baru; sesi lama tandai `incomplete` |

**Masalah**: `status='open'` saja tidak bisa membedakan keduanya. Fix FE cross-midnight sebelumnya (`AbsenKaryawan.jsx` `findOpenRegularMasuk`) memaksa arah "keluar" untuk **semua** sesi open regular — akibatnya user yang lupa keluar PAGI kemarin **terblokir absen masuk** keesokan hari. Bug.

**Kenapa kategori/inferensi jam tak cukup**:
- `Malam` → selalu cross-date; `Pagi` → selalu same-day; tapi **`Sore` AMBIGU**: SORE 8 JAM keluar 23:00 (same-day) vs SORE 9 JAM keluar 01:00 (cross-date) — dua-duanya `kategori='Sore'`.
- Inferensi "jam keluar < jam masuk" rapuh: butuh window tipe keluar pasangannya, tak selalu tersedia di jalur non-jadwal.
- Pembeda sejati = **sifat intrinsik tipe absen**: "shift ini keluarnya lewat tengah malam?". Itu data yang harus disimpan eksplisit → **flag**.

**Outcome**:
1. Flag `is_cross_date` di `tipe_absen`, di-set admin untuk tipe SUBUH & SORE 9 JAM (dan tipe cross-date lain).
2. FE: sesi open + tipe cross-date → arahkan keluar (perilaku SITI benar). Sesi open + tipe same-day + hari sudah lewat → sesi basi, jangan blokir masuk baru.
3. Auto-close: saat user absen masuk di hari berbeda dan ada sesi open basi (non-cross-date, tanggal lampau) → tandai `incomplete` supaya data bersih + lembur-guard akurat.

---

## Perubahan

### 1. Migrasi DB — `docs/cross-date-flag.sql` (baru)

```sql
ALTER TABLE tipe_absen
  ADD COLUMN is_cross_date TINYINT(1) NOT NULL DEFAULT 0 AFTER kategori_absen;
```

- Idempotent apply via script node one-shot (cek `information_schema.columns` dulu, pola migrasi sebelumnya).
- Backfill data existing: set `is_cross_date=1` untuk tipe yang jelas cross-date (SUBUH 9 JAM: id 8,53,54,55,56; SORE 9 JAM: id 7,49,50,51,52). Berdasarkan probe: tipe dengan window keluar dini hari (start_time keluar 01:00/08:00). Backfill lewat UPDATE eksplisit per-id atau heuristik `end_time < start_time` untuk tipe "durasi" (Kebersihan/Parkir/Display yang span penuh shift). **Verifikasi manual sebelum commit** — jangan andalkan heuristik buta.

### 2. Backend model — `src/models/absenManagement.model.js`

- `createNewAbsenType` (`:22`): tambah kolom `is_cross_date` ke INSERT + values (`body.is_cross_date || 0`).
- `updateAbsenType` (`:317`): tambah `is_cross_date = ?` ke UPDATE + values.
- Query yang dipakai gating/history: pastikan `is_cross_date` ikut di SELECT bila FE butuh (lihat poin 4).

### 3. Backend model — `src/models/absensi.model.js` (history)

Tambah `ta.is_cross_date` ke SELECT `historyAbsensiPerUser` (`:100`) supaya FE bisa bedakan sesi open cross-date vs basi tanpa query tambahan.

### 4. Backend — auto-close sesi basi

Lokasi: `absensi.controller.js` blok absen **masuk** (`else` cabang `:302`), sebelum/sesudah `openSesi`, dalam transaksi.

Logika:
- Sebelum buka sesi baru, cari sesi open milik user yang **basi**: `status='open'` AND `tanggal < CURDATE()` AND tipe masuknya `is_cross_date=0`.
  - (Cross-date yang sah TIDAK ditutup — mis. SUBUH masuk kemarin, user memang belum keluar sampai pagi ini.)
- Untuk tiap sesi basi → `UPDATE absensi_sesi SET status='incomplete', updated_at=? WHERE sesi_id=?`.
- Helper baru di `absensiSesi.model.js`: `markStaleOpenSesiIncomplete(conn, userId, isLembur)` — query + update transaksional.

**Catatan**: hanya jalan saat user absen masuk lagi (event-driven), bukan cron. Cukup untuk mencegah blokir + jaga lembur-guard. Cron cleanup global = opsi masa depan bila perlu.

### 5. Frontend — `src/Pages/AbsenKaryawan.jsx`

Perbaiki `findOpenRegularMasuk` (yang sekarang buggy) agar hanya menganggap sesi open **cross-date** sebagai "wajib keluar":
- Filter tambahan: baris masuk sesi open harus `is_cross_date == 1`.
- Sesi open dengan tipe `is_cross_date=0` (lupa keluar) → **diabaikan** untuk penentuan arah → user boleh absen masuk baru (perilaku normal `nextRegularDirection`).
- Lock kategori keluar tetap pakai kategori sesi cross-date bila ada.

Efek:
- SITI (SUBUH, cross-date=1) → besok pagi diarahkan keluar. ✓
- User lupa keluar PAGI (cross-date=0) → besok boleh masuk baru, sesi lama auto-close jadi incomplete di BE. ✓

### 6. Frontend — `src/Pages/CatAbsen.jsx`

Form kelola tipe absen: tambah toggle **"Absen Lintas Hari (keluar besok)?"** Ya/Tidak.
- State `newCatabsen.is_cross_date` + `selectedCatabsen.is_cross_date`.
- Kirim di payload create (`:211` area) + update (`:340` area).
- Prefill dari row saat edit. Kolom badge opsional di tabel.

### 7. Dokumentasi

- `CHANGELOG.md` — entry "Added: flag is_cross_date tipe absen + auto-close sesi basi".

---

## File yang disentuh

| File | Aksi |
|---|---|
| `docs/cross-date-flag.sql` | baru — ALTER +is_cross_date + backfill |
| `src/models/absenManagement.model.js` | create/update tipe absen +flag |
| `src/models/absensi.model.js` | history SELECT +`ta.is_cross_date` |
| `src/models/absensiSesi.model.js` | +`markStaleOpenSesiIncomplete` |
| `src/controller/absensi.controller.js` | auto-close sesi basi saat masuk (transaksi) |
| `src/Pages/AbsenKaryawan.jsx` | `findOpenRegularMasuk` hanya trigger utk is_cross_date=1 |
| `src/Pages/CatAbsen.jsx` | toggle is_cross_date di form tipe absen |
| `CHANGELOG.md` | dokumentasi |

## Verifikasi (end-to-end)

1. Apply migrasi; cek `tipe_absen.is_cross_date` ada; backfill benar (SUBUH/SORE-9 = 1, sisanya 0). Verifikasi manual daftar tipe.
2. **SITI (cross-date)**: user 375, sesi SUBUH open tanggal-24. Login jam 08:00-08:30 → FE tampilkan **keluar SUBUH** (id=53), kategori Malam terkunci. Absen keluar → sesi closed.
3. **Lupa keluar PAGI**: seed user dengan sesi PAGI open tanggal-24 (is_cross_date=0). Hari-25 login → FE arahkan **masuk** (bukan keluar), user bisa absen masuk baru. Cek sesi PAGI lama jadi `incomplete` setelah masuk baru.
4. **SORE-8 vs SORE-9** (uji ambiguitas): sesi SORE-8 open (cross-date=0, keluar 23:00 kemarin, lupa) → besok boleh masuk baru. Sesi SORE-9 open (cross-date=1) → besok diarahkan keluar. Dua-duanya kategori Sore, dibedakan flag.
5. **Lembur-guard**: setelah sesi basi jadi incomplete, `getTodaySesiSummary` regular tidak salah hitung "hasClosed".
6. Regresi guard pairing (dokumen `sesi-pairing-guard-plan.md`): tipe keluar salah kategori tetap ditolak 400.
