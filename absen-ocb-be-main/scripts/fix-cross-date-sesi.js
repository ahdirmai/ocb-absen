require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dbpool = require("../src/config/database");

// ============================================================================
// FIX cross-date sesi pecah — jalankan sekali di server.
//
// Akar masalah: tipe absen MASUK cross-date (SORE 9 JAM, SUBUH 9 JAM) ter-edit
// hingga `kategori_absen` NULL. openSesi simpan sesi kategori NULL; absen KELUAR
// (findOpenSesi cari kategori tipe keluar, mis. 'Sore'/'Malam') gagal match →
// bikin sesi 'incomplete' baru (masuk NULL) alih-alih menutup sesi masuk. 1 shift
// terpecah 2 incomplete.
//
// Dua langkah, 1 transaksi masing-masing, idempotent:
//   STEP 1  Restore tipe_absen.kategori_absen MASUK (NULL) = kategori KELUAR
//           pasangan (by name). Cegah bug berulang untuk absen BARU.
//   STEP 2  Pasangkan ulang sesi incomplete keluar-orphan lama ke absen masuknya
//           (match user + shift name + is_lembur + window jam, greedy dedup).
//             - kasus A: masuk punya sesi masuk-only → tutup masuk-sesi + hapus orphan
//             - kasus B: masuk tanpa sesi           → isi masuk ke orphan-sesi (closed)
//           Orphan tak berpasangan dibiarkan incomplete.
//
// DRY-RUN default. Commit: APPLY=1 (atau --apply). WAJIB backup dulu.
//   npm run backup-db
//   node scripts/fix-cross-date-sesi.js --since=2026-07-25            # dry-run
//   APPLY=1 node scripts/fix-cross-date-sesi.js --since=2026-07-25    # eksekusi
// STEP 1 (restore kategori) selalu jalan; STEP 2 (fix sesi) butuh --since/--date.
//
// Opsi STEP 2 (WAJIB salah satu — cegah sentuh orphan historis non-bug):
//   --since=YYYY-MM-DD  proses orphan dgn keluar_time >= tanggal ini (rekomendasi:
//                       tanggal saat kategori tipe masuk mulai ter-null)
//   --date=YYYY-MM-DD   batasi presisi ke satu tanggal sesi (absensi_sesi.tanggal)
//   --window=20         jam mundur cari masuk dari keluar (default 20)
// Tanpa --since/--date → STEP 2 dilewati (STEP 1 tetap jalan, itu akar aman).
// ============================================================================

const argv = process.argv.slice(2);
const getArg = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const APPLY = process.env.APPLY === "1" || argv.includes("--apply");
const TARGET_DATE = getArg("date", null); // filter absensi_sesi.tanggal (presisi)
const SINCE_DATE = getArg("since", null); // filter keluar_time >= (rentang)
const WINDOW_HOURS = Number(getArg("window", "20"));

const backupsDir = path.join(__dirname, "..", "backups");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const writeSnapshot = (tag, payload) => {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const f = path.join(backupsDir, `fix-cross-date-${tag}-${ts}.json`);
  fs.writeFileSync(f, JSON.stringify(payload, null, 2));
  return f;
};

const line = (s = "") => console.log(s);

async function step1RestoreKategori(conn) {
  line("\n=== STEP 1: restore kategori tipe MASUK ===");
  const [rows] = await conn.query(
    `SELECT m.absen_id AS masuk_id, m.name, m.kategori_absen AS masuk_kat,
            m.is_cross_date, k.kategori_absen AS keluar_kat
       FROM tipe_absen m
       JOIN tipe_absen k
         ON k.name = m.name AND k.is_deleted = 0
        AND (LOWER(k.description) LIKE '%keluar%' OR LOWER(k.description) LIKE '%pulang%')
      WHERE m.is_deleted = 0
        AND LOWER(m.description) LIKE '%masuk%'
        AND (m.kategori_absen IS NULL OR m.kategori_absen = '')
        AND k.kategori_absen IS NOT NULL AND k.kategori_absen <> ''
      ORDER BY m.is_cross_date DESC, m.name`
  );
  console.table(
    rows.map((r) => ({
      masuk_id: r.masuk_id,
      name: r.name,
      is_cross_date: r.is_cross_date,
      from: r.masuk_kat === null ? "<NULL>" : r.masuk_kat,
      to: r.keluar_kat,
    }))
  );
  line(`kandidat: ${rows.length}`);
  if (!APPLY || rows.length === 0) return { candidates: rows.length, updated: 0 };

  const ids = rows.map((r) => r.masuk_id);
  const [snap] = await conn.query(
    `SELECT absen_id, name, description, kategori_absen, updated_at, updated_by
       FROM tipe_absen WHERE absen_id IN (${ids.map(() => "?").join(",")})`,
    ids
  );
  line(`[backup] ${writeSnapshot("kategori", { plan: rows, snapshot: snap })}`);

  let updated = 0;
  for (const r of rows) {
    const [res] = await conn.query(
      `UPDATE tipe_absen SET kategori_absen = ?, updated_at = NOW()
        WHERE absen_id = ? AND (kategori_absen IS NULL OR kategori_absen = '')`,
      [r.keluar_kat, r.masuk_id]
    );
    if (res.affectedRows === 1) updated++;
  }
  line(`[applied] ${updated}/${rows.length} tipe di-restore.`);
  return { candidates: rows.length, updated };
}

async function step2FixOrphan(conn) {
  line("\n=== STEP 2: pasangkan ulang sesi keluar-orphan ===");
  // Guard scope: WAJIB --since atau --date. Tanpa itu, script akan menyentuh
  // SEMUA orphan historis (ratusan) — banyak di antaranya bug lain (lupa masuk,
  // double keluar), bukan bug kategori-null ini. Salah pasang data lama berbahaya.
  if (!TARGET_DATE && !SINCE_DATE) {
    line("[skip] STEP 2 dilewati — beri --since=YYYY-MM-DD atau --date=YYYY-MM-DD untuk membatasi scope.");
    return { orphan: 0, kindA: 0, kindB: 0, unmatched: 0, applied: 0, skippedDrift: 0, skipped: true };
  }
  // Orphan = sesi incomplete, masuk NULL, keluar terisi, tipe KELUAR-nya
  // is_cross_date=1 (kelas bug ini murni shift lintas hari).
  const params = [];
  let scopeClause = "";
  if (TARGET_DATE) {
    scopeClause = "AND DATE(s.tanggal) = ?";
    params.push(TARGET_DATE);
  } else {
    scopeClause = "AND k.absen_time >= ?";
    params.push(`${SINCE_DATE} 00:00:00`);
  }
  const [orphans] = await conn.query(
    `SELECT s.sesi_id, s.user_id, u.username, s.tanggal, s.kategori_absen,
            s.keluar_absensi_id, k.absen_time AS keluar_time, k.is_lembur AS keluar_lembur,
            tk.name AS shift_name
       FROM absensi_sesi s
       JOIN absensi k     ON k.absensi_id = s.keluar_absensi_id
       JOIN tipe_absen tk ON tk.absen_id  = k.absen_type_id
       LEFT JOIN user u   ON u.user_id    = s.user_id
      WHERE s.masuk_absensi_id IS NULL
        AND s.status = 'incomplete'
        AND tk.is_cross_date = 1
        ${scopeClause}
      ORDER BY k.absen_time`,
    params
  );
  line(`orphan kandidat: ${orphans.length}${TARGET_DATE ? ` (date=${TARGET_DATE})` : ` (since=${SINCE_DATE})`}`);

  const usedMasuk = new Set();
  const plan = [];
  const unmatched = [];
  for (const o of orphans) {
    const [cands] = await conn.query(
      `SELECT a.absensi_id, a.absen_time,
              ms.sesi_id AS cur_sesi, ms.status AS cur_status, ms.keluar_absensi_id AS cur_keluar
         FROM absensi a
         JOIN tipe_absen tm ON tm.absen_id = a.absen_type_id
         LEFT JOIN absensi_sesi ms ON ms.masuk_absensi_id = a.absensi_id
        WHERE a.user_id = ?
          AND tm.name = ?
          AND LOWER(tm.description) LIKE '%masuk%'
          AND a.absen_time < ?
          AND a.absen_time > (? - INTERVAL ? HOUR)
          AND a.is_lembur = ?
          AND (ms.sesi_id IS NULL OR (ms.status <> 'closed' AND ms.keluar_absensi_id IS NULL))
        ORDER BY a.absen_time DESC
        LIMIT 10`,
      [o.user_id, o.shift_name, o.keluar_time, o.keluar_time, WINDOW_HOURS, o.keluar_lembur]
    );
    const pick = cands.find((r) => !usedMasuk.has(r.absensi_id));
    if (!pick) {
      unmatched.push({ sesi: o.sesi_id, user: o.username, shift: o.shift_name });
      continue;
    }
    usedMasuk.add(pick.absensi_id);
    plan.push({
      kind: pick.cur_sesi ? "A" : "B",
      orphan_sesi: o.sesi_id,
      user: o.username,
      shift: o.shift_name,
      masuk_id: pick.absensi_id,
      keluar_id: o.keluar_absensi_id,
      masuk_sesi: pick.cur_sesi || null,
    });
  }
  console.table(
    plan.map((p) => ({
      kind: p.kind, orphan_sesi: p.orphan_sesi, masuk_sesi: p.masuk_sesi,
      user: p.user, shift: p.shift, masuk_id: p.masuk_id, keluar_id: p.keluar_id,
    }))
  );
  if (unmatched.length) {
    line("unmatched (dibiarkan incomplete):");
    console.table(unmatched);
  }
  const stat = {
    orphan: orphans.length,
    kindA: plan.filter((p) => p.kind === "A").length,
    kindB: plan.filter((p) => p.kind === "B").length,
    unmatched: unmatched.length,
    applied: 0,
    skippedDrift: 0,
  };
  if (!APPLY || plan.length === 0) return stat;

  // Snapshot semua sesi tersentuh.
  const touched = [...new Set([...plan.map((p) => p.orphan_sesi), ...plan.filter((p) => p.masuk_sesi).map((p) => p.masuk_sesi)])];
  const [snap] = await conn.query(
    `SELECT * FROM absensi_sesi WHERE sesi_id IN (${touched.map(() => "?").join(",")})`,
    touched
  );
  line(`[backup] ${writeSnapshot("sesi", { plan, snapshot: snap })}`);

  for (const p of plan) {
    const [[orphanNow]] = await conn.query(
      `SELECT masuk_absensi_id, keluar_absensi_id, status FROM absensi_sesi WHERE sesi_id = ? FOR UPDATE`,
      [p.orphan_sesi]
    );
    if (
      !orphanNow || orphanNow.masuk_absensi_id !== null ||
      String(orphanNow.keluar_absensi_id) !== String(p.keluar_id) ||
      orphanNow.status !== "incomplete"
    ) {
      stat.skippedDrift++;
      line(`[skip drift] orphan ${p.orphan_sesi}`);
      continue;
    }
    if (p.kind === "A") {
      const [[masukNow]] = await conn.query(
        `SELECT masuk_absensi_id, keluar_absensi_id, status FROM absensi_sesi WHERE sesi_id = ? FOR UPDATE`,
        [p.masuk_sesi]
      );
      if (
        !masukNow || String(masukNow.masuk_absensi_id) !== String(p.masuk_id) ||
        masukNow.keluar_absensi_id !== null || masukNow.status !== "incomplete"
      ) {
        stat.skippedDrift++;
        line(`[skip drift] masuk-sesi ${p.masuk_sesi}`);
        continue;
      }
      await conn.query(
        `UPDATE absensi_sesi SET keluar_absensi_id = ?, status = 'closed', updated_at = NOW() WHERE sesi_id = ?`,
        [p.keluar_id, p.masuk_sesi]
      );
      await conn.query(`DELETE FROM absensi_sesi WHERE sesi_id = ?`, [p.orphan_sesi]);
    } else {
      await conn.query(
        `UPDATE absensi_sesi SET masuk_absensi_id = ?, status = 'closed', updated_at = NOW() WHERE sesi_id = ?`,
        [p.masuk_id, p.orphan_sesi]
      );
    }
    stat.applied++;
  }
  line(`[applied] ${stat.applied} sesi diperbaiki (drift skip: ${stat.skippedDrift}).`);
  return stat;
}

(async () => {
  const conn = await dbpool.getConnection();
  try {
    line(`fix-cross-date-sesi  APPLY=${APPLY}  window=${WINDOW_HOURS}h${TARGET_DATE ? `  date=${TARGET_DATE}` : ""}`);
    if (!APPLY) line("[DRY-RUN] preview saja — set APPLY=1 untuk commit.");

    await conn.beginTransaction();
    const s1 = await step1RestoreKategori(conn);
    const s2 = await step2FixOrphan(conn);
    if (APPLY) {
      await conn.commit();
      line("\n[COMMIT] sukses.");
    } else {
      await conn.rollback();
      line("\n[DRY-RUN] rollback — tak ada perubahan.");
    }
    line("[summary] " + JSON.stringify({ kategori: s1, sesi: s2 }));
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error("[fatal]", e.message);
    conn.release();
    process.exit(1);
  }
})();
