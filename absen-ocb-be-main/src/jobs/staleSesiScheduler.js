const sesiModel = require("../models/absensiSesi.model");

// Scheduler zero-dep: sapu sesi open BASI jadi 'incomplete' secara berkala.
// Sebelumnya penandaan hanya on-demand (saat user absen masuk lagi) — user yang
// lupa keluar & tak absen lagi meninggalkan sesi 'open' menggantung. Job ini
// menutupnya tanpa menunggu aksi user. Aturan basi = sweepStaleOpenSesiIncomplete
// (same-day lewat tengah malam; cross-date lewat jam keluar terjadwal + grace 3h).

const DEFAULT_INTERVAL_MINUTES = 30;

let running = false;

const runSweep = async () => {
  // Cegah tumpang-tindih bila sweep sebelumnya belum selesai.
  if (running) return;
  running = true;
  try {
    const affected = await sesiModel.sweepStaleOpenSesiIncomplete();
    if (affected > 0) {
      console.log(
        `[staleSesiScheduler] ${affected} sesi open basi ditandai incomplete.`
      );
    }
  } catch (err) {
    console.error("[staleSesiScheduler] sweep gagal:", err.message);
  } finally {
    running = false;
  }
};

// Mulai scheduler. Jalankan sekali saat boot (bersihkan backlog), lalu berkala.
// Interval dari env STALE_SESI_SWEEP_MINUTES (menit), default 30.
const startStaleSesiScheduler = () => {
  const minutes =
    parseInt(process.env.STALE_SESI_SWEEP_MINUTES, 10) ||
    DEFAULT_INTERVAL_MINUTES;
  const intervalMs = minutes * 60 * 1000;

  runSweep();
  const timer = setInterval(runSweep, intervalMs);
  timer.unref(); // jangan tahan proses tetap hidup hanya karena timer

  console.log(
    `[staleSesiScheduler] aktif — sweep tiap ${minutes} menit.`
  );
  return timer;
};

module.exports = { startStaleSesiScheduler, runSweep };
