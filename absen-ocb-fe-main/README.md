# OCB Absensi — Dashboard Admin

Dashboard web admin sistem absensi OCB. Kelola karyawan, shift, jadwal harian, tipe absen, validasi & koreksi absensi, sesi masuk↔keluar, laporan, dan penggajian/KPI.

Stack: React 18 + Vite, React Router, react-data-table-component, react-select, react-bootstrap + Bootstrap, SweetAlert2, date-fns, axios, chart.js, xlsx/exceljs.

## Menjalankan lokal

```bash
npm install
npm run dev        # http://localhost:5173
```

Butuh backend (`absen-ocb-be-main`) berjalan + database MySQL terisi. Lihat README backend.

Script lain:

```bash
npm run build      # build produksi ke dist/
npm run preview    # preview hasil build
npm run lint       # eslint
```

## Konfigurasi environment

Buat `.env` di root FE:

```
VITE_API_URL=http://localhost:4000/api      # base URL API backend
VITE_API_IMAGE=http://localhost:4000        # base URL file gambar/video (foto absen, profil)
```

## Halaman utama

- **Absensi** (`/absensi`) — riwayat absen, validasi/ignore/koreksi/hapus, export Excel. Toggle UI Lama/Baru.
- **Kelola Sesi Absensi** (`/sesi-absensi`) — pairing sesi masuk↔keluar, match/unmatch, buat/tambah absen manual (termasuk sesi lembur via toggle).
- **Shifting** (`/shifting`) — assign shift ke karyawan per retail. Toggle UI Lama/Baru.
- **Jadwal Harian** (`/jadwal-harian`) — matrix jadwal Sales Toko/Trainee (desktop) / list per-hari (mobile), import Excel.
- **Tipe Absen** (`/typeabsen`) — kelola tipe absen; pasangan masuk+keluar tampil 1 baris. Toggle UI Lama/Baru.
- **Retail** (`/retails`) — kelola OC/Store: nama, koordinat, radius, status. Tombol buka lokasi di Google Maps. Toggle UI Lama/Baru.
- Users, Off Day, Potongan, Bonus, Laporan, Salary/KPI, Dashboard.

## Halaman karyawan (self-service, login sendiri)

Route publik tanpa sidebar admin — dibuka karyawan dari HP, pakai sesi login sendiri (`localStorage` `token`+`userId`).

- **Absen** (`/absen`) — absen masuk/keluar (foto selfie + GPS radius OC), riwayat, lembur. Card profil tampilkan Nama, Username, Retail Shift, **Atasan**.
- **Jadwal Saya** (`/absen/jadwal`) — jadwal bulanan (kalender) untuk karyawan berjadwal-harian.
- **Approval** (`/absen/approval`) — khusus atasan/SPV: setujui/tolak absen bawahan yang butuh approval (telat/lembur). Tab Pending + Riwayat, hanya absen hari ini + kemarin (H-1). Tombol muncul di `/absen` hanya bila punya bawahan.

## Catatan UI

Beberapa halaman (Absensi, Users, Shifting, Tipe Absen, Retail) punya toggle **UI Lama / UI Baru** di header. Pilihan tersimpan di `localStorage` (`*_ui_mode`), default **Baru**. UI Lama tetap tersedia sebagai fallback.
