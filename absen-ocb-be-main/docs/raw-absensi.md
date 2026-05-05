# API – Raw Data Absensi

Endpoint untuk mengambil raw data absensi seluruh karyawan aktif.  
Karyawan yang **belum absen** pada periode yang diminta tetap ditampilkan dengan `status_kehadiran = "Belum Absen"`.

**Tidak memerlukan autentikasi.**

---

## Endpoint

```
GET /api/raw-absensi
```

---

## Query Parameters

| Parameter | Tipe   | Wajib | Deskripsi |
|-----------|--------|-------|-----------|
| `period`  | string | Tidak | Periode laporan: `daily` (default), `weekly`, `monthly` |
| `date`    | string | Tidak | Tanggal spesifik untuk `period=daily`. Format: `YYYY-MM-DD`. Default: hari ini. |
| `week`    | string | Tidak | Minggu ISO untuk `period=weekly`. Format: `YYYY-Www` (contoh: `2025-W18`). Default: minggu ini. |
| `month`   | string | Tidak | Bulan untuk `period=monthly`. Format: `YYYY-MM` (contoh: `2025-04`). Default: bulan ini. |

> Parameter `date`, `week`, dan `month` hanya diproses sesuai `period` yang aktif.  
> Rentang mingguan menggunakan standar ISO 8601 (Senin – Minggu).  
> Rentang bulanan adalah hari pertama hingga hari terakhir bulan kalender (bukan 30 hari bergulir).

---

## Contoh Request

### 1. Harian – hari ini (default)
```
GET /api/raw-absensi
```

### 2. Harian – tanggal tertentu
```
GET /api/raw-absensi?period=daily&date=2025-04-28
```

### 3. Mingguan – minggu ini
```
GET /api/raw-absensi?period=weekly
```

### 4. Mingguan – minggu tertentu
```
GET /api/raw-absensi?period=weekly&week=2025-W18
```

### 5. Bulanan – bulan ini
```
GET /api/raw-absensi?period=monthly
```

### 6. Bulanan – bulan tertentu
```
GET /api/raw-absensi?period=monthly&month=2025-04
```

---

## Response

### Success `200`

```json
{
  "message": "Get Raw Absensi Successfully!",
  "status": "success",
  "status_code": "200",
  "period": "daily",
  "label": "Harian – 2025-04-28",
  "total_data": 3,
  "summary": {
    "ontime": 1,
    "telat": 1,
    "belum_absen": 1
  },
  "data": [
    {
      "user_id": 5,
      "nama": "Budi Santoso",
      "tipe_absen": "Shift Pagi",
      "jam_masuk_seharusnya": "08:00:00",
      "jam_absen": "2025-04-28T08:10:00.000Z",
      "status_kehadiran": "Ontime",
      "absensi_id": 101,
      "absen_type_id": 2,
      "retail_id": 1,
      "retail_name": "Toko Pusat",
      "reason": null,
      "photo_url": "/assets/1714294200_selfie.jpg",
      "is_valid": 1
    },
    {
      "user_id": 7,
      "nama": "Dewi Rahayu",
      "tipe_absen": "Shift Pagi",
      "jam_masuk_seharusnya": "08:00:00",
      "jam_absen": "2025-04-28T09:05:00.000Z",
      "status_kehadiran": "Telat",
      "absensi_id": 102,
      "absen_type_id": 2,
      "retail_id": 1,
      "retail_name": "Toko Pusat",
      "reason": "Macet",
      "photo_url": "/assets/1714297500_selfie.jpg",
      "is_valid": 0
    },
    {
      "user_id": 9,
      "nama": "Eko Prasetyo",
      "tipe_absen": null,
      "jam_masuk_seharusnya": null,
      "jam_absen": null,
      "status_kehadiran": "Belum Absen",
      "absensi_id": null,
      "absen_type_id": null,
      "retail_id": null,
      "retail_name": null,
      "reason": null,
      "photo_url": null,
      "is_valid": null
    }
  ]
}
```

### Error `400` – Parameter tidak valid

```json
{
  "message": "Format parameter 'date' tidak valid. Gunakan format YYYY-MM-DD (contoh: 2025-04-28).",
  "status": "failed",
  "status_code": "400"
}
```

### Error `500` – Internal Server Error

```json
{
  "message": "Internal Server Error",
  "status": "failed",
  "status_code": "500",
  "serverMessage": "..."
}
```

---

## Penjelasan Field Response

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `period` | string | Periode yang digunakan (`daily`, `weekly`, `monthly`) |
| `label` | string | Deskripsi human-readable dari rentang waktu |
| `total_data` | number | Jumlah baris data yang dikembalikan |
| `summary.ontime` | number | Jumlah karyawan yang absen tepat waktu |
| `summary.telat` | number | Jumlah karyawan yang absen terlambat |
| `summary.belum_absen` | number | Jumlah karyawan yang belum absen |
| `data[].user_id` | number | ID karyawan |
| `data[].nama` | string | Nama karyawan |
| `data[].tipe_absen` | string\|null | Nama tipe/shift absen (null jika belum absen) |
| `data[].jam_masuk_seharusnya` | string\|null | Jam masuk sesuai konfigurasi tipe absen (`HH:mm:ss`) |
| `data[].jam_absen` | datetime\|null | Waktu aktual saat karyawan melakukan absen |
| `data[].status_kehadiran` | string | `"Ontime"`, `"Telat"`, atau `"Belum Absen"` |
| `data[].absensi_id` | number\|null | ID record absensi (null jika belum absen) |
| `data[].retail_id` | number\|null | ID retail tempat absen |
| `data[].retail_name` | string\|null | Nama retail |
| `data[].reason` | string\|null | Alasan/keterangan absen |
| `data[].photo_url` | string\|null | URL foto selfie absen |
| `data[].is_valid` | number\|null | Status validasi: `0` belum divalidasi, `1` sudah valid |

---

## Catatan Implementasi

- Timezone yang digunakan: **Asia/Makassar (WITA, UTC+8)**.
- Karyawan yang dilibatkan: hanya user dengan `is_deleted = 0` dan `enabled = 1`.
- Jika satu karyawan melakukan lebih dari satu absensi dalam periode yang sama, seluruh record ditampilkan (masing-masing baris terpisah).
- Rentang mingguan mengikuti **ISO Week** (Senin = hari pertama).

---

## File Terkait

| Jenis | Path |
|-------|------|
| Route | `src/routes/rawAbsensi.js` |
| Controller | `src/controller/rawAbsensi.controller.js` |
| Model | `src/models/rawAbsensi.model.js` |
| Registrasi | `src/index.js` |
