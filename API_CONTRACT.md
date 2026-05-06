# API Contract Documentation — OCB Absen System

**Versi Dokumen:** 1.0.0  
**Tanggal:** 2026-05-06  
**Dibuat oleh:** Engineering Team OCB  

---

## Daftar Isi

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Konfigurasi Dasar](#2-konfigurasi-dasar)
3. [Autentikasi & Keamanan](#3-autentikasi--keamanan)
4. [Format Standar Response](#4-format-standar-response)
5. [Kontrak API — Manajemen User](#5-kontrak-api--manajemen-user)
6. [Kontrak API — Absensi](#6-kontrak-api--absensi)
7. [Kontrak API — Manajemen Tipe Absen](#7-kontrak-api--manajemen-tipe-absen)
8. [Kontrak API — Manajemen Retail](#8-kontrak-api--manajemen-retail)
9. [Kontrak API — Manajemen Shift](#9-kontrak-api--manajemen-shift)
10. [Kontrak API — Manajemen Off Day & Bonus](#10-kontrak-api--manajemen-off-day--bonus)
11. [Kontrak API — Gaji & KPI](#11-kontrak-api--gaji--kpi)
12. [Kontrak API — Dashboard & Summary](#12-kontrak-api--dashboard--summary)
13. [Kontrak API — Menu & Hak Akses](#13-kontrak-api--menu--hak-akses)
14. [Kontrak API — Role & Kategori User](#14-kontrak-api--role--kategori-user)
15. [Kontrak API — File & Laporan](#15-kontrak-api--file--laporan)
16. [Kontrak API — Versi Aplikasi](#16-kontrak-api--versi-aplikasi)
17. [Matriks Konsumsi Endpoint per Client](#17-matriks-konsumsi-endpoint-per-client)
18. [Kode Error & Penanganannya](#18-kode-error--penanganannya)
19. [Catatan Integrasi Khusus](#19-catatan-integrasi-khusus)

---

## 1. Gambaran Umum Sistem

Sistem OCB Absen terdiri dari tiga komponen utama yang saling berinteraksi:

| Komponen | Teknologi | Peran |
|---|---|---|
| **Backend** (`absen-ocb-be-main`) | Node.js + Express.js + MySQL | Penyedia API (server) |
| **Frontend Web** (`absen-ocb-fe-main`) | Vue.js / React + Vite | Dashboard manajemen (admin/supervisor) |
| **Mobile Android** (`absen-ocb-apps-main`) | Android Java + Volley | Aplikasi absensi karyawan lapangan |

### Alur Komunikasi

```
Android App  ──────────────────┐
                               ▼
Frontend Web ──────────► Backend API (Express) ──► MySQL Database
                               │
                               └──► KPI External API
```

---

## 2. Konfigurasi Dasar

### Backend

```
Port          : 4000 (dapat dikonfigurasi via environment)
Base URL API  : http://localhost:4000/api  (development)
Production URL: https://api-absen.ocbgroup.web.id/api
Timezone      : Asia/Makassar (untuk absensi), Asia/Jakarta (lainnya)
CORS          : Aktif untuk semua origin (*)
```

### Frontend Web

```
VITE_API_URL  : https://api-absen.ocbgroup.web.id/api
VITE_API_IMAGE: https://api-absen.ocbgroup.web.id
```

### Mobile Android

```
Base API URL  : https://api-absen.ocbgroup.web.id/api/
Image URL     : https://api-absen.ocbgroup.web.id
HTTP Library  : Android Volley 1.2.1
Image Library : Glide 4.14.2
Token Storage : SharedPreferences ("AppPrefs")
```

---

## 3. Autentikasi & Keamanan

### Metode Autentikasi

Semua endpoint (kecuali yang ditandai `Public`) menggunakan **JWT Bearer Token**.

```
Header: Authorization: Bearer {token}
```

### Masa Berlaku Token

- Token berlaku selama **365 hari** sejak diterbitkan.
- Token yang sudah digunakan logout akan dimasukkan ke daftar invalidasi.

### Perbedaan Login per Client

| Client | Endpoint Login | Validasi Tambahan |
|---|---|---|
| Android App | `POST /users/login` | Wajib kirim `imei` — validasi perangkat terdaftar |
| Frontend Web | `POST /users/login-dashboard` | Tidak butuh `imei` |

### Penyimpanan Token

| Client | Mekanisme Penyimpanan |
|---|---|
| Frontend Web | `localStorage` (key: `"token"`) |
| Android App | `SharedPreferences` (key: `"authToken"`, `"userId"`) |

### Middleware Keamanan Backend

| Middleware | Fungsi |
|---|---|
| `authenticateToken` | Verifikasi JWT dan cek daftar token yang di-invalidasi |
| `checkImei` | Validasi IMEI perangkat saat mobile login |
| `checkAbsensi` (GPS) | Validasi koordinat GPS dalam radius retail |
| `validateAbsenManagementInput` | Validasi input tipe absen |
| `validateRetailInput` | Validasi input data retail (nama min. 2 karakter) |
| `validasiShiftInput` | Validasi input shift (retail_id, start_date, end_date wajib) |

---

## 4. Format Standar Response

### Response Sukses

```json
{
  "message": "string — pesan keterangan",
  "status": "success",
  "status_code": "200",
  "data": { } 
}
```

### Response Error

```json
{
  "message": "string — pesan error yang dapat dibaca manusia",
  "status": "failed",
  "status_code": "number",
  "serverMessage": "string — detail teknis (opsional)"
}
```

### HTTP Status Code yang Digunakan

| Kode | Arti |
|---|---|
| `200` | Berhasil |
| `400` | Bad Request / Validasi gagal |
| `401` | Token tidak valid atau tidak dikirim |
| `403` | Token sudah di-invalidasi (setelah logout) |
| `404` | Data tidak ditemukan |
| `500` | Internal Server Error |

---

## 5. Kontrak API — Manajemen User

### 5.1 Login Mobile (Android)

**Dikonsumsi oleh:** Android App

```
Method  : POST
Endpoint: /users/login
Auth    : Public (tidak perlu token)
```

**Request Body:**
```json
{
  "username": "string — required",
  "password": "string — required",
  "imei"    : "string — required, identifier perangkat Android"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Token generated successfully",
  "status"     : "success",
  "status_code": "200",
  "user_id"    : 42,
  "token"      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Error:**

| Kondisi | status_code | message |
|---|---|---|
| User tidak ditemukan | 404 | User not found |
| Password salah | 400 | Invalid password |
| IMEI terdaftar di user lain | 400 | IMEI already registered to another user |
| Akun sudah terdaftar di perangkat lain | 400 | account already registered to another device |

---

### 5.2 Login Dashboard (Web)

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /users/login-dashboard
Auth    : Public
```

**Request Body:**
```json
{
  "username": "string — required",
  "password": "string — required"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Token generated successfully",
  "status"     : "success",
  "status_code": "200",
  "token"      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> **Catatan Frontend:** User ID diekstrak dari payload JWT menggunakan library `jwtDecode()`, kemudian disimpan di `localStorage`. Profile user kemudian di-fetch via endpoint `/users/profile-web/{userId}` dan disimpan di `sessionStorage`.

---

### 5.3 Logout

**Dikonsumsi oleh:** Frontend Web, Android App

```
Method  : POST
Endpoint: /users/logout
Auth    : Required
```

**Request Body:** _(kosong)_

**Response Sukses (200):**
```json
{
  "message"    : "Logged out successfully",
  "status"     : "success",
  "status_code": "200"
}
```

> **Efek Samping:** Token yang dikirim akan dimasukkan ke daftar invalidasi. Setiap request berikutnya dengan token yang sama akan menghasilkan error 403.

---

### 5.4 Get Profil User (Mobile)

**Dikonsumsi oleh:** Android App

```
Method       : POST
Endpoint     : /users/profile/:idUser
Auth         : Required
URL Parameter: idUser — user_id yang ingin dilihat profilnya
```

**Request Body:** _(kosong)_

**Response Sukses (200):**
```json
{
  "message"    : "Get User Profiles Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "user_id"      : 42,
      "username"     : "john.doe",
      "name"         : "John Doe",
      "role"         : "Staff",
      "role_id"      : 2,
      "photo_url"    : "/assets/profile/john.jpg",
      "category_user": "Promotor",
      "upline"       : "Jane Smith",
      "retail_name"  : "Outlet Makassar"
    }
  ],
  "fee": [
    {
      "user_id"            : 42,
      "name"               : "John Doe",
      "period"             : "2026-05",
      "total_gaji_awal"    : 5000000,
      "potongan_terlambat" : 50000,
      "potongan_kehadiran" : 0,
      "bonus"              : 200000,
      "total_deduction"    : 50000,
      "total_gaji_akhir"   : 5150000
    }
  ]
}
```

> **Catatan:** URL foto diakses dengan cara menggabungkan `VITE_API_IMAGE` (frontend) atau base URL (Android) + `photo_url`. Contoh: `https://api-absen.ocbgroup.web.id/assets/profile/john.jpg`

---

### 5.5 Get Profil User (Web)

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /users/profile-web/:idUser
Auth         : Required
URL Parameter: idUser
```

**Response:** Sama dengan 5.4, namun mengandung data yang lebih lengkap dan detail untuk kebutuhan tampilan dashboard.

---

### 5.6 Get Semua User

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /users
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All User Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "user_id"      : 42,
      "username"     : "john.doe",
      "name"         : "John Doe",
      "imei"         : "358239051234567",
      "role"         : "Staff",
      "role_id"      : 2,
      "photo_url"    : "/assets/profile/john.jpg",
      "category_user": "Promotor",
      "id_category"  : 3,
      "upline"       : "Jane Smith",
      "id_upline"    : 10,
      "enabled"      : 1
    }
  ]
}
```

---

### 5.7 Get User di Bawah Upline

**Dikonsumsi oleh:** Frontend Web, Android App

```
Method       : GET
Endpoint     : /users/under-upline/:idUser
Auth         : Required
URL Parameter: idUser — user_id supervisor/upline
```

**Response Sukses (200):**
```json
{
  "message"    : "Get User Under Upline Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "user_id"        : 43,
      "username"       : "budi.santoso",
      "name"           : "Budi Santoso",
      "photo_url"      : "/assets/profile/budi.jpg",
      "category_user"  : "Promotor",
      "status_kehadiran": "Masuk",
      "reason"         : null
    },
    {
      "user_id"        : 44,
      "username"       : "ani.wati",
      "name"           : "Ani Wati",
      "photo_url"      : null,
      "category_user"  : "Promotor",
      "status_kehadiran": "Off",
      "reason"         : "Sakit"
    }
  ]
}
```

> **Catatan Android:** Digunakan di `ListKaryawanActivity.java` untuk menampilkan daftar staf bawahan supervisor.

---

### 5.8 Buat User Baru

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /users/create
Auth         : Required
Content-Type : multipart/form-data
```

**Request Body (Form Data):**

| Field | Tipe | Required | Keterangan |
|---|---|---|---|
| `name` | string | Ya | Nama lengkap user |
| `username` | string | Ya | Harus unik |
| `id_category` | number | Ya | ID kategori user |
| `enabled` | number | Ya | `1` = aktif, `0` = nonaktif |
| `upline` | number | Ya | `user_id` supervisor |
| `created_at` | datetime | Ya | Waktu pembuatan |
| `created_by` | string | Ya | Username pembuat |
| `photo_url` | file | Tidak | Foto profil (jpg/png) |

**Password Default:** `"Ocb2024"` (di-generate otomatis oleh backend)

**Response Sukses (200):**
```json
{
  "message"    : "User registered successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "user_id"    : 45,
    "name"       : "Budi Santoso",
    "username"   : "budi.santoso",
    "id_category": 3,
    "photo_url"  : "/assets/profile/budi.jpg"
  }
}
```

**Error:** `400` jika `username` sudah terdaftar.

---

### 5.9 Update User

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /users/update/:idUser
Auth         : Required
Content-Type : multipart/form-data
URL Parameter: idUser
```

**Request Body (Form Data):**

| Field | Tipe | Required | Keterangan |
|---|---|---|---|
| `name` | string | Ya | Nama lengkap |
| `username` | string | Ya | Harus unik |
| `id_category` | number | Ya | ID kategori |
| `enabled` | number | Ya | Status aktif |
| `upline` | number | Ya | ID supervisor |
| `updated_at` | datetime | Ya | Waktu update |
| `updated_by` | string | Ya | Username updater |
| `photo_url` | file | Tidak | Foto baru (jpg/png) |

**Response Sukses (200):**
```json
{
  "message"    : "Update user success",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "user_id"  : 45,
    "photo_url": "/assets/profile/budi_new.jpg"
  }
}
```

---

### 5.10 Hapus User

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /users/delete/:idUser
Auth         : Required
URL Parameter: idUser
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T10:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete user Success",
  "status"     : "success",
  "status_code": "200",
  "data": { "id_user": 45 }
}
```

> **Implementasi:** Soft delete — data tidak benar-benar dihapus dari database.

---

### 5.11 Ganti Password

**Dikonsumsi oleh:** Frontend Web, Android App

```
Method  : POST
Endpoint: /users/change-password
Auth    : Required
```

**Request Body:**
```json
{
  "user_id"    : 42,
  "passwordOld": "Ocb2024",
  "passwordNew": "NewPassword123"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Password berhasil diubah!",
  "status"     : "Success",
  "status_code": "200"
}
```

---

### 5.12 Get Semua Role

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /users/roles
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "data": [
    { "role_id": 1, "name_role": "Admin" },
    { "role_id": 2, "name_role": "Staff" },
    { "role_id": 3, "name_role": "Supervisor" }
  ]
}
```

---

### 5.13 Get Kategori Berdasarkan Role

**Dikonsumsi oleh:** Frontend Web

```
Method       : GET
Endpoint     : /users/category-user/:idRole
Auth         : Required
URL Parameter: idRole
```

**Response Sukses (200):**
```json
{
  "data": [
    { "id_category": 3, "category_user": "Promotor" },
    { "id_category": 4, "category_user": "SPG" }
  ]
}
```

---

### 5.14 Get Semua Kategori User

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /users/category-alluser
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "data": [
    { "id_category": 1, "category_user": "Manager" },
    { "id_category": 2, "category_user": "Supervisor" },
    { "id_category": 3, "category_user": "Promotor" }
  ]
}
```

---

### 5.15 Get Role Beserta Kategori

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /users/roles-with-categories
Auth    : Required
```

**Response Sukses (200):**
```json
[
  {
    "role_id"   : 1,
    "name_role" : "Admin",
    "categories": [
      { "id_category": 1, "category_user": "Manager" }
    ]
  },
  {
    "role_id"   : 2,
    "name_role" : "Staff",
    "categories": [
      { "id_category": 3, "category_user": "Promotor" },
      { "id_category": 4, "category_user": "SPG" }
    ]
  }
]
```

---

## 6. Kontrak API — Absensi

### 6.1 Submit Absensi

**Dikonsumsi oleh:** Android App, Frontend Web (self-service karyawan)

```
Method       : POST
Endpoint     : /absensi
Auth         : Required
Content-Type : multipart/form-data
```

**Request Body (Form Data):**

| Field | Tipe | Required | Keterangan |
|---|---|---|---|
| `user_id` | number | Ya | ID user yang absen |
| `absen_type_id` | number | Ya | ID tipe absen |
| `retail_id` | number | Ya | ID retail/outlet lokasi |
| `latitude` | number | Ya | Koordinat GPS lintang |
| `longitude` | number | Ya | Koordinat GPS bujur |
| `is_approval` | number | Ya | `0` = dalam radius, `1` = di luar radius (butuh approval) |
| `reason` | string | Tidak | Keterangan tambahan |
| `photo_url` | file | Ya | Foto selfie (image/jpeg) atau video (video/mp4) |

**Validasi Backend:**
- Koordinat GPS harus berada dalam radius yang ditentukan retail (atau `is_approval=1` jika di luar radius)
- Hanya boleh 1 absen per tipe per hari per user
- File foto wajib disertakan

**Response Sukses (200):**
```json
{
  "message"    : "Absen successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "user_id"        : 42,
    "absen_type_id"  : 1,
    "photo_url"      : "/assets/absensi/john_20260506.jpg",
    "absen_time"     : "2026-05-06 08:05:00",
    "status_absen"   : 1,
    "status_approval": 0,
    "potongan"       : 0
  }
}
```

**Keterangan Field Response:**

| Field | Nilai | Keterangan |
|---|---|---|
| `status_absen` | `1` | Ontime |
| `status_absen` | `2` | Terlambat |
| `status_approval` | `0` | Langsung disetujui (dalam radius) |
| `status_approval` | `1` | Menunggu approval supervisor |
| `potongan` | number | Nominal potongan jika terlambat > 15 menit |

---

### 6.2 Get Riwayat Absensi Per User

**Dikonsumsi oleh:** Android App, Frontend Web

```
Method       : POST
Endpoint     : /absensi/history-user/:userId
Auth         : Required
URL Parameter: userId
```

**Request Body:**
```json
{
  "month": "2026-05"
}
```

> `month` bersifat opsional. Jika tidak dikirim, menampilkan data bulan berjalan.

**Response Sukses (200):**
```json
{
  "message"       : "Get History Absensi Successfully!",
  "status"        : "success",
  "status_code"   : "200",
  "total_absensi" : 20,
  "total_ontime"  : 18,
  "total_late"    : 2,
  "data": [
    {
      "absensi_id"     : 101,
      "user_id"        : 42,
      "absen_type_id"  : 1,
      "description"    : "Absen Masuk",
      "status_absen"   : 1,
      "absen_time"     : "2026-05-06T08:05:00.000Z",
      "photo_url"      : "/assets/absensi/john_20260506.jpg",
      "nama_karyawan"  : "John Doe",
      "status_approval": "0"
    }
  ]
}
```

> **Catatan Android:** Format waktu `absen_time` dalam UTC ISO 8601, perlu dikonversi ke timezone lokal saat ditampilkan.

---

### 6.3 Get Riwayat Absensi Semua User

**Dikonsumsi oleh:** Frontend Web

```
Method        : GET
Endpoint      : /absensi/history
Auth          : Required
Query Params  :
  - start_date: YYYY-MM-DD (opsional)
  - end_date  : YYYY-MM-DD (opsional)
```

**Response Sukses (200):**
```json
{
  "message"    : "Get History Absensi Successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "absen_id"  : 101,
      "user_id"   : 42,
      "user_name" : "John Doe",
      "absen_time": "2026-05-06T08:05:00.000Z",
      "status_absen": 1
    }
  ]
}
```

**Penggunaan di Frontend:**
```javascript
// Contoh filter dengan tanggal
GET /absensi/history?start_date=2026-05-01&end_date=2026-05-31
```

---

### 6.4 Get List Absensi untuk Approval

**Dikonsumsi oleh:** Android App

```
Method       : POST
Endpoint     : /absensi/approval/:approvalId
Auth         : Required
URL Parameter: approvalId — user_id supervisor
```

**Request Body:** _(kosong)_

**Response Sukses (200):**
```json
{
  "message"    : "Get List Absensi Successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "absensi_id"     : 102,
      "nama_karyawan"  : "Budi Santoso",
      "absen_time"     : "2026-05-06T09:30:00.000Z",
      "description"    : "Absen Masuk",
      "status_approval": "1",
      "retail_name"    : "Outlet Makassar",
      "reason"         : "Macet di jalan",
      "photo_url"      : "/assets/absensi/budi_20260506.jpg"
    }
  ]
}
```

---

### 6.5 Setujui Absensi

**Dikonsumsi oleh:** Android App

```
Method       : POST
Endpoint     : /absensi/approve-absensi/:absenId
Auth         : Required
URL Parameter: absenId
```

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "An attendance has been approved",
  "status"     : "success",
  "status_code": "200",
  "data": { "asben_id": 102 }
}
```

---

### 6.6 Tolak Absensi

**Dikonsumsi oleh:** Android App

```
Method       : POST
Endpoint     : /absensi/reject-absensi/:absenId
Auth         : Required
URL Parameter: absenId
```

**Request Body:**
```json
{
  "status": "rejected"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "An attendance has been rejected",
  "status"     : "success",
  "status_code": "200",
  "data": { "asben_id": 102 }
}
```

---

### 6.7 Validasi Absensi

**Dikonsumsi oleh:** Frontend Web, Android App

```
Method       : POST
Endpoint     : /absensi/validasi/:absenId
Auth         : Required
URL Parameter: absenId
```

**Request Body:**

**Dari Frontend Web:**
```json
{
  "is_valid": 1
}
```

**Dari Android App:**
```json
{
  "is_valid": "1"
}
```

> `is_valid`: `1` = valid/disetujui, `0` = tidak valid/ditolak

**Response Sukses (200):**
```json
{
  "message"    : "Absensi Berhasil di validasi",
  "status"     : "success",
  "status_code": "200",
  "data": { "absensi_id": 102 }
}
```

---

### 6.8 Total Absensi Per Bulan

**Dikonsumsi oleh:** Android App

```
Method       : POST
Endpoint     : /absensi/total-absensi/:userId
Auth         : Required
URL Parameter: userId
```

**Request Body:**
```json
{
  "month": "2026-05"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Get Total Absensi Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "total_absensi": 20,
      "total_ontime" : 18,
      "total_late"   : 2
    }
  ]
}
```

---

### 6.9 Cek Fee Per User

**Dikonsumsi oleh:** Android App

```
Method       : POST
Endpoint     : /absensi/cekfee-user/:userId
Auth         : Required
URL Parameter: userId
```

**Response Sukses (200):**
```json
{
  "message"    : "Cek Fee Successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "user_id"  : 42,
      "total_fee": 5150000
    }
  ]
}
```

---

## 7. Kontrak API — Manajemen Tipe Absen

### 7.1 Get Semua Tipe Absen

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /absen-management
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Tipe Absen fetched successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "absen_id"     : 1,
      "name"         : "Absen Masuk",
      "description"  : "Absensi masuk kerja pagi",
      "fee"          : 100000,
      "start_time"   : "08:00:00",
      "end_time"     : "09:00:00",
      "kategori_absen": "Reguler",
      "created_at"   : "2025-01-01T00:00:00Z",
      "created_by"   : "admin",
      "groups": [
        {
          "group_absen_id": 1,
          "id_category"  : 3,
          "category_user": "Promotor",
          "created_at"   : "2025-01-01T00:00:00Z",
          "created_by"   : "admin"
        }
      ]
    }
  ]
}
```

---

### 7.2 Get Tipe Absen Berdasarkan Shift User

**Dikonsumsi oleh:** Android App, Frontend Web

```
Method       : POST
Endpoint     : /absen-management/shift-user/:userId
Auth         : Required
URL Parameter: userId
```

**Request Body:** _(kosong)_

**Response Sukses (200):**
```json
{
  "message"      : "Get Detail Absen Type Shift Success",
  "status"       : "success",
  "status_code"  : "200",
  "is_absen_today": 0,
  "data": [
    {
      "absen_id"     : 1,
      "name"         : "Absen Masuk",
      "description"  : "Absensi masuk kerja pagi",
      "fee"          : 100000,
      "retail_id"    : 5,
      "latitude"     : -5.1477,
      "longitude"    : 119.4327,
      "radius"       : 100,
      "start_time"   : "08:00:00",
      "end_time"     : "09:00:00",
      "retail_name"  : "Outlet Makassar",
      "is_absen_today": "0",
      "kategori_absen": "Reguler"
    }
  ]
}
```

> **`is_absen_today`**: `0` = belum absen hari ini, `1` = sudah absen. Digunakan oleh Android untuk menentukan tipe absen apa yang masih bisa dilakukan.

---

### 7.3 Get Detail Tipe Absen

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /absen-management/detail/:absenId
Auth         : Required
URL Parameter: absenId
```

**Response Sukses (200):**
```json
{
  "message"    : "Get Detail Absen Type Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "absen_id"  : 1,
      "name"      : "Absen Masuk",
      "description": "Absensi masuk kerja pagi",
      "fee"       : 100000,
      "start_time": "08:00:00",
      "end_time"  : "09:00:00"
    }
  ]
}
```

---

### 7.4 Buat Tipe Absen

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /absen-management/create
Auth    : Required
```

**Request Body:**
```json
{
  "name"          : "Absen Masuk",
  "description"   : "Absensi masuk kerja pagi",
  "fee"           : 100000,
  "start_time"    : "08:00:00",
  "end_time"      : "09:00:00",
  "kategori_absen": "Reguler",
  "created_at"    : "2026-05-06T10:00:00Z",
  "created_by"    : "admin",
  "group_details" : [
    { "id_category": 3 },
    { "id_category": 4 }
  ]
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Absen Type Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "id"  : 5,
    "name": "Absen Masuk"
  }
}
```

---

### 7.5 Update Tipe Absen

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /absen-management/update/:absenId
Auth         : Required
URL Parameter: absenId
```

**Request Body:**
```json
{
  "name"          : "Absen Masuk (Updated)",
  "description"   : "Deskripsi baru",
  "fee"           : 110000,
  "start_time"    : "07:30:00",
  "end_time"      : "09:00:00",
  "kategori_absen": "Reguler",
  "updated_at"    : "2026-05-06T11:00:00Z",
  "updated_by"    : "admin",
  "group_details" : [
    { "id_category": 3 }
  ]
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Absen Type Updated successfully!",
  "status"     : "success",
  "status_code": "200"
}
```

---

### 7.6 Hapus Tipe Absen

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /absen-management/delete/:absenId
Auth         : Required
URL Parameter: absenId
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T12:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete Absen Type Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

## 8. Kontrak API — Manajemen Retail

### 8.1 Get Semua Retail

**Dikonsumsi oleh:** Frontend Web, Android App (via shift-user)

```
Method  : GET
Endpoint: /retail
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All Retail Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "retail_id" : 5,
      "name"      : "Outlet Makassar",
      "latitude"  : -5.1477,
      "longitude" : 119.4327,
      "radius"    : 100,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

> **`radius`**: Jarak dalam meter. Absensi di luar radius ini akan memerlukan approval supervisor.

---

### 8.2 Get Detail Retail

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /retail/detail/:retailId
Auth         : Required
URL Parameter: retailId
```

**Response Sukses (200):**
```json
{
  "message"    : "Get Detail Retail Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "retail_id": 5,
      "name"     : "Outlet Makassar",
      "latitude" : -5.1477,
      "longitude": 119.4327,
      "radius"   : 100
    }
  ]
}
```

---

### 8.3 Buat Retail

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /retail/create
Auth    : Required
```

**Request Body:**
```json
{
  "name"      : "Outlet Makassar Baru",
  "latitude"  : -5.1477,
  "longitude" : 119.4327,
  "radius"    : 150,
  "created_at": "2026-05-06T10:00:00Z",
  "created_by": "admin"
}
```

**Validasi:** `name` wajib dan minimal 2 karakter.

**Response Sukses (200):**
```json
{
  "message"    : "Retail Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "retail_id": 6,
    "name"     : "Outlet Makassar Baru"
  }
}
```

---

### 8.4 Update Retail

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /retail/update/:retailId
Auth         : Required
URL Parameter: retailId
```

**Request Body:**
```json
{
  "name"      : "Outlet Makassar (Updated)",
  "latitude"  : -5.1500,
  "longitude" : 119.4350,
  "radius"    : 200,
  "updated_at": "2026-05-06T11:00:00Z",
  "updated_by": "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Update retail Success",
  "status"     : "success",
  "status_code": "200",
  "data": { "retailId": 6 }
}
```

---

### 8.5 Hapus Retail

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /retail/delete/:retailId
Auth         : Required
URL Parameter: retailId
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T12:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete retail Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

## 9. Kontrak API — Manajemen Shift

### 9.1 Get Semua Shift

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /shift-management
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Shift fetched successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "shifting_id" : 10,
      "retail_id"   : 5,
      "retail_name" : "Outlet Makassar",
      "start_date"  : "2026-05-01",
      "end_date"    : "2026-05-31",
      "name"        : "Shift Mei 2026",
      "created_at"  : "2026-04-30T10:00:00Z",
      "created_by"  : "admin",
      "detail_user" : [
        { "shift_employe_id": 20, "user_id": 42, "name": "John Doe" },
        { "shift_employe_id": 21, "user_id": 43, "name": "Budi Santoso" }
      ]
    }
  ]
}
```

---

### 9.2 Get Detail Shift

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /shift-management/detail/:shiftingId
Auth         : Required
URL Parameter: shiftingId
```

**Response Sukses (200):**
```json
{
  "message"    : "Get Detail Shifting Type Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "shifting_id": 10,
      "retail_id"  : 5,
      "start_date" : "2026-05-01",
      "end_date"   : "2026-05-31"
    }
  ]
}
```

---

### 9.3 Buat Shift

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /shift-management/create
Auth    : Required
```

**Request Body:**
```json
{
  "retail_id"    : 5,
  "start_date"   : "2026-05-01",
  "end_date"     : "2026-05-31",
  "created_at"   : "2026-04-30T10:00:00Z",
  "created_by"   : "admin",
  "employes_shift": [
    { "user_id": 42 },
    { "user_id": 43 }
  ]
}
```

**Validasi:** `retail_id`, `start_date`, `end_date` wajib diisi.

**Response Sukses (200):**
```json
{
  "message"    : "Shif Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": { "id": 10 }
}
```

---

### 9.4 Update Shift

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /shift-management/update/:shiftingId
Auth         : Required
URL Parameter: shiftingId
```

**Request Body:**
```json
{
  "retail_id"    : 5,
  "start_date"   : "2026-06-01",
  "end_date"     : "2026-06-30",
  "updated_at"   : "2026-05-06T10:00:00Z",
  "updated_by"   : "admin",
  "employes_shift": [
    { "user_id": 42 },
    { "user_id": 44 }
  ]
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Shifting Updated successfully!",
  "status"     : "success",
  "status_code": "200"
}
```

---

### 9.5 Hapus Shift

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /shift-management/delete/:shiftingId
Auth         : Required
URL Parameter: shiftingId
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T12:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete Shift Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

## 10. Kontrak API — Manajemen Off Day & Bonus

### 10.1 Get Semua Off Day

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /management/offday
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "OffDay fetched successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "id_offday"  : 30,
      "reason"     : "Sakit demam",
      "type_off"   : "Sakit",
      "id_type_off": 2,
      "name"       : "John Doe",
      "user_id"    : 42,
      "tanggal"    : "2026-05-05",
      "created_at" : "2026-05-05T10:00:00Z",
      "detail_user": [
        { "off_employe_id": 50, "user_id": 42, "name": "John Doe" }
      ]
    }
  ]
}
```

---

### 10.2 Get Semua Bonus/Punishment

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /management/bonus
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Bonus fetched successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "id_bonus"   : 15,
      "reason"     : "Kinerja terbaik bulan ini",
      "bonus"      : 500000,
      "type_pb"    : "Bonus",
      "id_type_pb" : 1,
      "name"       : "John Doe",
      "user_id"    : 42,
      "month"      : "2026-05",
      "detail_user": [
        { "off_employe_id": 60, "user_id": 42, "name": "John Doe" }
      ]
    }
  ]
}
```

---

### 10.3 Get Tipe Off Day

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /management/type-off
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "data": [
    { "id_type_off": 1, "type_off": "Izin" },
    { "id_type_off": 2, "type_off": "Sakit" },
    { "id_type_off": 3, "type_off": "Cuti" }
  ]
}
```

---

### 10.4 Get Tipe Bonus/Punishment

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /management/type-pb
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "data": [
    { "id_type_pb": 1, "type_pb": "Bonus" },
    { "id_type_pb": 2, "type_pb": "Punishment" }
  ]
}
```

---

### 10.5 Buat Off Day

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /management/addoffday
Auth    : Required
```

**Request Body:**
```json
{
  "tanggal"         : ["2026-05-05", "2026-05-06"],
  "type_off"        : 2,
  "reason"          : "Sakit demam",
  "created_at"      : "2026-05-05T10:00:00Z",
  "created_by"      : "admin",
  "employes_offday" : [
    { "user_id": 42 },
    { "user_id": 43 }
  ]
}
```

> `tanggal` berupa array sehingga satu request bisa mencatat off day untuk beberapa tanggal sekaligus.

**Response Sukses (200):**
```json
{
  "message"    : "OffDay Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "id_offdays": [30, 31]
  }
}
```

---

### 10.6 Update Off Day

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /management/updateoffday/:idOffday
Auth         : Required
URL Parameter: idOffday
```

**Request Body:**
```json
{
  "tanggal"         : "2026-05-07",
  "type_off"        : 1,
  "reason"          : "Izin keluarga",
  "updated_at"      : "2026-05-06T10:00:00Z",
  "updated_by"      : "admin",
  "employes_offday" : [
    { "user_id": 42 }
  ]
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Update OffDay Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

### 10.7 Hapus Off Day

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /management/deleteoffday/:offID
Auth         : Required
URL Parameter: offID
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T12:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete OffDay Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

### 10.8 Buat Bonus/Punishment

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /management/addbonus
Auth    : Required
```

**Request Body:**
```json
{
  "month"          : ["2026-05"],
  "bonus"          : 500000,
  "type_pb"        : 1,
  "reason"         : "Kinerja terbaik bulan ini",
  "created_at"     : "2026-05-06T10:00:00Z",
  "created_by"     : "admin",
  "employes_bonus" : [
    { "user_id": 42 }
  ]
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Bonus/Punishment Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": { "id_bonuss": [15] }
}
```

---

### 10.9 Update Bonus/Punishment

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /management/updatebonus/:bonusID
Auth         : Required
URL Parameter: bonusID
```

**Request Body:** Sama struktur dengan 10.8, tambah field `updated_at`, `updated_by`.

**Response Sukses (200):**
```json
{
  "message"    : "Update Bonus Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

### 10.10 Hapus Bonus/Punishment

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /management/deletebonus/:bonusID
Auth         : Required
URL Parameter: bonusID
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T12:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete Bonus Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

## 11. Kontrak API — Gaji & KPI

### 11.1 Get Gaji Karyawan (Bulan Berjalan)

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /management/fee-karyawan
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "data": [
    {
      "user_id"            : 42,
      "name"               : "John Doe",
      "total_gaji_awal"    : 5000000,
      "potongan_terlambat" : 50000,
      "potongan_kehadiran" : 0,
      "bonus"              : 200000,
      "total_deduction"    : 50000,
      "total_gaji_akhir"   : 5150000
    }
  ]
}
```

---

### 11.2 Get Riwayat Gaji Per Bulan

**Dikonsumsi oleh:** Frontend Web

```
Method       : GET
Endpoint     : /management/fee-karyawan-history
Auth         : Required
Query Params :
  - month: YYYY-MM (opsional, default bulan berjalan)
```

**Response Sukses (200):** Sama dengan 11.1

---

### 11.3 Get Potongan (Deduction)

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /management/potongan
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All Potongan Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    { "id_potongan": 1, "name": "Potongan Terlambat", "value": 25000 },
    { "id_potongan": 2, "name": "Potongan Absen",     "value": 100000 }
  ]
}
```

---

### 11.4 Update Potongan

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /management/update-potongan/:potonganID
Auth         : Required
URL Parameter: potonganID
```

**Request Body:**
```json
{
  "name"      : "Potongan Terlambat",
  "value"     : 30000,
  "updated_at": "2026-05-06T10:00:00Z",
  "updated_by": "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Update Potongan Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

### 11.5 Get Gaji + KPI

**Dikonsumsi oleh:** Frontend Web

```
Method       : GET
Endpoint     : /management/salary-with-kpi
Auth         : Required
Query Params :
  - month  : YYYY-MM (opsional, default bulan berjalan)
  - team_id: number (opsional, filter berdasarkan tim KPI)
```

**Sumber Data:** Menggabungkan data gaji internal + data KPI dari external API.

**Aturan Potongan KPI:** Jika `compliance_persen < 80`, maka dipotong 10% dari gaji akhir.

**Response Sukses (200):**
```json
{
  "message"    : "Get Salary with KPI Success",
  "status"     : "success",
  "status_code": "200",
  "kpi_period" : "2026-05",
  "kpi_team"   : "Tim A",
  "data": [
    {
      "user_id"           : 42,
      "name"              : "John Doe",
      "total_gaji_awal"   : 5000000,
      "total_gaji_akhir"  : 5150000,
      "compliance_persen" : 85.5,
      "performance_label" : "Good",
      "kpi_status_target" : "Achieved",
      "kena_potongan"     : false,
      "potongan_kpi"      : 0,
      "total_gaji_final"  : 5150000
    },
    {
      "user_id"           : 43,
      "name"              : "Budi Santoso",
      "total_gaji_awal"   : 4500000,
      "total_gaji_akhir"  : 4500000,
      "compliance_persen" : 70.0,
      "performance_label" : "Below Target",
      "kpi_status_target" : "Not Achieved",
      "kena_potongan"     : true,
      "potongan_kpi"      : 450000,
      "total_gaji_final"  : 4050000
    }
  ]
}
```

---

### 11.6 Get Tim KPI

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /management/kpi-teams
Auth    : Required
```

**Sumber Data:** External KPI API

**Response Sukses (200):**
```json
{
  "message"    : "Get KPI Teams Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    { "id": 1, "name": "Tim A", "is_active": true },
    { "id": 2, "name": "Tim B", "is_active": true }
  ]
}
```

---

## 12. Kontrak API — Dashboard & Summary

### 12.1 Get Total Absensi Harian

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /summary
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "getTotalDaily": [
    { "label": "Total Absensi", "value": 50 },
    { "label": "Total Ontime",  "value": 45 },
    { "label": "Total Late",    "value": 5  }
  ]
}
```

---

### 12.2 Get Absensi Harian Per Retail

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /summary/daily-retail
Auth    : Required
```

**Response Sukses (200):**
```json
[
  {
    "retail_name"   : "Outlet Makassar",
    "total_absensi" : 20,
    "total_ontime"  : 18,
    "total_late"    : 2
  },
  {
    "retail_name"   : "Outlet Jakarta",
    "total_absensi" : 30,
    "total_ontime"  : 27,
    "total_late"    : 3
  }
]
```

---

### 12.3 Get Total Fee (Bulan Berjalan)

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /summary/total-fee
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "data": [
    { "total_fee": 125000000 }
  ]
}
```

---

### 12.4 Get Total Fee Harian

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /summary/total-feedaily
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "data": [
    { "daily_fee": 4500000 }
  ]
}
```

---

### 12.5 Get Raw Data Absensi (Publik)

**Dikonsumsi oleh:** Sistem eksternal / monitoring

```
Method       : GET
Endpoint     : /raw-absensi
Auth         : Public (tidak perlu token)
Query Params :
  - period: "daily" | "weekly" | "monthly" (default: daily)
  - date  : YYYY-MM-DD (untuk period daily)
  - week  : YYYY-Www (untuk period weekly, contoh: 2026-W19)
  - month : YYYY-MM (untuk period monthly)
```

**Response Sukses (200):**
```json
{
  "message"    : "Get Raw Absensi Successfully!",
  "status"     : "success",
  "status_code": "200",
  "period"     : "daily",
  "label"      : "2026-05-06",
  "total_data" : 50,
  "summary": {
    "ontime"     : 45,
    "telat"      : 3,
    "belum_absen": 2
  },
  "data": [
    {
      "user_id"         : 42,
      "name"            : "John Doe",
      "absen_time"      : "2026-05-06T08:05:00Z",
      "status_kehadiran": "Ontime",
      "photo_url"       : "/assets/absensi/john_20260506.jpg"
    }
  ]
}
```

---

## 13. Kontrak API — Menu & Hak Akses

### 13.1 Get Semua Menu

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /menu
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All Menu Successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "id_menu"  : 1,
      "menu_name": "Dashboard",
      "menu_icon": "dashboard",
      "menu_url" : "/dashboard"
    }
  ]
}
```

---

### 13.2 Get Semua Kategori Menu

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /menu/category
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All Menu Category Successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    { "id_menu_category": 1, "menu_category": "Admin" },
    { "id_menu_category": 2, "menu_category": "Staff" }
  ]
}
```

---

### 13.3 Get Menu Berdasarkan Kategori User

**Dikonsumsi oleh:** Frontend Web (Sidebar navigasi)

```
Method       : GET
Endpoint     : /menu/category/:idCategory
Auth         : Required
URL Parameter: idCategory — id_category dari profil user yang login
```

**Response Sukses (200):**
```json
{
  "message"    : "Get Menu Category Successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "id_menu"  : 1,
      "menu_name": "Dashboard",
      "menu_url" : "/dashboard"
    },
    {
      "id_menu"  : 2,
      "menu_name": "Absensi",
      "menu_url" : "/absensi"
    }
  ]
}
```

> **Digunakan di:** `Sidebar.jsx` untuk merender menu navigasi sesuai hak akses kategori user.

---

### 13.4 Buat Konfigurasi Menu

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /menu/add-config
Auth    : Required
```

**Request Body:**
```json
{
  "id_menu"   : 1,
  "id_category": 3,
  "created_at": "2026-05-06T10:00:00Z",
  "created_by": "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Config Menu Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": { "id": 10 }
}
```

---

### 13.5 Update Konfigurasi Menu

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /menu/update-config/:idMenuConfig
Auth         : Required
URL Parameter: idMenuConfig
```

**Request Body:**
```json
{
  "id_menu"   : 2,
  "id_category": 3,
  "updated_at": "2026-05-06T11:00:00Z",
  "updated_by": "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Update Menu Config Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

### 13.6 Hapus Konfigurasi Menu

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /menu/delete-config/:idMenuConfig
Auth         : Required
URL Parameter: idMenuConfig
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T12:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete Menu Config Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

## 14. Kontrak API — Role & Kategori User

### 14.1 Get Semua Role

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /user-management
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All User Role Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    { "role_id": 1, "name_role": "Admin" },
    { "role_id": 2, "name_role": "Staff" }
  ]
}
```

---

### 14.2 Buat Role

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /user-management/addRoles
Auth    : Required
```

**Request Body:**
```json
{
  "name_role" : "Supervisor",
  "created_at": "2026-05-06T10:00:00Z",
  "created_by": "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Roles Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "role_id"  : 4,
    "name_role": "Supervisor"
  }
}
```

---

### 14.3 Update Role

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /user-management/updateRole/:idRole
Auth         : Required
URL Parameter: idRole
```

**Request Body:**
```json
{
  "name_role" : "Supervisor (Updated)",
  "updated_at": "2026-05-06T11:00:00Z",
  "updated_by": "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Update User Role success",
  "status"     : "success",
  "status_code": "200",
  "data": { "role_id": 4 }
}
```

---

### 14.4 Get Semua Kategori

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /user-management/category
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All User Category Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    { "id_category": 3, "category_user": "Promotor", "role_id": 2 }
  ]
}
```

---

### 14.5 Buat Kategori

**Dikonsumsi oleh:** Frontend Web

```
Method  : POST
Endpoint: /user-management/addCategory
Auth    : Required
```

**Request Body:**
```json
{
  "category_user": "SPG",
  "role_id"      : 2,
  "created_at"   : "2026-05-06T10:00:00Z",
  "created_by"   : "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "User Category Created successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "id_category"  : 5,
    "category_user": "SPG"
  }
}
```

---

### 14.6 Update Kategori

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /user-management/updateCategory/:idCategory
Auth         : Required
URL Parameter: idCategory
```

**Request Body:**
```json
{
  "category_user": "SPG (Updated)",
  "role_id"      : 2,
  "updated_at"   : "2026-05-06T11:00:00Z",
  "updated_by"   : "admin"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Update User Category success",
  "status"     : "success",
  "status_code": "200",
  "data": { "id_category": 5 }
}
```

---

## 15. Kontrak API — File & Laporan

### 15.1 Get Semua File

**Dikonsumsi oleh:** Frontend Web

```
Method  : GET
Endpoint: /file
Auth    : Required
```

**Response Sukses (200):**
```json
{
  "message"    : "Get All Files Success",
  "status"     : "success",
  "status_code": "200",
  "data": [
    {
      "id"        : 1,
      "file_name" : "Laporan Mei 2026",
      "file_url"  : "/assets/laporan/laporan-mei-2026.pdf",
      "created_at": "2026-05-06T10:00:00Z"
    }
  ]
}
```

---

### 15.2 Upload File

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /file/upload
Auth         : Required
Content-Type : multipart/form-data
```

**Request Body (Form Data):**

| Field | Tipe | Required | Keterangan |
|---|---|---|---|
| `file_name` | string | Ya | Nama/label file |
| `description` | string | Tidak | Deskripsi tambahan |
| `created_at` | datetime | Ya | Waktu upload |
| `created_by` | string | Ya | Username uploader |
| `file_url` | file | Ya | File yang diupload (maks. 2GB) |

**Response Sukses (200):**
```json
{
  "message"    : "Upload File Successfully!",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "id"      : 1,
    "file_name": "Laporan Mei 2026",
    "file_url": "/assets/laporan/laporan-mei-2026.pdf"
  }
}
```

---

### 15.3 Update File

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /file/update-file/:idFile
Auth         : Required
Content-Type : multipart/form-data
URL Parameter: idFile
```

**Request Body (Form Data):**

| Field | Tipe | Required | Keterangan |
|---|---|---|---|
| `file_name` | string | Ya | Nama baru |
| `description` | string | Tidak | Deskripsi baru |
| `updated_at` | datetime | Ya | Waktu update |
| `updated_by` | string | Ya | Username updater |
| `file_url` | file | Tidak | File pengganti (opsional) |

**Response Sukses (200):**
```json
{
  "message"    : "Update File success",
  "status"     : "success",
  "status_code": "200",
  "data": {
    "id"      : 1,
    "file_url": "/assets/laporan/laporan-baru.pdf"
  }
}
```

---

### 15.4 Hapus File

**Dikonsumsi oleh:** Frontend Web

```
Method       : POST
Endpoint     : /file/delete-file/:idFile
Auth         : Required
URL Parameter: idFile
```

**Request Body:**
```json
{
  "deleted_by": "admin",
  "deleted_at": "2026-05-06T12:00:00Z"
}
```

**Response Sukses (200):**
```json
{
  "message"    : "Delete File Success",
  "status"     : "success",
  "status_code": "200"
}
```

---

## 16. Kontrak API — Versi Aplikasi

### 16.1 Get Versi Terbaru

**Dikonsumsi oleh:** Android App (saat SplashScreen)

```
Method  : GET
Endpoint: /version
Auth    : Public (tidak perlu token)
```

**Response Sukses (200):**
```json
{
  "latest_version": "1.2.0",
  "force_update"  : 0,
  "update_url"    : "https://play.google.com/store/apps/details?id=com.ocbabsensiapps"
}
```

**Keterangan Field:**

| Field | Nilai | Keterangan |
|---|---|---|
| `force_update` | `0` | Update opsional |
| `force_update` | `1` | User dipaksa update sebelum bisa menggunakan aplikasi |

> **Alur Android:** Endpoint ini dipanggil pertama kali saat `SplashScreenActivity.java` terbuka. Jika versi aplikasi lebih lama dari `latest_version` dan `force_update=1`, user diarahkan ke `update_url`.

---

## 17. Matriks Konsumsi Endpoint per Client

Tabel berikut merangkum endpoint mana yang dikonsumsi oleh masing-masing client:

| Endpoint | Backend | Frontend Web | Android App |
|---|:---:|:---:|:---:|
| `POST /users/login` | ✅ | ❌ | ✅ |
| `POST /users/login-dashboard` | ✅ | ✅ | ❌ |
| `POST /users/logout` | ✅ | ✅ | ✅ |
| `POST /users/profile/:id` | ✅ | ❌ | ✅ |
| `POST /users/profile-web/:id` | ✅ | ✅ | ❌ |
| `GET /users` | ✅ | ✅ | ❌ |
| `GET /users/under-upline/:id` | ✅ | ❌ | ✅ |
| `POST /users/create` | ✅ | ✅ | ❌ |
| `POST /users/update/:id` | ✅ | ✅ | ❌ |
| `POST /users/delete/:id` | ✅ | ✅ | ❌ |
| `POST /users/change-password` | ✅ | ✅ | ✅ |
| `GET /users/roles` | ✅ | ✅ | ❌ |
| `GET /users/category-user/:id` | ✅ | ✅ | ❌ |
| `GET /users/category-alluser` | ✅ | ✅ | ❌ |
| `GET /users/roles-with-categories` | ✅ | ✅ | ❌ |
| `POST /absensi` | ✅ | ✅ | ✅ |
| `POST /absensi/history-user/:id` | ✅ | ❌ | ✅ |
| `GET /absensi/history` | ✅ | ✅ | ❌ |
| `POST /absensi/approval/:id` | ✅ | ❌ | ✅ |
| `POST /absensi/approve-absensi/:id` | ✅ | ❌ | ✅ |
| `POST /absensi/reject-absensi/:id` | ✅ | ❌ | ✅ |
| `POST /absensi/validasi/:id` | ✅ | ✅ | ✅ |
| `POST /absensi/total-absensi/:id` | ✅ | ❌ | ✅ |
| `POST /absensi/cekfee-user/:id` | ✅ | ❌ | ✅ |
| `GET /absen-management` | ✅ | ✅ | ❌ |
| `POST /absen-management/shift-user/:id` | ✅ | ✅ | ✅ |
| `POST /absen-management/create` | ✅ | ✅ | ❌ |
| `POST /absen-management/update/:id` | ✅ | ✅ | ❌ |
| `POST /absen-management/delete/:id` | ✅ | ✅ | ❌ |
| `GET /retail` | ✅ | ✅ | ❌ |
| `POST /retail/create` | ✅ | ✅ | ❌ |
| `POST /retail/update/:id` | ✅ | ✅ | ❌ |
| `POST /retail/delete/:id` | ✅ | ✅ | ❌ |
| `GET /shift-management` | ✅ | ✅ | ❌ |
| `POST /shift-management/create` | ✅ | ✅ | ❌ |
| `POST /shift-management/update/:id` | ✅ | ✅ | ❌ |
| `POST /shift-management/delete/:id` | ✅ | ✅ | ❌ |
| `GET /management/offday` | ✅ | ✅ | ❌ |
| `GET /management/bonus` | ✅ | ✅ | ❌ |
| `GET /management/type-off` | ✅ | ✅ | ❌ |
| `GET /management/type-pb` | ✅ | ✅ | ❌ |
| `POST /management/addoffday` | ✅ | ✅ | ❌ |
| `POST /management/updateoffday/:id` | ✅ | ✅ | ❌ |
| `POST /management/deleteoffday/:id` | ✅ | ✅ | ❌ |
| `POST /management/addbonus` | ✅ | ✅ | ❌ |
| `POST /management/updatebonus/:id` | ✅ | ✅ | ❌ |
| `POST /management/deletebonus/:id` | ✅ | ✅ | ❌ |
| `GET /management/fee-karyawan` | ✅ | ✅ | ❌ |
| `GET /management/fee-karyawan-history` | ✅ | ✅ | ❌ |
| `GET /management/potongan` | ✅ | ✅ | ❌ |
| `POST /management/update-potongan/:id` | ✅ | ✅ | ❌ |
| `GET /management/salary-with-kpi` | ✅ | ✅ | ❌ |
| `GET /management/kpi-teams` | ✅ | ✅ | ❌ |
| `GET /summary` | ✅ | ✅ | ❌ |
| `GET /summary/daily-retail` | ✅ | ✅ | ❌ |
| `GET /summary/total-fee` | ✅ | ✅ | ❌ |
| `GET /summary/total-feedaily` | ✅ | ✅ | ❌ |
| `GET /raw-absensi` | ✅ | ❌ | ❌ |
| `GET /menu` | ✅ | ✅ | ❌ |
| `GET /menu/category` | ✅ | ✅ | ❌ |
| `GET /menu/category/:id` | ✅ | ✅ | ❌ |
| `POST /menu/add-config` | ✅ | ✅ | ❌ |
| `POST /menu/update-config/:id` | ✅ | ✅ | ❌ |
| `POST /menu/delete-config/:id` | ✅ | ✅ | ❌ |
| `GET /user-management` | ✅ | ✅ | ❌ |
| `POST /user-management/addRoles` | ✅ | ✅ | ❌ |
| `POST /user-management/updateRole/:id` | ✅ | ✅ | ❌ |
| `GET /user-management/category` | ✅ | ✅ | ❌ |
| `POST /user-management/addCategory` | ✅ | ✅ | ❌ |
| `POST /user-management/updateCategory/:id` | ✅ | ✅ | ❌ |
| `GET /file` | ✅ | ✅ | ❌ |
| `POST /file/upload` | ✅ | ✅ | ❌ |
| `POST /file/update-file/:id` | ✅ | ✅ | ❌ |
| `POST /file/delete-file/:id` | ✅ | ✅ | ❌ |
| `GET /version` | ✅ | ❌ | ✅ |

---

## 18. Kode Error & Penanganannya

### Penanganan di Frontend Web

```javascript
try {
  const response = await axios.post('/api/...', payload, { headers });
  // handle success
} catch (error) {
  const message = error.response?.data?.message || error.message;
  Swal.fire({ icon: 'error', title: 'Error', text: message });
}
```

### Penanganan di Android App

```java
// Volley error listener
Response.ErrorListener errorListener = error -> {
  if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
    // Clear token dan arahkan ke LoginActivity
    SharedPreferences prefs = getSharedPreferences("AppPrefs", MODE_PRIVATE);
    prefs.edit().clear().apply();
    startActivity(new Intent(this, LoginActivity.class));
  } else {
    // Tampilkan Toast dengan pesan error
    String errorMessage = new String(error.networkResponse.data);
    Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show();
  }
};
```

### Tabel Skenario Error Umum

| Skenario | HTTP Status | Pesan | Penanganan Client |
|---|---|---|---|
| Token tidak dikirim | 401 | Unauthorized | Redirect ke halaman login |
| Token kedaluwarsa/tidak valid | 401 | Token expired | Redirect ke halaman login |
| Token sudah logout | 403 | Token invalidated | Redirect ke halaman login |
| IMEI tidak terdaftar | 400 | IMEI not registered | Tampilkan pesan error |
| IMEI dipakai user lain | 400 | IMEI already registered | Tampilkan pesan error |
| Data tidak ditemukan | 404 | Not found | Tampilkan pesan error |
| Duplikasi data (username) | 400 | Username already exists | Tampilkan pesan validasi |
| GPS di luar radius | - | Tidak error; `is_approval=1` | Submit dengan flag approval |
| Server error | 500 | Internal server error | Tampilkan pesan generik |

---

## 19. Catatan Integrasi Khusus

### 19.1 Audit Trail

Semua operasi CRUD di sistem ini mengimplementasikan **audit trail**. Setiap record mengandung field berikut:

| Field | Tipe | Keterangan |
|---|---|---|
| `created_at` | datetime | Waktu pembuatan (ISO 8601) |
| `created_by` | string | Username pembuat |
| `updated_at` | datetime | Waktu terakhir diubah |
| `updated_by` | string | Username yang mengubah |
| `deleted_at` | datetime | Waktu soft-delete |
| `deleted_by` | string | Username yang menghapus |

> **Penting:** Client wajib mengirim field audit trail ini pada setiap operasi create/update/delete.

---

### 19.2 Soft Delete

Semua operasi "hapus" di sistem ini merupakan **soft delete** — data tidak benar-benar dihapus dari database, melainkan hanya ditandai dengan `deleted_at` dan `deleted_by`. Data yang sudah di-soft-delete tidak akan muncul di response list.

---

### 19.3 Validasi GPS (Geofencing)

Saat karyawan melakukan absensi via Android, alur validasi GPS adalah sebagai berikut:

```
1. Android mengambil koordinat GPS device
2. Android menghitung jarak ke koordinat retail (dari response shift-user)
3. Jika dalam radius → kirim is_approval=0
4. Jika di luar radius → kirim is_approval=1 + alasan (reason)
5. Backend memvalidasi ulang koordinat
6. Absensi dengan is_approval=1 masuk ke antrian approval supervisor
```

---

### 19.4 Upload File

#### Foto Profil User
- **Field:** `photo_url`
- **Format:** `image/jpeg`, `image/png`, `image/jpg`
- **Ukuran maks.:** tidak ditentukan (dikonfigurasi di backend via multer)
- **Disimpan di:** `/assets/profile/`

#### Foto/Video Absensi
- **Field:** `photo_url`
- **Format:** `image/jpeg`, `video/mp4`
- **Disimpan di:** `/assets/absensi/`

#### File Laporan
- **Field:** `file_url`
- **Format:** Semua format (PDF, Excel, dll.)
- **Ukuran maks.:** 2GB
- **Disimpan di:** `/assets/laporan/`

---

### 19.5 Format Waktu & Timezone

| Komponen | Timezone | Format |
|---|---|---|
| Backend (absensi) | Asia/Makassar (WITA) | `YYYY-MM-DD HH:mm:ss` |
| Backend (lainnya) | Asia/Jakarta (WIB) | `YYYY-MM-DD HH:mm:ss` |
| Response API | UTC | ISO 8601 (`YYYY-MM-DDTHH:mm:ss.000Z`) |
| Android (tampilan) | Device timezone | Dikonversi secara lokal |
| Frontend Web (input) | UTC | ISO 8601 |

> **Perhatian:** Pastikan client selalu mengirim timestamp dalam format ISO 8601 UTC. Backend akan mengkonversi ke timezone yang sesuai.

---

### 19.6 Integrasi KPI Eksternal

Endpoint `/management/salary-with-kpi` dan `/management/kpi-teams` memanggil **external KPI API**. Konfigurasi:

```
KPI_API_URL      : (dikonfigurasi di environment backend)
KPI_SECRET_TOKEN : Bearer token untuk KPI API
```

**Aturan Bisnis KPI:**
- Jika `compliance_persen < 80%` → potongan gaji **10%** dari `total_gaji_akhir`
- Jika KPI API tidak tersedia → field KPI bernilai `null`, gaji tetap dihitung tanpa KPI

---

### 19.7 Password Default User Baru

Saat admin membuat user baru via `POST /users/create`, password otomatis di-set oleh backend menjadi **`"Ocb2024"`**. User disarankan untuk mengganti password segera setelah login pertama kali via endpoint `POST /users/change-password`.

---

### 19.8 Perbedaan Response Absensi: Mobile vs Web

Beberapa field dalam response absensi memiliki nama atau tipe yang sedikit berbeda antara konsumsi mobile dan web:

| Field | Android App | Frontend Web | Keterangan |
|---|---|---|---|
| `is_valid` | `"1"` atau `"0"` (string) | `1` atau `0` (number) | Backend konsisten mengembalikan string, tapi pastikan parsing aman |
| `absen_time` | UTC ISO 8601 | UTC ISO 8601 | Keduanya perlu konversi ke timezone lokal untuk tampilan |
| `status_approval` | string | number | Pastikan comparison menggunakan loose equality atau konversi eksplisit |

---

*Dokumen ini dihasilkan berdasarkan analisis kode sumber ketiga komponen sistem OCB Absen pada 2026-05-06. Perubahan pada kode sumber harus diikuti dengan pembaruan dokumen ini.*
