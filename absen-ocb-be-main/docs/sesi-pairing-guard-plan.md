# Plan: Guard Pairing Sesi — Tipe Keluar Harus Cocok dengan Masuk

Dokumen desain. Status: **plan, belum diimplementasi.**

## Context

Sistem sesi (`absensi_sesi`) memasangkan absen **masuk ↔ keluar** jadi satu kesatuan. Pairing saat keluar dilakukan `findOpenSesi` yang match berdasarkan **`kategori_absen`** + `is_lembur` (`src/models/absensiSesi.model.js:79-83`, controller `src/controller/absensi.controller.js:280-286`).

**Masalah**: user bisa memilih tipe absen keluar yang **kategorinya beda** dengan tipe masuknya. Saat itu terjadi:
- `findOpenSesi` tidak menemukan sesi open yang cocok kategorinya → jatuh ke `createIncompleteSesi` (`controller:291`).
- Akibat: sesi masuk menggantung `status='open'` selamanya + muncul sesi `incomplete` terpisah untuk keluar. Data pecah.
- Lembur-guard yang butuh "ada sesi regular closed" (`controller:104-131`) jadi salah baca → blokir/izin lembur keliru.
- Rekap & pairing masuk↔keluar rusak (masalah yang justru mau dihindari sistem sesi).

## Kondisi sekarang per jalur

| Jalur | FE cegah? | BE cegah? | Cara pairing keluar |
|---|---|---|---|
| **Non-jadwal** (`getTypeAbsenByCategory`) | ✗ Tidak — FE tampilkan semua tipe dalam shift window, filter hanya by arah (`AbsenKaryawan.jsx:710-723`) | ✗ Tidak | `kategori_absen` |
| **Lembur** | ✓ FE lock: keluar match `category_absen` masuk (`AbsenKaryawan.jsx:402-405`) | ✗ **Tidak** — bisa bypass via API mentah | `kategori_absen` + `is_lembur` |
| **Jadwal harian** (`getTypeAbsenByJadwal`) | ✓ FE cuma dapat 2 tipe: `absen_masuk_id` + `absen_keluar_id` dari jadwal (`absenManagement.model.js:151`) | ✗ Tidak (tapi ruang tipe sudah sempit) | `kategori_absen` — **`jadwal_id` TIDAK dipakai** saat pairing keluar (`controller:284` kirim `jadwal_id: null`) |

**Kesimpulan**: FE melindungi lembur & jadwal-harian, tapi **non-jadwal bocor total** dan **semua jalur bisa di-bypass via API** karena tak ada guard server. Sistem butuh guard di BE (sumber kebenaran) + kunci di FE (UX).

## Pendekatan: A + C (defense in depth)

- **A (BE strict block)**: server tolak keluar yang tak cocok dengan sesi open. Tak bisa di-bypass.
- **C (FE lock)**: dropdown keluar dikunci ke kategori sesi masuk yang open. User tak lihat opsi salah.

Berlaku untuk **ketiga jalur** (non-jadwal, lembur, jadwal harian).

---

## Perubahan

### 1. Backend model — `src/models/absensiSesi.model.js`

Tambah `findAnyOpenSesi(conn, params)` — ambil sesi open aktif user **tanpa filter kategori**, untuk tahu kategori/jadwal yang sedang berjalan:

```
SELECT s.sesi_id, s.tanggal, s.kategori_absen, s.jadwal_id, s.is_lembur
FROM absensi_sesi s
WHERE s.user_id = ?
  AND s.status = 'open'
  AND s.is_lembur = ?
  AND (tanggal = CURDATE() OR (includeYesterday AND tanggal >= CURDATE()-1))
ORDER BY s.created_at DESC, s.sesi_id DESC
LIMIT 1
```

Beda dengan `findOpenSesi`: TIDAK filter `kategori_absen`/`jadwal_id` — dipakai untuk **validasi** (apa kategori sesi yang harus dicocokkan), bukan untuk pairing.

### 2. Backend controller — `src/controller/absensi.controller.js`

Di blok `isKeluar`, **sebelum** insert absensi (sisip dekat guard existing `:169`), tambah validasi cocok-tipe:

1. `openSesi = findAnyOpenSesi(conn, { user_id, is_lembur: body.is_lembur, includeYesterday: isEarlyMorningKeluar })`.
2. Bila `openSesi` ada:
   - **Jalur jadwal harian**: bila `openSesi.jadwal_id != null` → tipe keluar yang dipilih (`body.absen_type_id`) harus == `jadwal_harian.absen_keluar_id` untuk `jadwal_id` itu. Query cek; bila tak cocok → tolak.
   - **Jalur non-jadwal / lembur**: `kategoriAbsen` (dari `getTimeDB.kategori_absen`, `controller:253`) harus == `openSesi.kategori_absen`. Bila beda → tolak.
   - Tolak: `400 { message: "Tipe absen keluar tidak cocok dengan absen masuk Anda (shift <kategori>). Pilih tipe keluar yang sesuai." }` + `removeUploadedImage(file.filename)` (pola guard existing `:176-183`).
3. Bila `openSesi` tidak ada → biarkan lolos ke logika existing (`findOpenSesi` → `createIncompleteSesi`); ini kasus keluar-tanpa-masuk yang memang sudah ditangani jadi incomplete.

**Catatan transaksi**: validasi ini pakai koneksi `conn` yang sama bila diletakkan di dalam blok transaksi, atau `dbpool` bila sebelum `beginTransaction`. Karena guard existing (`:169-205`) berjalan sebelum `getConnection` (`:255`), letakkan validasi di situ pakai `dbpool` untuk `findAnyOpenSesi` (baca-saja, aman non-transaksional).

### 3. Frontend — `src/Pages/AbsenKaryawan.jsx`

Kunci dropdown tipe keluar ke kategori sesi masuk yang sedang open (regular). Pola sudah ada untuk lembur (`:402-405`):

- **Regular non-jadwal & jadwal harian**: saat menyusun `filteredTypes` (`:710-723`), bila arah = `keluar` DAN ada sesi/absen masuk hari ini yang belum keluar → filter tipe keluar agar `kategori_absen` == kategori masuk tsb. Sumber kategori masuk: baris history masuk hari ini (pola `todayLemburSesi.masukRow` `:403`, tapi untuk regular). Gunakan data sesi (`sesi_status`/`kategori_absen`) yang sudah dibaca FE bila tersedia; fallback ke history masuk.
- **Jadwal harian**: ruang tipe sudah cuma 2 (masuk+keluar sejadwal), jadi lock ini otomatis terpenuhi — cukup pastikan tak ada regresi.
- Auto-select tipe pertama hasil filter (pola `:745`).

### 4. Dokumentasi

- `CHANGELOG.md` — entry "Fixed/Changed: guard tipe keluar harus cocok kategori masuk (semua jalur)".

---

## Lembur — apakah terhandle?

**Ya, masuk scope.** Guard A pakai `is_lembur: body.is_lembur` saat `findAnyOpenSesi`, jadi validasi berjalan di ruang lembur terpisah dari regular:
- Lembur keluar → cari sesi **lembur** open → cocokkan kategori.
- FE sudah lock lembur (`:402-405`); guard BE menutup celah bypass API.
- Hard-guard lembur existing (`:104-158`: regular harus komplit, lembur-masuk harus ada sebelum lembur-keluar) **tidak diubah** — guard cocok-tipe ini pelengkap, bukan pengganti.

## Jadwal harian (bila diaktifkan) — apakah terhandle?

**Ya, masuk scope.** Poin penting: saat ini pairing keluar **abaikan `jadwal_id`** (`controller:284` kirim `jadwal_id: null`), match cuma via `kategori_absen`. Untuk jalur jadwal harian, guard A menambah cek eksplisit `body.absen_type_id == jadwal.absen_keluar_id`, sehingga:
- User berjadwal tak bisa keluar pakai tipe di luar `absen_keluar_id` jadwalnya.
- Konsisten dengan gating `uses_jadwal_harian` (shifting flag) yang sudah ada — user yang masuk jalur jadwal harian ditentukan `userUsesJadwalHarian` (`absenManagement.model.js`).

**Opsional (perbaikan pairing, di luar guard)**: pertimbangkan pairing keluar pakai `jadwal_id` (bukan cuma kategori) agar sesi jadwal-harian ter-link tepat ke jadwalnya. Ini memperkuat data tapi menyentuh `findOpenSesi` — bisa jadi fase terpisah bila tak mau memperluas scope.

---

## File yang disentuh

| File | Aksi |
|---|---|
| `src/models/absensiSesi.model.js` | +`findAnyOpenSesi` |
| `src/controller/absensi.controller.js` | +validasi cocok-tipe di blok `isKeluar` (3 jalur) |
| `src/Pages/AbsenKaryawan.jsx` | lock dropdown tipe keluar ke kategori masuk (regular) |
| `CHANGELOG.md` | dokumentasi |

## Verifikasi (end-to-end)

1. **Non-jadwal, tipe salah (BE)**: user non-jadwal absen masuk kategori Pagi → coba keluar kategori Sore via API → cek `400`, sesi masuk tetap `open`, tak ada `incomplete` baru.
2. **Non-jadwal, tipe benar**: masuk Pagi → keluar Pagi → sesi `closed`. Normal.
3. **FE lock**: setelah masuk, dropdown keluar hanya tampilkan tipe kategori yang sama.
4. **Lembur bypass**: lembur masuk kategori X → API keluar lembur kategori Y → `400`. FE tetap lock (regresi check).
5. **Jadwal harian**: user berjadwal masuk → API keluar dengan `absen_type_id` ≠ `absen_keluar_id` jadwal → `400`. Keluar dengan tipe benar → sesi `closed`.
6. **Cross-midnight**: masuk hari-24 (Sore/Subuh), keluar dini hari-25 kategori sama → guard pakai `includeYesterday` → lolos, sesi hari-24 `closed`. (Regresi check case cross-midnight yang sudah jalan.)
7. **Keluar tanpa masuk**: tak ada sesi open → lolos guard → `createIncompleteSesi` (perilaku existing tak berubah).
