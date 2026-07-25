const absensiModel = require("../models/absensi.model");
const absenManagementModel = require("../models/absenManagement.model");
const sesiModel = require("../models/absensiSesi.model");
const dbpool = require("../config/database");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

const timezone = "Asia/Makassar";

// Ambil tipe absen yang benar-benar di-assign ke user hari ini (regular + lembur).
// Dipakai untuk otorisasi server-side + penentuan is_lembur dari sumber terpercaya.
const getAllowedAbsenTypeSets = async (userId) => {
  const [regularRows] = await absenManagementModel.getTypeAbsenPerShift(userId);
  const [lemburRows] = await absenManagementModel.getLemburTypes(userId);

  const regular = new Set(
    (Array.isArray(regularRows) ? regularRows : []).map((r) => String(r.absen_id))
  );
  const lembur = new Set(
    (Array.isArray(lemburRows) ? lemburRows : []).map((r) => String(r.absen_id))
  );

  return { regular, lembur };
};

const getUploadedImagePath = (filename) =>
  path.resolve(__dirname, "../../public/images", filename);

const removeUploadedImage = (filename) => {
  if (!filename) {
    return;
  }

  const imagePath = getUploadedImagePath(filename);

  fs.unlink(imagePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete file:", err);
    }
  });
};

const createAbsensi = async (req, res) => {
  const { body, file } = req;

  if (!file) {
    return res.status(400).json({
      message: "Foto selfie wajib diunggah.",
      status: "failed",
      status_code: "400",
    });
  }

  try {
    const imageUrl = `/assets/${file.filename}`;
    let status_absen = 0;
    let status_approval = 0;
    let potongan = 0;
    const idPotongan = 1;

    const timeAbsenMoment = moment().tz(timezone);
    const timeAbsenFull = timeAbsenMoment.format("YYYY-MM-DD HH:mm:ss");

    const getTimeDB = await absensiModel.getTimeDB(body.absen_type_id);
    const getUpline = await absensiModel.getUpline(body.user_id);
    const getPotonganLate = await absensiModel.getPotonganLate(idPotongan);
    const upline = getUpline?.upline || null;

    if (!getTimeDB) {
      removeUploadedImage(file.filename);

      return res.status(404).json({
        message: "Invalid attendance time configuration in the database!!",
        status: "failed",
        status_code: "404",
      });
    }

    // Otorisasi server-side: tipe absen harus benar di-assign ke user hari ini.
    // is_lembur ditentukan dari sumber terpercaya (masuk set lembur), bukan teks reason.
    const allowedTypes = await getAllowedAbsenTypeSets(body.user_id);
    const submittedTypeId = String(body.absen_type_id);
    const isRegularType = allowedTypes.regular.has(submittedTypeId);
    const isLemburType = allowedTypes.lembur.has(submittedTypeId);

    if (!isRegularType && !isLemburType) {
      removeUploadedImage(file.filename);

      return res.status(403).json({
        message: "Tipe absen ini tidak tersedia untuk Anda hari ini.",
        status: "failed",
        status_code: "403",
      });
    }

    // Regular menang: tipe hanya dihitung lembur bila eksklusif di set lembur.
    body.is_lembur = isLemburType && !isRegularType ? 1 : 0;

    const selectedDesc = String(getTimeDB.description || "").toLowerCase();
    const isKeluar =
      selectedDesc.includes("keluar") || selectedDesc.includes("pulang");
    const isMasuk = selectedDesc.includes("masuk");

    // Hard-guard lembur: lembur hanya boleh setelah shift regular hari ini komplit
    // (masuk + keluar). Lembur-keluar wajib didahului lembur-masuk.
    // Baca sesi (dual-path): prefer absensi_sesi, fallback count LIKE utk data pra-sesi.
    if (body.is_lembur === 1) {
      const regularSesi = await sesiModel.getTodaySesiSummary(
        body.user_id,
        false
      );
      // Regular komplit = ada sesi regular closed, ATAU (fallback pra-sesi) count masuk+keluar.
      let regularComplete = regularSesi.hasClosed;
      if (!regularComplete && regularSesi.closedCount === 0 && regularSesi.openCount === 0) {
        const regularToday = await absensiModel.getTodayDirectionSummaryByLembur(
          body.user_id,
          false
        );
        regularComplete = regularToday.masuk >= 1 && regularToday.keluar >= 1;
      }

      if (!regularComplete) {
        removeUploadedImage(file.filename);

        return res.status(400).json({
          message:
            "Lembur hanya bisa dilakukan setelah absen masuk dan keluar regular hari ini selesai.",
          status: "failed",
          status_code: "400",
        });
      }

      if (isKeluar) {
        const lemburSesi = await sesiModel.getTodaySesiSummary(
          body.user_id,
          true
        );
        // Lembur masuk ada = sesi lembur open/closed, ATAU (fallback) count masuk lembur.
        let lemburMasukExists = lemburSesi.hasOpen || lemburSesi.hasClosed;
        if (!lemburMasukExists) {
          const lemburToday = await absensiModel.getTodayDirectionSummaryByLembur(
            body.user_id,
            true
          );
          lemburMasukExists = lemburToday.masuk >= 1;
        }

        if (!lemburMasukExists) {
          removeUploadedImage(file.filename);

          return res.status(400).json({
            message: "Tidak bisa absen keluar lembur sebelum absen masuk lembur.",
            status: "failed",
            status_code: "400",
          });
        }
      }
    }
    // Keluar dini hari (< 12:00) = shift cross-midnight (SORE 9 JAM, SUBUH),
    // masuk-nya tercatat kemarin. Cek masuk hari ini ATAU kemarin.
    const isEarlyMorningKeluar =
      timeAbsenMoment.format("HH:mm:ss") < "12:00:00";

    const SHIFT_SCHEDULED_CATEGORIES = [18, 21];
    const isSalesToko = SHIFT_SCHEDULED_CATEGORIES.includes(
      Number(getUpline?.category_user)
    );

    if (isKeluar) {
      const masukCount = isEarlyMorningKeluar
        ? (await absensiModel.getMasukCountIncludingYesterday(body.user_id))
            .masuk
        : (await absensiModel.getTodayAttendanceDirectionSummary(body.user_id))
            .masuk;

      if (masukCount < 1) {
        removeUploadedImage(file.filename);

        return res.status(400).json({
          message: "Tidak bisa absen keluar sebelum absen masuk.",
          status: "failed",
          status_code: "400",
        });
      }

      // Sales Toko / Trainee: absen keluar diblokir bila absen masuk masih
      // menunggu approval (belum disetujui atasan).
      if (isSalesToko) {
        const approvedMasuk = await absensiModel.getApprovedMasukCount(
          body.user_id,
          isEarlyMorningKeluar
        );

        if (approvedMasuk < 1) {
          removeUploadedImage(file.filename);

          return res.status(400).json({
            message:
              "Absen masuk Anda masih menunggu approval atasan. Absen keluar belum bisa dilakukan.",
            status: "failed",
            status_code: "400",
          });
        }
      }

      // Guard tipe keluar harus cocok dgn sesi masuk yang sedang open.
      // Cegah user pilih tipe keluar beda kategori/jadwal → sesi pecah
      // (masuk menggantung open + keluar jadi incomplete terpisah).
      const openSesiAktif = await sesiModel.findAnyOpenSesi({
        user_id: body.user_id,
        is_lembur: body.is_lembur,
        includeYesterday: isEarlyMorningKeluar,
      });

      if (openSesiAktif) {
        let cocok = true;
        if (openSesiAktif.jadwal_id != null) {
          // Jalur jadwal harian: tipe keluar harus == absen_keluar_id jadwalnya.
          const jadwalKeluarId = await sesiModel.getJadwalKeluarId(
            openSesiAktif.jadwal_id
          );
          cocok =
            jadwalKeluarId != null &&
            String(jadwalKeluarId) === String(body.absen_type_id);
        } else {
          // Jalur non-jadwal / lembur: kategori keluar harus == kategori sesi open.
          cocok =
            String(getTimeDB.kategori_absen || "") ===
            String(openSesiAktif.kategori_absen || "");
        }

        if (!cocok) {
          removeUploadedImage(file.filename);

          return res.status(400).json({
            message: `Tipe absen keluar tidak cocok dengan absen masuk Anda (shift ${
              openSesiAktif.kategori_absen || "-"
            }). Pilih tipe keluar yang sesuai.`,
            status: "failed",
            status_code: "400",
          });
        }
      }
    }

    const startTimeDBMoment = moment
      .tz(getTimeDB.start_time, "HH:mm:ss", timezone)
      .format("HH:mm:ss");
    const endTimeDBMoment = moment
      .tz(getTimeDB.end_time, "HH:mm:ss", timezone)
      .format("HH:mm:ss");
    const timeAbsenMomentFormatted = timeAbsenMoment.format("HH:mm:ss");
    const potonganLate = Number(getPotonganLate?.value || 0);

    // Absen MASUK hanya boleh mulai 1 jam sebelum jam masuk (start_time).
    // Ex: start_time 15:00 -> paling awal boleh absen 14:00. Sebelum itu ditolak.
    // Telat (setelah start_time) tetap boleh (ditangani status_absen di bawah).
    // Keluar/lembur & tipe non-masuk (kebersihan/parkir) tak kena guard ini.
    // HANYA untuk user jalur jadwal harian (uses_jadwal_harian aktif) — user
    // non-jadwal (retail biasa) tak dibatasi window early ini.
    const usesJadwalHarian =
      !body.is_lembur &&
      (await absenManagementModel.userUsesJadwalHarian(body.user_id));

    if (isMasuk && !isKeluar && usesJadwalHarian) {
      const EARLY_MASUK_WINDOW_MINUTES = 60;
      const toMinutes = (hhmmss) => {
        const [h, m] = String(hhmmss).split(":").map((n) => parseInt(n, 10));
        return h * 60 + m;
      };
      const nowMin = toMinutes(timeAbsenMomentFormatted);
      const startMin = toMinutes(startTimeDBMoment);
      // Selisih menit menuju start (positif = belum sampai jam masuk). Tangani
      // wrap tengah malam: pilih jarak terpendek pada siklus 24 jam.
      let minutesUntilStart = startMin - nowMin;
      if (minutesUntilStart > 720) minutesUntilStart -= 1440;
      if (minutesUntilStart < -720) minutesUntilStart += 1440;

      if (minutesUntilStart > EARLY_MASUK_WINDOW_MINUTES) {
        removeUploadedImage(file.filename);

        return res.status(400).json({
          message: `Absen masuk baru dibuka 1 jam sebelum jam masuk (${startTimeDBMoment.slice(
            0,
            5
          )}). Silakan absen mulai pukul ${moment(startTimeDBMoment, "HH:mm:ss")
            .subtract(EARLY_MASUK_WINDOW_MINUTES, "minutes")
            .format("HH:mm")}.`,
          status: "failed",
          status_code: "400",
        });
      }
    }

    if (timeAbsenMomentFormatted < startTimeDBMoment) {
      status_absen = 1;
    } else if (
      timeAbsenMomentFormatted >= startTimeDBMoment &&
      timeAbsenMomentFormatted < endTimeDBMoment
    ) {
      status_absen = 1;
    } else {
      status_absen = 2;

      const diffMinutes = moment(timeAbsenMomentFormatted, "HH:mm:ss").diff(
        moment(endTimeDBMoment, "HH:mm:ss"),
        "minutes"
      );

      if (diffMinutes > 15) {
        potongan = potonganLate;
      }

      // Absen telat => butuh approval atasan (sama seperti absen di luar radius).
      // Hanya untuk Sales Toko (18) & Trainee Sales Toko (21).
      const SHIFT_SCHEDULED_CATEGORIES = [18, 21];
      if (SHIFT_SCHEDULED_CATEGORIES.includes(Number(getUpline?.category_user))) {
        body.is_approval = 1;
        const lateReason = "Anda absen telat, menunggu approval atasan";
        body.reason = String(body.reason || "").trim()
          ? `${body.reason}; ${lateReason}`
          : lateReason;
      }
    }

    status_approval = body.is_approval == 1 ? 1 : 2;
    const is_valid = body.is_approval == 1 ? 0 : 1;

    // Insert absensi + open/close absensi_sesi dalam 1 transaksi (atomic).
    // Bila sesi gagal → absensi rollback, hindari event tanpa sesi (orphan).
    const tanggalMasuk = timeAbsenMoment.format("YYYY-MM-DD");
    const kategoriAbsen = getTimeDB.kategori_absen || null;

    const conn = await dbpool.getConnection();
    let result;
    try {
      await conn.beginTransaction();

      result = await absensiModel.createAbsensi(
        body,
        imageUrl,
        status_absen,
        status_approval,
        upline,
        timeAbsenFull,
        potongan,
        is_valid,
        conn
      );

      if (!result) {
        throw new Error("Insert absensi gagal (no result).");
      }

      const newAbsensiId = result.insertId;

      if (isKeluar) {
        // Absen keluar → tutup sesi open yang cocok. Bila tak ada → incomplete.
        const openSesi = await sesiModel.findOpenSesi(conn, {
          user_id: body.user_id,
          is_lembur: body.is_lembur,
          kategori_absen: kategoriAbsen,
          jadwal_id: null,
          includeYesterday: isEarlyMorningKeluar,
        });

        if (openSesi) {
          await sesiModel.closeSesi(conn, openSesi.sesi_id, newAbsensiId, timeAbsenFull);
        } else {
          await sesiModel.createIncompleteSesi(conn, {
            user_id: body.user_id,
            tanggal: tanggalMasuk,
            retail_id: body.retail_id,
            jadwal_id: null,
            kategori_absen: kategoriAbsen,
            keluar_absensi_id: newAbsensiId,
            is_lembur: body.is_lembur,
            created_at: timeAbsenFull,
          });
        }
      } else {
        // Auto-close sesi BASI (lupa keluar) sebelum buka sesi baru: tandai
        // 'incomplete' sesi open tanggal lampau yang tipe masuknya same-day
        // (is_cross_date=0). Sesi cross-date sah (SUBUH/SORE 9 JAM) tak disentuh.
        // Cegah user terblokir + jaga akurasi lembur-guard.
        await sesiModel.markStaleOpenSesiIncomplete(
          conn,
          body.user_id,
          body.is_lembur
        );

        // Absen masuk → buka sesi baru. Resolve jadwal_id (regular Sales Toko/Trainee).
        const jadwalId = body.is_lembur
          ? null
          : await sesiModel.resolveJadwalId(
              body.user_id,
              body.absen_type_id,
              tanggalMasuk,
              conn
            );

        await sesiModel.openSesi(conn, {
          user_id: body.user_id,
          tanggal: tanggalMasuk,
          retail_id: body.retail_id,
          jadwal_id: jadwalId,
          kategori_absen: kategoriAbsen,
          masuk_absensi_id: newAbsensiId,
          is_lembur: body.is_lembur,
          created_at: timeAbsenFull,
        });
      }

      await conn.commit();
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }

    res.json({
      message: "Absen successfully!",
      status: "success",
      status_code: "200",
      data: {
        ...body,
        photo_url: imageUrl,
        absen_time: timeAbsenFull,
        status_absen,
        status_approval,
        potongan,
        is_overtime: body.is_lembur ? 1 : 0,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    removeUploadedImage(file?.filename);

    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

const approveAbsen = async (req, res) => {
  const { absenId } = req.params;

  try {
    const timeApproveMoment = moment().tz(timezone);
    const timeApprove = timeApproveMoment.format("YYYY-MM-DD HH:mm:ss");
    await absensiModel.approveAbsen(timeApprove, absenId);

    res.json({
      message: "An attendance has been approved",
      status: "success",
      status_code: "200",
      data: {
        asben_id: absenId,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
    console.log(error);
  }
};

const validasiAbsen = async (req, res) => {
  const { absenId } = req.params;
  const { body } = req;

  try {
    await absensiModel.validasiAbsen(body, absenId);

    res.json({
      message: "Absensi Berhasil di validasi",
      status: "success",
      status_code: "200",
      data: {
        absensi_id: absenId,
        ...body,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
    console.log(error);
  }
};

const rejectAbsen = async (req, res) => {
  const { absenId } = req.params;

  try {
    const timeApproveMoment = moment().tz(timezone);
    const timeApprove = timeApproveMoment.format("YYYY-MM-DD HH:mm:ss");
    await absensiModel.rejectAbsen(timeApprove, absenId);

    res.json({
      message: "An attendance has been rejected",
      status: "success",
      status_code: "200",
      data: {
        asben_id: absenId,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
    console.log(error);
  }
};

const historyAbsensiPerUser = async (req, res) => {
  const { userId } = req.params;
  const body = req.body;

  try {
    const [data] = await absensiModel.historyAbsensiPerUser(userId, body);
    const [total] = await absensiModel.totalAbsenPerMonth(userId, body);

    const defaultTotal = { total_absensi: 0, total_ontime: 0, total_late: 0 };
    const totalData = total.length > 0 ? total[0] : defaultTotal;

    res.json({
      message: "Get History Absensi Successfully!",
      status: "success",
      status_code: "200",
      total_absensi: totalData.total_absensi,
      total_late: totalData.total_late,
      total_ontime: totalData.total_ontime,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

const listAbsensiApproval = async (req, res) => {
  const { approvalId } = req.params;

  try {
    const [data] = await absensiModel.listAbsensiApproval(approvalId);
    res.json({
      message: "Get List Absensi Successfully!",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const totalAbsenPerMonth = async (req, res) => {
  const { userId } = req.params;

  try {
    const [data] = await absensiModel.totalAbsenPerMonth(userId);
    res.json({
      message: "Get Total Absensi Success",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const cekFeePeruser = async (req, res) => {
  const { userId } = req.params;

  try {
    const [data] = await absensiModel.cekFeePeruser(userId);
    res.json({
      message: "Cek Fee Successfully!",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const historyAbsensiAllUser = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01 00:00:00`;

    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastDayOfMonth = `${lastDay.getFullYear()}-${String(
      lastDay.getMonth() + 1
    ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(
      2,
      "0"
    )} 23:59:59`;

    const finalStartDate = start_date || firstDayOfMonth;
    const finalEndDate = end_date || lastDayOfMonth;

    const [data] = await absensiModel.historyAbsensiAllUser(
      finalStartDate,
      finalEndDate
    );

    res.json({
      message: "Get History Absensi Successfully!",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching history all user:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

const rekapKalender = async (req, res) => {
  try {
    const { month, retail_id } = req.query;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const targetMonth = month || currentMonth;

    const [year, mon] = targetMonth.split("-").map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    const users = await absensiModel.getRekapKalenderUsers(targetMonth, retail_id || null);
    const absensiRows = await absensiModel.getRekapKalenderAbsensi(targetMonth, retail_id || null);
    const offdayRows = await absensiModel.getRekapKalenderOffday(targetMonth, retail_id || null);

    const toDateStr = (val) => {
      if (!val) return null;
      if (val instanceof Date) return moment(val).tz(timezone).format("YYYY-MM-DD");
      return String(val).slice(0, 10);
    };

    // Map absensi: key = "userId_YYYY-MM-DD" → { status_absen, absen_time }
    const absensiMap = {};
    for (const row of absensiRows) {
      const dateStr = toDateStr(row.tanggal);
      if (!dateStr) continue;
      const key = `${row.user_id}_${dateStr}`;
      if (!absensiMap[key]) {
        absensiMap[key] = {
          status: row.status_absen,
          time: row.absen_time
            ? moment(row.absen_time).tz(timezone).format("DD/MM/YYYY HH:mm")
            : null,
        };
      }
    }

    // Map offday: key = "userId_YYYY-MM-DD" → true
    const offdayMap = {};
    for (const row of offdayRows) {
      const dateStr = toDateStr(row.tanggal);
      if (!dateStr) continue;
      offdayMap[`${row.user_id}_${dateStr}`] = true;
    }

    // Group users by retail
    const retailMap = {};
    for (const user of users) {
      if (!retailMap[user.retail_id]) {
        retailMap[user.retail_id] = {
          retail_id: user.retail_id,
          retail_name: user.retail_name,
          users: [],
        };
      }

      const attendance = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const key = `${user.user_id}_${dateStr}`;
        if (offdayMap[key]) {
          attendance[d] = { status: "libur", time: null };
        } else if (absensiMap[key]?.status === 1) {
          attendance[d] = { status: "hadir", time: absensiMap[key].time };
        } else if (absensiMap[key]?.status === 2) {
          attendance[d] = { status: "terlambat", time: absensiMap[key].time };
        } else {
          const cellDate = moment.tz(dateStr, timezone).startOf("day");
          const today = moment().tz(timezone).startOf("day");
          attendance[d] = {
            status: cellDate.isAfter(today) ? "belum" : "alpha",
            time: null,
          };
        }
      }

      retailMap[user.retail_id].users.push({
        user_id: user.user_id,
        name: user.name,
        attendance,
      });
    }

    res.json({
      message: "Rekap Kalender Absensi",
      status: "success",
      status_code: "200",
      month: targetMonth,
      days_in_month: daysInMonth,
      data: Object.values(retailMap),
    });
  } catch (error) {
    console.error("Error rekapKalender:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

module.exports = {
  createAbsensi,
  approveAbsen,
  validasiAbsen,
  rejectAbsen,
  historyAbsensiPerUser,
  listAbsensiApproval,
  totalAbsenPerMonth,
  cekFeePeruser,
  historyAbsensiAllUser,
  rekapKalender,
};
