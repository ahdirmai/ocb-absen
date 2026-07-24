# Deploy: Fitur Sesi Absen (absensi_sesi) ke Server

Panduan menjalankan migrasi sesi absen di server produksi.
Desain lengkap: `docs/absensi-sesi-plan.md`.

## Prasyarat
- Node + `npm install` sudah jalan di server.
- `.env` prod terisi: `DB_HOST`, `DB_PORT` (opsional, default 3306), `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`.
- `mysqldump` + `mysql` client tersedia:
  - **MySQL native di server** → `mysqldump` di PATH. Script backup auto-detect.
  - **MySQL dalam docker** → set `DB_CONTAINER=<nama-container>` di `.env`, atau `BACKUP_MODE=docker`.

## Sifat migrasi
- **Forward-only**: absen baru langsung isi sesi setelah app restart. Data lama dibaca dual-path (fallback), tak perlu backfill agar app jalan.
- **Zero-downtime**: `CREATE TABLE` non-blocking; backfill jalan terpisah; forward-only tak butuh app mati.
- **Aman diulang**: DDL `IF NOT EXISTS`, backfill idempoten (skip absensi yang sudah punya sesi).

---

## Urutan deploy (JANGAN dibalik)

### 1. Backup DB prod — WAJIB
```bash
npm run backup-db
# pastikan: [ok] backup selesai ... (size > 0)
# hasil di backups/ (sudah di .gitignore)
```
Paksa mode bila perlu: `BACKUP_MODE=native npm run backup-db` atau `BACKUP_MODE=docker`.

### 2. Pull code baru (belum restart app)
Pastikan file berikut ada:
- `docs/absensi-sesi.sql` (DDL)
- `src/models/absensiSesi.model.js`
- perubahan di `absensi.controller.js`, `absensi.model.js`, FE `AbsenKaryawan.jsx`
- `scripts/backup-db.js`, `scripts/backfill-sesi.js`

### 3. Jalankan DDL (buat tabel absensi_sesi)
**Native:**
```bash
MYSQL_PWD="$DB_PASSWORD" mysql -h"$DB_HOST" -u"$DB_USERNAME" "$DB_NAME" < docs/absensi-sesi.sql
```
**Docker:**
```bash
docker exec -i -e MYSQL_PWD="$DB_PASSWORD" <container> mysql -u"$DB_USERNAME" "$DB_NAME" < docs/absensi-sesi.sql
```
Verifikasi tabel + FK terbentuk:
```sql
SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_NAME='absensi_sesi' AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### 4. Build FE + restart app
```bash
# FE
cd <fe-dir> && npm run build
# BE (sesuai setup: pm2 / systemd / dll)
pm2 restart <app>   # contoh
```
Setelah ini forward-only aktif: absen masuk→buka sesi, keluar→tutup sesi.

### 5. Backfill histori (kapan saja setelah step 4, tak blok app)
```bash
node scripts/backfill-sesi.js            # DRY-RUN dulu — cek angka
APPLY=1 node scripts/backfill-sesi.js    # commit
```
- Lambat (~65k grup, resolveJadwal serial → beberapa menit). Jalankan di `screen`/`nohup` bila SSH bisa putus:
  ```bash
  nohup env APPLY=1 node scripts/backfill-sesi.js > backfill.log 2>&1 &
  ```
- Idempoten: bila terputus, re-run aman (skip yang sudah jadi sesi).

---

## Verifikasi pasca-deploy
```sql
SELECT status, COUNT(*) FROM absensi_sesi GROUP BY status;
-- closed = sesi utuh, incomplete = orphan/sepihak

-- closed wajib punya masuk+keluar (harus 0):
SELECT COUNT(*) FROM absensi_sesi
WHERE status='closed' AND (masuk_absensi_id IS NULL OR keluar_absensi_id IS NULL);

-- integritas FK (harus 0):
SELECT COUNT(*) FROM absensi_sesi s
LEFT JOIN absensi a ON a.absensi_id=s.masuk_absensi_id
WHERE s.masuk_absensi_id IS NOT NULL AND a.absensi_id IS NULL;
```
Smoke test app: absen masuk → cek sesi `open`; absen keluar → sesi `closed`; flow lembur (regular komplit → mulai lembur → masuk → keluar).

---

## Rollback
Forward-only → `absensi` asli TIDAK tersentuh, aman.
- **Buang sesi saja**: `DROP TABLE absensi_sesi;` lalu revert code (app kembali baca `absensi` via LIKE, dual-path fallback sudah handle).
- **Restore penuh**: dari dump step 1:
  ```bash
  MYSQL_PWD="$DB_PASSWORD" mysql -h"$DB_HOST" -u"$DB_USERNAME" "$DB_NAME" < backups/<file>.sql
  ```
