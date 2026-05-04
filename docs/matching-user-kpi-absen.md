# Cara Match User KPI dan Absen

Dokumen ini menjelaskan bagaimana sistem menghubungkan data karyawan dari database absensi (`absen_ocb`) dengan data KPI dari database terpisah (`kpi_ocb`).

---

## Masalah Utama

Kedua database tidak memiliki foreign key bersama. Database absensi menyimpan data karyawan dengan `user_id`, sedangkan database KPI menyimpan data dalam format JSON per laporan bulanan tanpa referensi `user_id` yang konsisten. Karena itu, matching dilakukan berdasarkan **nama yang dinormalisasi**.

---

## Alur Matching

```
Request: GET /api/payroll?month=2026-04
         │
         ▼
┌─────────────────────────────────────────────┐
│  Parallel fetch (3 query sekaligus)          │
│                                             │
│  1. fetchEmployees()   → absen_ocb          │
│     Daftar karyawan aktif/soft-deleted       │
│     yang punya data di bulan tersebut        │
│                                             │
│  2. fetchMonthlySalary() → absen_ocb        │
│     Hitung gaji, potongan, bonus per user    │
│                                             │
│  3. fetchKpiRecap()    → kpi_ocb            │
│     Ambil recap KPI bulan tersebut           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Bangun KPI Map                              │
│  mergeKpiRows(rows) → Map<normalizedKey, kpi>│
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Loop tiap karyawan                          │
│  buildNameKeys(employee.name)                │
│    → cari tiap key di KPI Map                │
│    → pakai hasil pertama yang cocok          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Hitung payroll per karyawan                 │
│  buildPayrollRecord(employee, salary, kpi)   │
└─────────────────────────────────────────────┘
```

---

## Step 1: Ambil Data KPI

File: `src/services/payrollService.js` — fungsi `fetchKpiRecap()`

```sql
SELECT id, report_month, recap_per_user
FROM monthly_task_reports
WHERE report_month = :reportMonth
```

- `reportMonth` diformat sebagai `YYYY-MM-01` (selalu tanggal 1)
- `recap_per_user` adalah kolom JSON berisi array data KPI per karyawan

Contoh isi `recap_per_user`:
```json
[
  {
    "name": "Muhammad Saifuddin",
    "position": "Developer",
    "user_id": 17,
    "total_score": 95,
    "skor_maksimal": 100,
    "jumlah_task": 12
  }
]
```

---

## Step 2: Bangun KPI Map

File: `src/services/payrollService.js` — fungsi `mergeKpiRows()`

Setelah data KPI diambil, sistem membangun sebuah `Map` dengan **normalized name sebagai key**.

Untuk setiap entry di `recap_per_user`:
1. Panggil `buildNameKeys(entry.name)` → hasilkan beberapa variant key
2. Simpan semua key ke Map mengarah ke objek KPI yang sama

Jika ada beberapa laporan di bulan yang sama dengan nama yang sama, skornya **dijumlahkan** (bukan diambil salah satu).

---

## Step 3: Normalisasi Nama

File: `src/utils/normalize.js` — fungsi `buildNameKeys()`

Ini adalah inti dari sistem matching. Fungsi ini menghasilkan **beberapa variant key** dari satu nama, sehingga perbedaan penulisan nama antar sistem bisa ditoleransi.

### Proses Normalisasi

1. **Tokenisasi nama** — pisahkan kata per kata, hapus tanda baca, uppercase semua
2. **Gabungkan semua token** → key pertama (full name)
3. **Jika lebih dari 1 token**:
   - Gabungkan tanpa token pertama → key kedua (nama belakang saja)
   - Buat 4 variant abbreviasi kata pertama (1, 2, 3, 4 karakter) + nama belakang

### Contoh

Input: `"Muhammad Saifuddin"`

Tokenisasi: `["MUHAMMAD", "SAIFUDDIN"]`

Key yang dihasilkan:
| Key | Keterangan |
|-----|------------|
| `MUHAMMADSAIFUDDIN` | Full name |
| `SAIFUDDIN` | Nama belakang saja |
| `MSAIFUDDIN` | Singkatan 1 karakter |
| `MUSAIFUDDIN` | Singkatan 2 karakter |
| `MUHSAIFUDDIN` | Singkatan 3 karakter |
| `MUHAMSAIFUDDIN` | Singkatan 4 karakter |

Jika di database KPI nama tercatat sebagai `"muh saifuddin"`, maka:
- `buildNameKeys("muh saifuddin")` menghasilkan key `MUHSAIFUDDIN`
- Key tersebut cocok dengan salah satu key dari karyawan absen

**Match berhasil.**

### Contoh lain

| Nama di absen_ocb | Nama di kpi_ocb | Match? |
|---|---|---|
| `Muhammad Saifuddin` | `muh saifuddin` | ✅ via `MUHSAIFUDDIN` |
| `Muhammad Hilman` | `Muh Hilman` | ✅ via `MUHILMAN` |
| `Ahmad-Fauzi` | `Ahmad Fauzi` | ✅ tanda baca dihapus |
| `BUDI SANTOSO` | `budi santoso` | ✅ case-insensitive |
| `Budi` | `Fauzi` | ❌ tidak ada key yang cocok |

---

## Step 4: Matching per Karyawan

File: `src/services/payrollService.js` — dalam fungsi `getPayrollSummary()`

```javascript
const kpiRecap = buildNameKeys(employee.name)
  .map((key) => kpiMap.get(key))
  .find(Boolean) || null;
```

Untuk setiap karyawan dari absensi:
1. Generate semua variant key dari nama karyawan
2. Cek satu per satu ke KPI Map
3. Gunakan hasil pertama yang ditemukan
4. Jika tidak ada yang cocok → `kpiRecap = null`

---

## Step 5: Dampak Matching ke Kalkulasi Gaji

File: `src/services/payrollService.js` — fungsi `buildPayrollRecord()`

### Jika KPI Match

```
kpiRatio = total_score / skor_maksimal

Jika kpiRatio >= KPI_PASS_THRESHOLD (default: 1.0):
  → kpi_deduction = 0          (lolos threshold)

Jika kpiRatio < KPI_PASS_THRESHOLD:
  → kpi_deduction = salary_before_kpi × 10%   (dipotong 10%)
```

### Jika KPI Tidak Match

```
kpi_deduction = 0    (tidak ada potongan KPI)
kpi.matched = false
```

### Formula Gaji Final

```
salary_before_kpi = gross_salary - late_deduction - absence_deduction
kpi_deduction     = (matched && !meets_threshold) ? salary_before_kpi × 0.1 : 0
final_salary      = MAX(salary_before_kpi - kpi_deduction + bonus, 0)
```

---

## Contoh Output API

```json
{
  "employee": {
    "user_id": 17,
    "name": "Muhammad Saifuddin"
  },
  "payroll": {
    "gross_salary": 5000000,
    "late_deduction": 50000,
    "absence_deduction": 0,
    "bonus": 200000,
    "salary_before_kpi": 4950000,
    "kpi_deduction": 495000,
    "final_salary": 4655000
  },
  "kpi": {
    "matched": true,
    "source_name": "muh saifuddin",
    "position": "Developer",
    "total_score": 90,
    "max_score": 100,
    "total_tasks": 12,
    "ratio": 0.9,
    "threshold": 1.0,
    "meets_threshold": false
  }
}
```

---

## Konfigurasi

| Env Variable | Default | Keterangan |
|---|---|---|
| `KPI_PASS_THRESHOLD` | `1.0` | Rasio minimum agar tidak kena potongan KPI |

---

## Troubleshooting: KPI Tidak Match

Jika `kpi.matched = false` padahal karyawan punya data KPI, kemungkinan penyebabnya:

1. **Nama berbeda terlalu jauh** — selisih lebih dari 4 karakter di kata pertama, atau kata belakang berbeda
2. **Laporan KPI tidak ada** — tidak ada baris di `monthly_task_reports` untuk bulan tersebut
3. **Format `report_month` salah** — pastikan kolom berisi format `YYYY-MM-01`
4. **`recap_per_user` null atau kosong** — data KPI ada tapi field kosong

Cara debug: panggil endpoint dengan satu user:

```bash
curl "http://localhost:3030/api/payroll/17?month=2026-04"
```

Cek field `kpi.matched` dan `kpi.source_name` di response.

---

## File yang Terlibat

| File | Peran |
|---|---|
| `src/utils/normalize.js` | Normalisasi nama, generate variant key |
| `src/services/payrollService.js` | Fetch data, matching, kalkulasi gaji |
| `test/normalize.test.js` | Test normalisasi nama |
| `test/payrollService.test.js` | Test matching KPI dan kalkulasi potongan |
