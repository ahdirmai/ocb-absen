# API – Top Rekap Bulanan (Tercepat & Terlambat)

Endpoint untuk mengambil **Top 10** karyawan berdasarkan rekap absensi masuk dalam satu bulan:

- **Top Tercepat** — paling banyak absen **tepat waktu** (ontime).
- **Top Terlambat** — paling banyak absen **terlambat** (telat).

Default menghitung **bulan berjalan**. Bisa difilter per bulan via query param.

**Tidak memerlukan autentikasi.**

---

## Endpoint

```
GET /api/summary/top-ontime
GET /api/summary/top-late
```

| Endpoint | Keterangan |
|----------|------------|
| `/api/summary/top-ontime` | Top 10 karyawan paling banyak tepat waktu |
| `/api/summary/top-late` | Top 10 karyawan paling banyak terlambat |

---

## Query Parameters

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `bulan` | string | Tidak | Bulan rekap. Format: `MM-YYYY` (contoh: `06-2026`). Default: bulan berjalan. |

> Format `bulan` divalidasi dengan pola `MM-YYYY` (bulan `01`–`12`). Format salah menghasilkan `400`.

---

## Contoh Request

### 1. Bulan berjalan (default)
```
GET /api/summary/top-ontime
GET /api/summary/top-late
```

### 2. Bulan tertentu
```
GET /api/summary/top-ontime?bulan=06-2026
GET /api/summary/top-late?bulan=06-2026
```

---

## Response

### Success `200`

```json
{
  "data": [
    {
      "ranking": 1,
      "nama": "FUJI RAMADANI",
      "retail": "GUDANG BJMS",
      "jumlah": 32
    },
    {
      "ranking": 2,
      "nama": "M RAHMADHANI",
      "retail": "GUDANG BJMS",
      "jumlah": 31
    }
  ]
}
```

### Error `400` – Format bulan tidak valid

```json
{
  "message": "Format bulan tidak valid. Gunakan MM-YYYY",
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
| `data[].ranking` | number | Peringkat, mulai dari `1` (jumlah terbanyak) |
| `data[].nama` | string | Nama karyawan |
| `data[].retail` | string | Nama retail tempat absen |
| `data[].jumlah` | number | Jumlah absen tepat waktu (top-ontime) atau terlambat (top-late) dalam bulan tersebut |

---

## Catatan Implementasi

- Status absen ditentukan dari kolom `absensi.status_absen`: `'1'` = ontime, `'2'` = telat.
- **Hanya absen masuk** yang dihitung — difilter dengan `tipe_absen.description LIKE 'Absen Masuk%'`. Tipe keluar/pulang tidak diikutsertakan.
- Filter bulan default menggunakan `MONTH(CURDATE())` + `YEAR(CURDATE())`. Jika `bulan` diisi, `MM` dipetakan ke `MONTH()` dan `YYYY` ke `YEAR()`.
- Data dikelompokkan per karyawan (`GROUP BY user_id`), diurutkan `jumlah DESC`, lalu nama `ASC` sebagai tie-breaker, dibatasi `LIMIT 10`.
- Query menggunakan parameterized statement (aman dari SQL injection).

---

## File Terkait

| Jenis | Path |
|-------|------|
| Route | `src/routes/summary.js` |
| Controller | `src/controller/summary.controller.js` |
| Model | `src/models/summary.model.js` |
| Registrasi | `src/index.js` |
