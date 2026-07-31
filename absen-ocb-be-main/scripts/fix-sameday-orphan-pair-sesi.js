require("dotenv").config();
const fs = require("fs");
const path = require("path");
const dbpool = require("../src/config/database");

// ============================================================================
// FIX same-day orphan pair — satukan masuk-only + keluar-only yang SEHARUSNYA
// 1 sesi tapi kepecah 2 incomplete (bug live flow: sesi open ditandai stale
// jadi incomplete sebelum keluar; absen keluar lalu bikin sesi keluar-only baru).
//
// KRITERIA MATCH (ketat, cegah salah pasang):
//   - user sama
//   - DATE(absen masuk) = DATE(absen keluar)   (SAME-DAY saja; cross-date sudah
//     ditangani fix-cross-date-sesi.js)
//   - tipe_absen.name sama (shift sama)
//   - is_lembur sama
//   - keluar_time > masuk_time (durasi positif)
// Greedy: per masuk, ambil keluar TERDEKAT (durasi terkecil) yg belum terpakai.
//
// AKSI: tutup masuk-sesi (isi keluar_absensi_id + status='closed'), lalu HAPUS
// keluar-orphan-sesi. Idempoten (hanya sentuh incomplete match).
//
// DRY-RUN default. Commit: APPLY=1 (atau --apply). WAJIB backup dulu.
//   npm run backup-db
//   node scripts/fix-sameday-orphan-pair-sesi.js --month=2026-07            # dry-run
//   node scripts/fix-sameday-orphan-pair-sesi.js --month=2026-07 --summary  # rollup
//   APPLY=1 node scripts/fix-sameday-orphan-pair-sesi.js --month=2026-07    # eksekusi
//   --all                 semua bulan (hati-hati)
//   --max-hours=20        batas durasi wajar (default 20) — buang match kepanjangan
// SCOPE WAJIB: --month=YYYY-MM ATAU --all.
// ============================================================================

const argv = process.argv.slice(2);
const getArg = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const APPLY = process.env.APPLY === "1" || argv.includes("--apply");
const ALL = argv.includes("--all");
const MONTH = getArg("month", null);
const SUMMARY = argv.includes("--summary");
const MAX_HOURS = Number(getArg("max-hours", "20"));

const line = (s = "") => console.log(s);

const backupsDir = path.join(__dirname, "..", "backups");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const writeSnapshot = (tag, payload) => {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const f = path.join(backupsDir, `fix-sameday-orphan-${tag}-${ts}.json`);
  fs.writeFileSync(f, JSON.stringify(payload, null, 2));
  return f;
};

(async () => {
  if (!ALL && !MONTH) {
    console.error("[error] wajib --month=YYYY-MM atau --all.");
    process.exit(1);
  }
  const conn = await dbpool.getConnection();
  try {
    line(`fix-sameday-orphan-pair  APPLY=${APPLY}  scope=${ALL ? "ALL" : MONTH}  max-hours=${MAX_HOURS}`);
    if (!APPLY) line("[DRY-RUN] preview saja — set APPLY=1 untuk commit.\n");

    const scope = ALL ? "" : "AND DATE_FORMAT(sm.tanggal,'%Y-%m') = ?";
    // Placeholder order: (1) MAX_HOURS di `<= ? * 60`, (2) MONTH di scope.
    const params = ALL ? [MAX_HOURS] : [MAX_HOURS, MONTH];

    // Semua kandidat pasangan, urut durasi menaik (greedy nearest lebih dulu).
    const [cands] = await conn.query(
      `SELECT sm.sesi_id AS masuk_sesi, sk.sesi_id AS keluar_sesi,
              sm.user_id, DATE_FORMAT(sm.tanggal,'%Y-%m-%d') AS tgl, tm.name AS shift,
              sm.masuk_absensi_id, sk.keluar_absensi_id,
              m.absen_time AS masuk_time, k.absen_time AS keluar_time,
              TIMESTAMPDIFF(MINUTE, m.absen_time, k.absen_time) AS dur_min
         FROM absensi_sesi sm
         JOIN absensi m      ON m.absensi_id = sm.masuk_absensi_id
         JOIN tipe_absen tm  ON tm.absen_id  = m.absen_type_id
         JOIN absensi_sesi sk
           ON sk.user_id = sm.user_id
          AND sk.masuk_absensi_id IS NULL
          AND sk.keluar_absensi_id IS NOT NULL
          AND sk.status = 'incomplete'
         JOIN absensi k      ON k.absensi_id = sk.keluar_absensi_id
         JOIN tipe_absen tk  ON tk.absen_id  = k.absen_type_id
        WHERE sm.masuk_absensi_id IS NOT NULL
          AND sm.keluar_absensi_id IS NULL
          AND sm.status = 'incomplete'
          AND DATE(k.absen_time) = DATE(m.absen_time)
          AND tk.name = tm.name
          AND k.is_lembur = m.is_lembur
          AND k.absen_time > m.absen_time
          AND TIMESTAMPDIFF(MINUTE, m.absen_time, k.absen_time) <= ? * 60
          ${scope}
        ORDER BY dur_min ASC`,
      params
    );

    // Greedy dedup: tiap masuk-sesi & keluar-sesi dipakai maks 1x.
    const usedMasuk = new Set();
    const usedKeluar = new Set();
    const plan = [];
    for (const c of cands) {
      if (usedMasuk.has(c.masuk_sesi) || usedKeluar.has(c.keluar_sesi)) continue;
      usedMasuk.add(c.masuk_sesi);
      usedKeluar.add(c.keluar_sesi);
      plan.push(c);
    }

    line(`kandidat mentah: ${cands.length} | pasangan terpilih: ${plan.length}`);
    const perBulan = {};
    for (const p of plan) {
      const b = p.tgl.slice(0, 7);
      perBulan[b] = (perBulan[b] || 0) + 1;
    }
    line("\n=== pasangan per bulan ===");
    console.table(
      Object.entries(perBulan).sort((a, b) => b[0].localeCompare(a[0])).map(([bln, c]) => ({ bln, c }))
    );

    if (!SUMMARY) {
      line("\n=== sample (maks 20) ===");
      console.table(
        plan.slice(0, 20).map((p) => ({
          masuk_sesi: p.masuk_sesi, keluar_sesi: p.keluar_sesi, user: p.user_id,
          tgl: p.tgl, shift: p.shift, jam: `${p.dur_min}m`,
        }))
      );
    }

    if (!APPLY || plan.length === 0) {
      line("\n[DRY-RUN] tak ada perubahan. Set APPLY=1 untuk commit.");
      conn.release();
      process.exit(0);
    }

    // Snapshot sesi tersentuh (untuk rollback manual).
    const touched = [...plan.map((p) => p.masuk_sesi), ...plan.map((p) => p.keluar_sesi)];
    const [snap] = await conn.query(
      `SELECT * FROM absensi_sesi WHERE sesi_id IN (${touched.map(() => "?").join(",")})`,
      touched
    );
    line(`\n[backup] ${writeSnapshot("plan", { plan, snapshot: snap })}`);

    await conn.beginTransaction();
    let applied = 0, skippedDrift = 0;
    for (const p of plan) {
      // Re-cek state (cegah drift).
      const [[m]] = await conn.query(
        `SELECT masuk_absensi_id, keluar_absensi_id, status FROM absensi_sesi WHERE sesi_id = ? FOR UPDATE`,
        [p.masuk_sesi]
      );
      const [[k]] = await conn.query(
        `SELECT masuk_absensi_id, keluar_absensi_id, status FROM absensi_sesi WHERE sesi_id = ? FOR UPDATE`,
        [p.keluar_sesi]
      );
      if (
        !m || !k ||
        String(m.masuk_absensi_id) !== String(p.masuk_absensi_id) ||
        m.keluar_absensi_id !== null || m.status !== "incomplete" ||
        k.masuk_absensi_id !== null ||
        String(k.keluar_absensi_id) !== String(p.keluar_absensi_id) || k.status !== "incomplete"
      ) {
        skippedDrift++;
        continue;
      }
      await conn.query(
        `UPDATE absensi_sesi SET keluar_absensi_id = ?, status = 'closed', updated_at = NOW() WHERE sesi_id = ?`,
        [p.keluar_absensi_id, p.masuk_sesi]
      );
      await conn.query(`DELETE FROM absensi_sesi WHERE sesi_id = ?`, [p.keluar_sesi]);
      applied++;
    }
    await conn.commit();

    line(`[applied] ${applied} pasangan disatukan (closed), ${applied} orphan-sesi dihapus. drift skip: ${skippedDrift}.`);
    conn.release();
    process.exit(0);
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    console.error("[fatal]", e.message);
    conn.release();
    process.exit(1);
  }
})();
