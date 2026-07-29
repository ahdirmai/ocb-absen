# Changelog

## [Unreleased]

### Changed
- **Luar radius = blok submit di FE absen karyawan** (`AbsenKaryawan.jsx`) — sebelumnya FE tetap izinkan submit di luar radius (kirim `is_approval=1`, teks "absen akan menunggu approval atasan"), padahal BE sudah menolaknya. Sekarang selaras BE: guard di `handleSubmit` (Swal error + return, cegah upload foto sia-sia), tombol Absen disabled saat `outsideRadius` (`canSubmit` +`!outsideRadius`), teks status lokasi & pesan bawah tombol jadi "tidak bisa absen, mendekatlah ke lokasi". Jalur `is_approval`/reason luar-radius dibuang (dead) — `is_approval` kini hanya dari lembur. BE tetap sumber kebenaran (`checkAbsensi`, berlaku juga Android).
- **Luar radius OC = tolak submit absen** (`validasiAbsensi.js`, `UpdateApp.jsx`) — sebelumnya absen di luar radius `retail_id` yang dipilih tetap lolos bila dekat OC lain (`findNearbyRetail`), dengan `is_approval=1` (menunggu approval atasan). Sekarang **langsung ditolak HTTP 400** — tak ada fallback OC terdekat, tak ada jalur approval-luar-radius. Berlaku semua absen (masuk/keluar, regular/lembur). Rasional: untuk lembur `retail_id` sudah OC tempat lembur (karyawan pilih sendiri di app), jadi radius dicek terhadap OC itu; absen harus benar di lokasi OC. `findNearbyRetail` dibuang (unused). GPS mati/invalid tetap 400. Retail tanpa data lat/long/radius (blank) tetap dilewati tanpa cek. Note radius di `/update` disesuaikan. Enforcement BE.

### Fixed
- **Tipe lembur kosong untuk jadwal-harian saat tipe masuk ber-kategori NULL** (`absenManagement.model.js` `getLemburTypes`) — kasus Shinta Nur Anisy (user 511, Sales Toko): regular PAGI komplit tapi tak ada tipe lembur muncul. Query ambil `assignedKategori` dari `tipe_absen.kategori_absen` tipe MASUK jadwal, tapi banyak tipe masuk ber-kategori NULL (mis. "S2-PAGI 9 JAM" masuk kategori NULL, keluar 'Pagi') → `assignedKategori` NULL → jalur `if (!assignedKategori) return [openLemburKeluar]` dianggap "belum di-assign" → komplemen tak terdefinisi → 0 tipe lembur baru. Sistemik: 11 tipe masuk ber-kategori NULL. Fix: `COALESCE` `assignedKategori` ke kategori tipe KELUAR pasangan (match by `name`) bila masuk NULL. Hasil user 511: `assignedKategori`='Pagi' → komplemen Sore+Subuh → 5 tipe lembur.
- **Absen keluar lembur subuh (cross-date) salah ditolak** (`absensi.controller.js`, `absensi.model.js`) — guard lembur-keluar cek masuk lembur `today-only` (`getTodaySesiSummary`/`getTodayDirectionSummaryByLembur` filter `tanggal=CURDATE()`), padahal lembur subuh cross-midnight masuk-nya tercatat kemarin malam. Akibat: user sudah absen masuk lembur tapi absen keluar ditolak `"Tidak bisa absen keluar lembur sebelum absen masuk lembur."`. Fix: pindahkan `isEarlyMorningKeluar` ke atas (sebelum blok guard) + teruskan sebagai `includeYesterday` ke kedua cek — selaras dengan pairing sesi `findOpenSesi` yang sudah cross-date aware. `getTodayDirectionSummaryByLembur` +param `includeYesterday` (dateFilter `>= CURDATE()-1 DAY`). Guard tetap ketat untuk keluar siang (today-only), longgar ke kemarin hanya saat keluar < 12:00.

### Added
- **Tambah banyak menu sekaligus (multi-select) di Config Menu User** (`menu.model.js`, `menu.controller.js`, `menu.js`, `MenuCategory.jsx`) — sebelumnya modal Tambah = 1 kategori + 1 menu, assign banyak menu berarti buka modal berulang. Sekarang menu jadi **multi-select** (`isMulti`, `closeMenuOnSelect=false`) → submit sekali. Endpoint baru `POST /api/menu/add-config-bulk` (`createMenuConfigBulk`): batch INSERT multi-row, **lewati menu yang sudah ter-assign** ke kategori itu (guard duplikat server-side, cek `navigation_access` `is_deleted=0`). FE juga sembunyikan menu yang sudah ada dari opsi (`addMenuOptions`), counter "N dipilih", tombol "Tambah N Menu", refetch setelah simpan. Endpoint lama `/add-config` (single) tetap ada. Buang `handleAddMenuCategory` single di FE (dead).
- **UI/UX baru halaman Config Menu User (toggle Lama/Baru)** (`MenuCategory.jsx`) — pola sama Absensi (persist `localStorage` key `menucategory_ui_mode`, default Baru; UI lama utuh). Stat cards (Total Config/Kategori User/Menu Unik), search global lintas kolom. **UI Baru = kartu grup per kategori** (bukan tabel flat) — sebelumnya 1 baris per menu bikin kategori dengan banyak menu berulang (mis. Owner/HRD 18 baris). Sekarang 1 kartu = 1 kategori user, menu jadi chip di dalamnya (parent ditandai ikon sub-arrow, tombol × hapus per-chip pakai `handleDelete` existing), tombol "+ Menu" di header kartu buka modal Tambah dengan kategori sudah terisi. Grid responsif (auto-fill min 320px). Modal Tambah & Edit didesain ulang (`menuPosition: fixed` cegah dropdown kepotong). Buang 2 `console.log` di render + dead state `search`. FE only, API tak disentuh.
- **Panduan per platform di halaman `/update`** (`UpdateApp.jsx`) — blok "Pilih sesuai jenis HP": Android pasang aplikasi (langkah pemasangan existing), **iPhone/iOS absen lewat web** (link ke route `/absen`, tanpa install). Header "Baca dulu" ditandai (Android) + catatan pengguna iPhone lewati pemasangan.
- **UI/UX baru halaman Retail (toggle Lama/Baru)** (`Retail.jsx`) — pola sama Absensi (persist `localStorage` key `retail_ui_mode`, default Baru; UI lama utuh). Stat cards (Total/Aktif/Non Aktif/**Tanpa Lokasi**), search global, quick-filter chip (Aktif/Non Aktif/Tanpa Lokasi), kolom modern (ikon toko, koordinat atau "belum diset", radius, badge status, aksi ikon + tombol buka Google Maps). Modal Tambah & Edit didesain ulang (grid lat/long, radius+status berdampingan, link cek titik di Google Maps saat koordinat terisi, card ringkasan di Edit). Buang `console.log` di `handleUpdate`. FE only, API tak disentuh.
- **Detail lokasi absen di halaman Absensi** (`Absensi.jsx`, `absensi.model.js`) — tombol **Detail** per baris (UI Baru ikon peta di kolom Aksi, UI Lama kolom Detail) buka modal berisi: info absen (karyawan/retail/code/deskripsi/waktu/catatan), **jarak** lokasi absen ke lokasi OC (Haversine, badge hijau bila dalam radius / merah bila luar + radius OC), koordinat absen & OC, tombol buka Google Maps (lokasi absen) + rute ke OC. Query `historyAbsensiAllUser` +`a.latitude`, `a.longitude`, `r.latitude AS retail_latitude`, `r.longitude AS retail_longitude`, `r.radius AS retail_radius`. FE hitung jarak client-side; tak ada endpoint baru.
- **Note lokasi OC untuk lembur di halaman `/update`** (`UpdateApp.jsx`) — langkah absen masuk & keluar lembur ditambah penegasan: wajib di dalam radius OC yang dipilih; di luar radius OC tersebut ditolak, sama seperti absen biasa.
- **Note batas waktu absen keluar di halaman `/update`** (`UpdateApp.jsx`) — poin baru di section Cara Absen (ikon `mdi-clock-alert-outline`). Dokumentasikan aturan yang sudah berlaku di kode (bukan fitur baru): shift biasa (`is_cross_date=0`) keluar paling lambat hari sama dengan masuk (sebelum tengah malam, `markStaleOpenSesiIncomplete` tandai `tanggal < CURDATE()` jadi basi); shift lintas hari (`is_cross_date=1`) paling lambat `jam pulang terjadwal + grace 3 jam` (`CROSS_DATE_KELUAR_GRACE_HOURS`, sinkron FE `AbsenKaryawan.jsx` + BE `absensiSesi.model.js`). Lewat batas → sesi `incomplete` (lupa keluar), tak dihitung hadir.
- **UI/UX baru halaman Absensi — kolom Catatan** (`Absensi.jsx`) — UI Baru (`columnsV2`) tak punya kolom Catatan sehingga `reason` karyawan tak tampil (data sudah dikirim BE `a.reason`, hanya tak dirender). Tambah kolom Catatan yang tampil penuh inline (`whiteSpace: pre-line` + `wrap`). FE only.
- **UI/UX baru + mobile responsive halaman Jadwal Harian** (`JadwalHarian.jsx`) — hook `useIsMobile` (<768px). Desktop: matrix karyawan×tanggal dengan month-nav pill, stat bar (Karyawan/Shift terisi/Coverage%), legend chips berwarna, sel `+` untuk kosong. **Mobile: layout list per-hari** menggantikan matrix (nama panjang kepotong + tap target kecil) — strip tanggal horizontal (pilih hari, default hari ini, auto-clamp ke bulan aktif) + kartu karyawan full-width (nama utuh, badge shift, border-kiri warna, tombol "+ Set"). Tap kartu → modal shift lama (reuse, API/logika/import zero perubahan).
- **UI/UX baru halaman Shifting (toggle Lama/Baru)** (`Shift.jsx`) — pola sama Absensi (segmented toggle header, persist `localStorage` key `shift_ui_mode`, default Baru; UI lama utuh). Stat cards (Total/Aktif/Berakhir/Jadwal Harian), search global (nama+retail), quick-filter chip (Aktif/Berakhir/Jadwal Harian/Reguler), kolom **Retail paling kiri** (ikon toko) + badge Tipe (Jadwal Harian/Reguler) + Status (Aktif bila `end_date>=hari ini`). Modal Update didesain ulang: card ringkasan retail+karyawan+status, grid periode, Tipe Shift sbg 2 kartu pilih (bukan `<select>`). FE only, add/update/delete modal & API tak disentuh.
- **UI/UX baru halaman Tipe Absen (toggle Lama/Baru)** (`CatAbsen.jsx`) — pola sama Absensi (persist `localStorage` key `typeabsen_ui_mode`, default Baru; UI lama utuh). **Pasangan masuk+keluar digabung jadi 1 baris** per shift (match by nama ternormalisasi `normName` — lowercase + rapatkan spasi + trim, jaga `"Designer "=="Designer"`, `"BM - U4"=="BM -U4"`; arah dari `description` selaras BE `absenDirectionOf`). Kolom: Shift/Code (ikon `link-off` merah bila pasangan tak lengkap), Masuk & Keluar berdampingan (jam + edit/hapus mini per-arah), Kategori (badge + "+1 hari" cross-date), Fee. Stat cards (Total Tipe/Pasangan Shift/**Tanpa Pasangan**/Lintas Hari) + chip "Tanpa Pasangan". Modal Edit didesain ulang (card ringkasan, grid, cross-date sbg kartu toggle). Edit/hapus tetap per-tipe → modal & API lama, zero perubahan BE.

### Fixed
- **Android: tipe keluar lembur tak muncul + sesi lembur tak terdeteksi** (`AbsensiActivity.java`, `AbsenLogic.java`, `HistoryItem.java`) — port web `AbsenKaryawan.jsx` tak lengkap; BE (`getOpenLemburKeluarTypes`, commit `88b437c`) sudah benar, cacat murni di client.
  - **Mode lembur otomatis**: web turunkan `effectiveLemburMode` dari state server (sesi lembur open → mode lembur menyala sendiri). Android hanya punya flag manual dari tombol "Mulai Lembur", dan `updateLemburUi` justru MENYEMBUNYIKAN tombol itu saat `attendanceMode=='lembur'` → setelah restart app / hari berikutnya user terkunci total (tombol hilang, filter ambil cabang regular, tipe keluar tak pernah dirender). Port `effectiveLemburMode`/`lemburComplete` + reset saat lembur selesai atau mid-shift regular.
  - **Filter tanggal buang lembur lintas tengah malam**: `attendanceMode`/`lemburNextDirection`/`lemburMasukKategori` pakai `isSameLocalDate` saja, web pakai `isSameLocalDate || isCrossDateSesiActive`. Lembur SUBUH masuk 23:42 kemarin tak terlihat hari ini. Fix: helper `isTodayOrCrossActive`.
  - **Tipe keluar dicocokkan pakai field salah**: Android banding `kategori_absen` (nullable), web + pasangan BE pakai NAMA tipe (`tk.name = tm.name`). Fix: `filterLemburTypes` banding `t.getName()` vs `masukRow.category_absen`; `HistoryItem` parse `category_absen` + `retail_id` (guard `isNull` — `optString(k, null)` kembalikan literal `"null"` untuk JSON null).
  - **OC lembur auto-pilih + terkunci** saat arah keluar (padanan `disabled` web), resolve by `retail_id` karena objek retail dibangun ulang tiap fetch. Filter spinner kategori dilewati saat mode lembur (tipe lembur bisa ber-kategori NULL). `setLemburContext` kirim flag efektif, bukan manual.

### Added
- **Halaman panduan `/update`** (`UpdateApp.jsx`, route publik di luar `ProtectedRoute` — dibuka karyawan dari HP tanpa login). Berisi: langkah pasang APK (uninstall lama → unduh Drive → izinkan sumber → pasang → login), ringkasan **cara absen** (arah-aware, masuk dibuka 1 jam sebelum shift, radius → approval, shift lintas hari), langkah **lembur** (regular komplit dulu → pilih OC → masuk → keluar otomatis terdeteksi), dan troubleshooting "tipe absen tidak muncul".
  - **Note wajib absen masuk DAN keluar** — kehadiran hanya dihitung bila sesi lengkap (`absensi_sesi.status='closed'` = masuk+keluar berpasangan). Absen sepihak berakhir `incomplete`, baik karena lupa keluar (`markStaleOpenSesiIncomplete`) maupun keluar tanpa masuk (`createIncompleteSesi`) → tidak dihitung hadir. Ditaruh paling atas section Cara Absen + diulang di langkah keluar lembur.
  - **Note perubahan jadwal diajukan H-1** — aturan KEBIJAKAN, bukan guard teknis (tak ada enforcement H-1 di kode; admin masih bisa ubah `jadwal_harian` kapan saja). Dasarnya: tipe absen yang muncul dibaca dari `jadwal_harian` tanggal `CURDATE()`, jadi perubahan di hari-H tak tercermin pada sesi yang sudah berjalan.
- **Reset IMEI di edit karyawan** (`Users.jsx`) — tombol Reset di samping field IMEI + dialog konfirmasi; kosongkan `user.imei` jadi NULL supaya karyawan bisa login dari HP baru (BE `checkImei` auto-daftarkan device saat login berikutnya). Tak perlu endpoint baru — pakai `POST /users/update/:idUser` yang ada.
  - **Fix jebakan FormData**: `FormData.append("imei", null)` menghasilkan string `"null"`, dan BE `body.imei || null` menganggapnya nilai sah → kolom terisi teks `"null"` dan device-binding rusak permanen. Kirim string kosong (`"" || null` → `null`).
  - `handleSaveUpdate` terima param `overrides` (`payloadUser = {...selectedUser, ...overrides}`) — `setSelectedUser` async, save langsung setelah setState akan kirim nilai lama.
- **UI/UX baru halaman Users (toggle Lama/Baru)** (`Users.jsx`) — pola sama seperti Absensi (segmented toggle di header, persist `localStorage` key `users_ui_mode`, default Baru; UI lama utuh). Stat cards (Total/Aktif/Non Aktif/**Tanpa IMEI**), search global lintas kolom, quick-filter chip, tabel modern (avatar+username, kolom Perangkat sbg badge hijau/oranye, status pill, aksi ikon). FE only.

### Added
- **Hapus histori absensi (admin)** (`POST /api/absensi/delete/:absenId`, tombol di page Absensi) — hapus 1 baris `absensi` beserta penyesuaian sesi. Hard delete (tabel tak punya kolom soft-delete) + snapshot baris lama ke `log_activity` (action `DELETE`) untuk jejak/recovery manual. **Efek sesi** (`detachAbsensiFromSesi`): slot sesi yang mereferensi baris ini di-NULL-kan & status turun jadi `incomplete`; bila sesi jadi kosong total (dua slot NULL) sesi ikut dihapus. Transaksional. File foto TIDAK dihapus dari disk.
- **Page baru "Kelola Sesi Absensi"** (`SesiAbsensi.jsx`, `/sesi-absensi`) — admin view + manage `absensi_sesi` (pairing masuk↔keluar) via UI, gantikan kerja manual `scripts/fix-cross-date-sesi.js`.
  - View: DataTable server-side pagination (65k+ baris), filter status (default incomplete) + rentang **per-hari/minggu/bulan** (default hari) + cari karyawan. Kolom masuk/keluar jam+shift, badge status berwarna, badge Lembur, penanda "ada pasangan".
  - BE list (`absensiSesi.model.js listSesi`/`countSesi`): JOIN user+retail+tipe_absen (masuk & keluar), flag `has_candidate` (EXISTS sesi incomplete lawan-arah user+shift+is_lembur sama, window 20h) untuk highlight orphan berpasangan.
  - Aksi: **Buat sesi baru** (`createNewSesi` — pilih karyawan+retail+shift tipe masuk+jam → insert absensi masuk manual + `openSesi` status open; keluar diisi kemudian). Dropdown shift **menyesuaikan karyawan dipilih** — fetch `POST /api/absen-management/shift-user/:userId`, filter arah masuk (tipe yang di-assign ke user via shifting/jadwal). **Match** (gabung 2 incomplete → closed; `findMatchCandidates` sarankan pasangan by shift name+window, `matchSesi` set keluar + hapus orphan), **Unmatch** (closed → 2 incomplete, `unmatchSesi`), **Tambah absen** bagian hilang (sesi incomplete → insert absensi manual, recompute status dari jam+tipe, isi slot + close via `addAbsenToSesi`/`fillSesiSlot`/`getTipeByNameDirection`), **Ubah status** manual (`updateSesiStatus`), **Hapus** sesi (`deleteSesi`). Semua transaksional + audit `log_activity` (label MATCH/UNMATCH/UPDATE_STATUS/ADD_ABSEN/DELETE disimpan di `dataquery`, kolom `action` = enum INSERT/UPDATE/DELETE).
  - Absen manual (buat sesi + tambah absen): **foto opsional** (upload `photo_url` via multer, disimpan `"/assets/<filename>"` sama seperti absen normal; kosong bila tak diunggah → FE pakai gambar fallback), **lokasi none** (lat/lon 0), `reason` +`[input manual admin]`, `is_valid=1` approved.
  - Endpoint (`routes/absensi.js`): `GET /api/absensi/sesi`, `POST /sesi/create` (multipart), `GET /sesi/:id/candidates`, `POST /sesi/match`, `POST /sesi/:id/unmatch`, `POST /sesi/:id/status`, `POST /sesi/:id/add-absen` (multipart), `POST /sesi/:id/delete`.
- **Ubah tipe absen di Koreksi Absen** (`Absensi.jsx` modal + `absensi.controller.js koreksiAbsen`) — admin bisa ganti `absen_type_id` 1 baris (dulu di luar scope). Dropdown tipe difilter **searah** baris (`GET /api/absensi/tipe-absen?direction=masuk|keluar`, `getTipeAbsenByDirection`).
  - Recompute `status_absen` + `potongan` dari window tipe BARU (admin tetap boleh override status). Guard arah: tolak 400 bila ubah masuk↔keluar.
  - Sinkron `absensi_sesi.kategori_absen` ke kategori tipe baru (fallback `getKeluarKategoriByName`) — cegah sesi pecah. Audit old→new (+`absen_type_id`) ke `log_activity`.
- **Android app web-parity (layar attempt absen)** (`absen-ocb-apps-main`, native Java) — port logika keputusan dari web `AbsenKaryawan.jsx`. Home & History tak disentuh.
  - `AbsenLogic.java` (baru): ~15 helper port dari web (direction, isSameLocalDate, isRejected, cross-date deadline+grace 3h, findOpenRegularMasuk, buildTodayAttendanceStatus, nextRegularDirection, attendanceMode, hasTodayForTimeCategory, checkEarlyMasuk window 60mnt, haversine). `HistoryItem.java` (baru): model history dgn sesi_status/sesi_direction/is_lembur/is_cross_date/keluar_start_time.
  - `AbsensiActivity`: fetch berantai history→shift-user→lembur-types→retail; arah-aware (tampilkan hanya tipe arah berikutnya masuk/keluar, cross-date SUBUH diarahkan keluar); buang gate `is_absen_today` per-baris. Mode lembur: tombol "Mulai Lembur" (muncul bila regular komplit/jadwal non-mid-shift), spinner OC (retail picker), list ganti tipe lembur komplemen.
  - `AbsenAdapter`: icon per-arah, teruskan `is_lembur`+`start_time`+retail OC lembur via intent, sembunyikan retail item saat mode lembur (OC dari spinner). `AbsenActivity`: baca+kirim `is_lembur`, pre-check early-masuk. `AbsenItem` +is_cross_date/keluar_start_time/is_lembur.
  - `build.gradle` versionCode 1→2 (upgrade-install timpa). Endpoint via `Constant.java` (prod default).

### Changed
- **Guard window absen masuk diperluas ke SEMUA jalur + batas atas jam pulang** (`absensi.controller.js`) — sebelumnya batas 1-jam-sebelum hanya jadwal-harian + lembur.
  - Sekarang non-jadwal (retail biasa) juga kena batas bawah (1 jam sebelum `start_time`).
  - **Batas atas baru**: absen masuk ditolak bila sudah lewat JAM PULANG shift (= `start_time` tipe KELUAR pasangan, match by `name`, helper `getKeluarStartTimeByName`). Cross-date (keluar besok) skip batas atas. Ex: PAGI masuk 08:00 pulang 17:00 → masuk hanya 07:00-16:59; jam 17:00+ ditolak. Enforcement BE only.

### Added
- **UI/UX baru halaman Absensi (toggle Lama/Baru)** (`Absensi.jsx`) — tampilan modern clean, akses via toggle segmented di header (persist `localStorage`, default Baru). UI lama tetap utuh (`uiMode='lama'`). FE only, tak sentuh BE/route/DB.
  - Stat cards (Total/Ontime/Telat/Lembur), toolbar rapi (search global multi-field + date range + Export + quick-filter chip Valid/Invalid/Telat/Lembur), DataTable modern (sortable, badge status pill berwarna, badge Lembur, foto thumbnail, aksi ikon+tooltip, sticky header, empty/loading state).
  - Reuse penuh handler existing (validasi/ignore/koreksi/export/preview) + modal — nol duplikasi logika.

- **Koreksi Absen (admin)** — admin bisa koreksi jam/status/catatan 1 baris `absensi` dari halaman Absensi. Lihat `docs/absensi-koreksi-plan.md`.
  - DB: kolom audit `absensi.updated_by` + `updated_at` (`docs/absensi-koreksi.sql` / `scripts/migrate-absensi-koreksi.js` idempotent). `updated_at IS NOT NULL` = pernah dikoreksi.
  - BE model (`absensi.model.js`): `getAbsensiById`, `koreksiAbsen(conn, ...)` transaksional + audit old→new ke `log_activity`. `historyAbsensiAllUser` SELECT +`status_absen` +`start_time` +`end_time` (prefill FE). `absensiSesi.model.js`: `findSesiByAbsensiId`, `updateSesiTanggal`.
  - BE controller (`absensi.controller.js` `koreksiAbsen`): recompute `status_absen` (ontime/telat vs `end_time`) + `potongan` (telat >15mnt → potonganLate) dari waktu baru; admin boleh override status eksplisit. Sinkron `absensi_sesi.tanggal` bila jam masuk geser tanggal. Transaksi + rollback. Route `POST /api/absensi/koreksi/:absenId`.
  - FE (`Absensi.jsx`): kolom aksi "Koreksi" + modal (waktu `datetime-local`, status Ontime/Telat/Otomatis, catatan). Save POST + optimistic update.

- **Lembur staff jadwal-harian: cover shift lain (kategori komplemen)** — staff jadwal-harian (mis. di-assign SUBUH) bisa menggantikan karyawan toko lain di shift beda via lembur. Sebelumnya lembur hardcode PAGI saja.
  - BE (`absenManagement.model.js` `getLemburTypes`): jalur jadwal-harian → tipe lembur = kategori KOMPLEMEN shift assigned hari ini (assigned Malam/SUBUH → Pagi+Sore; Sore → Pagi+Malam; Pagi → Sore+Malam). Tetap exclude tipe jadwal hari itu + Trainee. Non-jadwal → tetap PAGI-only (legacy). Jadwal-harian tanpa jadwal hari ini → kosong.
  - BE (`absensi.controller.js` hard-guard lembur): jalur jadwal-harian → lembur boleh sebelum/sesudah shift regular, diblokir HANYA saat sedang menjalani shift regular (sesi regular OPEN, `includeYesterday` tangkap subuh cross-date). Non-jadwal → tetap wajib regular komplit dulu. Guard lembur-keluar-wajib-ada-lembur-masuk tak berubah (semua jalur).
  - FE (`AbsenKaryawan.jsx`): button "Mulai Lembur" — `usesJadwalHarian ? !regularInProgress : hasCompletedRegularAttendance`. `regularInProgress` = ada sesi regular open (mid-shift). Menjaga fix mid-shift (button hidden saat masuk regular belum keluar).
  - **Hapus filter window jam lembur** — dulu tipe lembur cuma tampil saat jam masuk window kategorinya (`isWithinShiftWindow`), bikin shift Sore tak muncul sebelum 14:00. Diganti: semua tipe komplemen tampil, batas waktu ditegakkan guard 1-jam-sebelum-start. BE early-masuk guard (`absensi.controller.js`) diperluas cover LEMBUR masuk (bukan cuma regular jadwal-harian). FE `filteredLemburTypes` drop `isWithinShiftWindow`; pre-check `checkEarlyMasuk` juga jalan di mode lembur.
  - **Card "Status Hari Ini" adaptif mode + info lembur** (`AbsenKaryawan.jsx`): mode lembur aktif → card tampil status LEMBUR (header "Status Lembur", `buildTodayLemburStatus`); mode regular → status regular. Card regular tampil badge kecil "Ada absen lembur hari ini" bila ada lembur (`hasLemburToday`, independen dari regular-complete).

### Fixed
- **Tipe absen keluar LEMBUR tak muncul** (`absenManagement.model.js getLemburTypes`) — daftar tipe lembur dihitung dari komplemen kategori jadwal `CURDATE()`; bila hari ini belum di-assign jadwal → return kosong, dan bila di-assign, filter komplemen bisa membuang kategori shift lembur yang sedang berjalan. Akibat sesi lembur `open` (mis. lembur SUBUH masuk 23:42 kemarin, keluar 08:00 hari ini) tak bisa ditutup. Fix: helper `getOpenLemburKeluarTypes` — tipe KELUAR pasangan (match by `name`) dari sesi lembur `open` selalu disertakan (digabung+dedup ke hasil, dan tetap dikembalikan saat jadwal hari ini kosong).
- **Tambah absen keluar tak bisa di sesi hasil "Buat Sesi Baru"** (`absensi.controller.js` + `SesiAbsensi.jsx`) — buat sesi baru menghasilkan status `open` (masuk terisi, keluar kosong), tapi guard `addAbsenToSesi` hanya menerima `incomplete` dan tombol FE hanya muncul untuk `incomplete` → alur "keluar diisi kemudian" buntu. Fix: terima status `open` juga (BE guard `open`/`incomplete`; FE tombol tampil bila status open/incomplete DAN ada slot kosong).
- **Tipe absen keluar hilang esok hari (jadwal-harian + shift cross-date)** (`absenManagement.model.js`) — user jadwal-harian absen shift cross-date hari-N (mis. SORE 9 JAM masuk 23:14, keluar terjadwal 01:00 hari-N+1), lalu hari-N+1 jadwalnya shift lain (mis. PAGI). `getTypeAbsenByJadwal` cuma ambil jadwal `tanggal=CURDATE()` → tipe keluar shift kemarin tak muncul → user tak bisa absen keluar sesi yang masih open. Fix: helper `getCrossDateKeluarTypesByJadwal` — sertakan tipe keluar dari sesi cross-date open lintas-hari (via `s.jadwal_id`, retail dari sesi, tipe masuk `is_cross_date=1`, sesi open masuk-only, belum lewat deadline keluar `start_time+1hari+grace 3h`). Digabung+dedup ke hasil jadwal today; juga dikembalikan saat besok belum di-assign jadwal.
- **Tipe keluar cross-date tak tampil karena beda casing kategori** (`AbsenKaryawan.jsx` + `absensi.controller.js`) — shift SORE 9 JAM: tipe MASUK `kategori_absen='sore'` (lowercase), tipe KELUAR `='Sore'` (uppercase). FE lock tipe keluar ke kategori masuk pakai banding case-sensitive → `'Sore' !== 'sore'` → tipe keluar difilter habis → attempt keluar tak muncul. Fix: banding kategori **case-insensitive** (`.toLowerCase()`) di FE (`masukRegularKategori` + filter tipe keluar) dan BE guard tipe keluar (`getTimeDB.kategori_absen` vs `openSesiAktif.kategori_absen`).
- **Toggle "Absen Lintas Hari" (`is_cross_date`) tampak tak tersave** (`absenManagement.model.js` + `.controller.js`) — nilai SEBENARNYA tersimpan ke DB, tapi endpoint list tipe absen (`getTypeAbsenWithGroups`) buang field: SQL SELECT tak sertakan `ta.is_cross_date` + controller transform tak destructure/masukin ke object. Akibat modal edit checkbox selalu tampak unchecked → user kira gagal save, lalu save ulang meng-overwrite balik ke 0. Fix: tambah `is_cross_date` di SQL SELECT + object hasil group.
- **Sesi lembur cross-midnight tak terdeteksi keesokan hari** (`AbsenKaryawan.jsx`) — absen masuk lembur shift cross-date (mis. SUBUH 9 JAM masuk 23:42, is_lembur=1, sesi open) tak terbaca esok hari: semua logic lembur pakai `isSameLocalDate(absen_time)` → masuk kemarin diabaikan → mode lembur tak aktif, card status masuk kosong, arah keluar tak muncul, OC tak auto-select. Fix 4 titik pakai helper `isCrossDateSesiActive` (sudah dipakai regular cross-date): (1) `attendanceMode` kunci mode lembur, (2) `todayLemburSesi` deteksi `hasOpen` (wajib keluar), (3) `buildTodayLemburStatus` tampilkan masuk di card, (4) auto-select OC pakai `todayLemburSesi.masukRow` (bukan scan hari-ini). Sertakan absen cross-date bila sesinya masih `open` & belum lewat deadline keluar (grace 3h).
- **Absen lembur salah tampil sbg status regular** (`AbsenKaryawan.jsx` `buildTodayAttendanceStatus`) — card "Status Hari Ini" (regular) sebelumnya menghitung baris `is_lembur=1`, bikin lembur muncul sbg masuk/keluar regular + salah picu label "Attempt Lembur" pd tipe regular. Fix: exclude `is_lembur=1` dari card regular.
- **Arah attempt regular salah "keluar" saat ada lembur** — FE fallback `is_absen_today` (hitung SEMUA absen termasuk lembur) keliru anggap masuk regular sudah → tipe regular (subuh) diarahkan "keluar". Fix: skip fallback bila ada absen lembur hari ini (`hasLemburTodayRows`); sumber arah regular = `todayStatus` (sudah exclude lembur).
- **Button "Mulai Lembur" tak berfungsi setelah regular komplit** (`AbsenKaryawan.jsx`) — `effectiveLemburMode` clause manual hanya `attendanceMode === null` (belum absen), jadi user yg sudah selesai regular (`attendanceMode='regular'`) klik button tapi mode lembur tak aktif. Fix: clause → `isLemburMode && !regularInProgress` (cover regular komplit + belum absen, tetap blokir mid-shift). Reset-effect `isLemburMode` hanya saat `lemburComplete || regularInProgress`. `lemburComplete` deteksi mode "mixed" (regular+lembur) juga.
- **Sesi cross-date pecah bila kategori tipe MASUK NULL** (`absensi.controller.js`, `absensi.model.js`) — saat tipe absen MASUK cross-date (SORE 9 JAM, SUBUH 9 JAM) di-edit hingga `kategori_absen` jadi NULL, `openSesi` menyimpan sesi kategori NULL, lalu absen KELUAR (`findOpenSesi` cari kategori tipe keluar, mis. 'Sore'/'Malam') gagal match → membuat sesi `incomplete` baru (masuk NULL) alih-alih menutup sesi masuk. 1 shift terpecah 2 incomplete. **Root cause = data** (kategori tipe masuk ter-null saat edit 25 Jul), bukan logika pairing. Fix 2 lapis: (1) resolve `kategoriAbsen` fallback ke kategori tipe KELUAR pasangan (`getKeluarKategoriByName`, match by `name`) saat tipe kategori NULL — jaga masuk & keluar sekategori (cegah bug berulang untuk absen baru); (2) data fix via `scripts/fix-cross-date-sesi.js`.
- **Arah attempt salah "keluar" saat shift cross-date sudah selesai** (`AbsenKaryawan.jsx`) — BE `is_absen_today` (`checkFlagAbsen`) hitung `DATE(absen_time)=CURDATE()` termasuk absen KELUAR penutup shift cross-date (mis. SUBUH keluar 08:00 hari ini), padahal sesinya sudah `closed` (shift kemarin). FE fallback lalu `add("masuk")` → shift baru salah diarahkan "keluar". Fix: guard `hasRealTodayAbsen` — skip fallback bila absen hari ini semata penutup cross-date `closed` (is_cross_date=1 + sesi_status='closed' + sesi_direction='keluar').
- **Data fix sesi orphan cross-date** (`scripts/fix-cross-date-sesi.js`) — script server 2 langkah idempotent (dry-run default, `APPLY=1` commit, snapshot backup ke `backups/`). STEP 1: restore `tipe_absen.kategori_absen` masuk (NULL → kategori keluar pasangan by name). STEP 2: pasangkan ulang sesi `incomplete` keluar-orphan ke absen masuknya (match user + shift name + is_lembur + window 20h, greedy dedup; kasus A tutup masuk-sesi + hapus orphan, kasus B isi masuk ke orphan-sesi). STEP 2 wajib scope `--since`/`--date` (cegah sentuh orphan historis non-bug).

- **Batas absen masuk: 1 jam sebelum jam masuk (khusus jadwal harian)** — user jalur jadwal-harian hanya boleh absen masuk mulai 1 jam sebelum `start_time` tipe. Ex: start 15:00 → paling awal 14:00. Telat tetap boleh. User non-jadwal tak dibatasi.
  - BE (`absensi.controller.js`): guard `isMasuk && usesJadwalHarian`, tolak 400 bila `minutesUntilStart > 60` (`EARLY_MASUK_WINDOW_MINUTES`). Wrap tengah malam ditangani. `userUsesJadwalHarian` di-export dari `absenManagement.model.js`.
  - BE (`absenManagement.controller.js`): shift-user response +`uses_jadwal_harian`.
  - FE (`AbsenKaryawan.jsx`): `checkEarlyMasuk` pre-check di `handleSubmit` (hanya bila `uses_jadwal_harian` & non-lembur) → warning, cegah upload foto sia-sia.

### Fixed
- **Button "Mulai Lembur" muncul sebelum regular selesai** (`AbsenKaryawan.jsx`) — syarat button pakai `todayHasRegular` (cukup ada masuk), diganti `hasCompletedRegularAttendance` (masuk+keluar komplit). Selaras BE hard-guard lembur.
- **Sesi cross-date `closed` salah kunci mode absen** — `attendanceMode` exclude row `is_cross_date=1` bersesi `closed` (penutup shift kemarin, bukan absen hari ini). Cegah salah lock mode + salah picu lembur.

### Changed
- **Halaman `/jadwal-harian` hanya tampilkan OC + karyawan yang jadwal-harian AKTIF** — sebelumnya dropdown OC tampilkan semua OC 1-40 dan matrix tampilkan semua karyawan retail, walau shift jadwal-harian tak aktif.
  - BE endpoint baru `GET /api/jadwal-harian/active-retails` (`getActiveJadwalRetails`): retail dgn shifting `uses_jadwal_harian=1` + periode mencakup CURDATE(). CSV `retail_id` di-expand via `FIND_IN_SET` join retail.
  - BE `getEmployeesByRetail` +filter `uses_jadwal_harian=1` + periode aktif (selaras `userUsesJadwalHarian`) — karyawan tanpa shift jadwal-harian aktif tak masuk matrix.
  - FE (`JadwalHarian.jsx`): dropdown OC sumber ganti dari `/retail` → `/jadwal-harian/active-retails`. Fix `setJadwalRows`→`setMonthJadwal` (refresh setelah import Excel).

### Added
- **Flag `is_cross_date` di tipe absen + auto-close sesi basi** — bedakan "cross-date sah" (shift keluar besok) vs "lupa keluar" (sesi basi) yang dua-duanya menghasilkan sesi `open`. Lihat `docs/cross-date-flag-plan.md`.
  - DB: kolom `tipe_absen.is_cross_date` (`docs/cross-date-flag.sql`), backfill SUBUH/SORE 9 JAM = 1, sisanya 0. Admin set via toggle CatAbsen.
  - BE model: `createNewAbsenType`/`updateAbsenType` + `is_cross_date`; `getAlltypeAbsen` + `historyAbsensiPerUser` SELECT `is_cross_date`.
  - BE auto-close (`absensi.controller.js` blok masuk): `markStaleOpenSesiIncomplete` tandai sesi open tanggal lampau bertipe `is_cross_date=0` jadi `incomplete` sebelum buka sesi baru — cegah user terblokir + jaga akurasi lembur-guard. Sesi cross-date sah tak disentuh.
  - FE (`AbsenKaryawan.jsx`): `findOpenRegularMasuk` hanya trigger "wajib keluar" untuk sesi open `is_cross_date=1`. Sesi basi (`is_cross_date=0`) diabaikan → user boleh absen masuk baru.
  - **Batas 3 jam cross-date**: "wajib keluar" untuk sesi cross-date hanya berlaku sampai 3 jam setelah jam keluar terjadwal (tanggal masuk +1 hari + grace 3 jam, `CROSS_DATE_KELUAR_GRACE_HOURS`). Jam keluar = `start_time` tipe KELUAR pasangan (match by `name`), BUKAN `end_time` masuk (itu window absen masuk sempit, mis. SUBUH 23:00-23:10). Lewat batas → dianggap lupa keluar: FE izinkan absen masuk baru, BE `markStaleOpenSesiIncomplete` tandai sesi jadi `incomplete`.
  - `absensi.model.js` history SELECT + subquery `keluar_start_time` (start_time tipe keluar pasangan) untuk deadline FE. `absensiSesi.model.js` markStale LEFT JOIN tipe keluar via `name`.
  - FE (`CatAbsen.jsx`): toggle "Absen Lintas Hari (keluar besok)?" di form tambah + edit.

- **Live clock + card "Status Hari Ini" sadar sesi cross-date** (`AbsenKaryawan.jsx`)
  - Jam realtime (hari, tanggal, jam:menit:detik) tick per detik di atas halaman.
  - Card status: header dinamis → nama tipe absen bila sesi cross-date aktif (bukan "Status Hari Ini" statis). Waktu absen tampil tanggal + jam.
  - `buildTodayAttendanceStatus` sekarang sesi-aware: hitung masuk shift cross-date yang sesinya masih `open` (masuk kemarin, belum keluar); TAPI exclude row cross-date bersesi `closed` (shift kemarin sudah tuntas — milik tanggal mulai, bukan hari ini). Cegah keluar penutup shift kemarin salah tampil sbg absen hari ini + salah picu jalur lembur.

### Fixed
- **FE arah absen cross-midnight (shift SORE 9 JAM / SUBUH)** — user dengan shift yang masuk kemarin & keluar hari ini (mis. SUBUH masuk 23:00, keluar 08:00 besok) sebelumnya salah diarahkan ke "absen masuk" lagi, bukan "keluar". Penyebab: FE `nextRegularDirection` pakai `isSameLocalDate` (hari ini saja), tak lihat masuk kemarin.
  - `AbsenKaryawan.jsx`: deteksi sesi regular open dari history (`sesi_status='open'`, `sesi_direction='masuk'`, non-lembur, `is_cross_date=1`) — bila ada, override arah ke "keluar" + lock kategori tipe keluar ke sesi itu. Sumber kebenaran = `absensi_sesi.status` + flag `is_cross_date`, bukan tanggal/jam.

- **Guard tipe absen keluar harus cocok dengan masuk** — cegah user pilih tipe keluar beda kategori/jadwal dari absen masuknya, yang bikin sesi pecah (masuk menggantung `open` + keluar jadi `incomplete` terpisah)
  - BE (`absensi.controller.js` blok `isKeluar`): sebelum insert, `findAnyOpenSesi` cari sesi open aktif user; bila ada → tipe keluar divalidasi. Jalur jadwal harian: `absen_type_id` harus == `jadwal.absen_keluar_id`. Jalur non-jadwal/lembur: `kategori_absen` keluar harus == kategori sesi open. Tak cocok → HTTP 400.
  - Berlaku 3 jalur: non-jadwal, lembur (`is_lembur` scope terpisah), jadwal harian. Guard server menutup celah bypass API (FE lock saja tidak cukup).
  - FE (`AbsenKaryawan.jsx`): dropdown tipe keluar regular dikunci ke kategori absen masuk hari ini.
  - Model baru: `absensiSesi.model.js` +`findAnyOpenSesi`, +`getJadwalKeluarId`.

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
