const absensiModel = require("../models/absensi.model");
const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");

const timezone = "Asia/Makassar";

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
    const isOvertime = String(body.reason || "")
      .toLowerCase()
      .includes("lembur");
    body.is_lembur = body.is_lembur || isOvertime ? 1 : 0;

    if (!getTimeDB) {
      removeUploadedImage(file.filename);

      return res.status(404).json({
        message: "Invalid attendance time configuration in the database!!",
        status: "failed",
        status_code: "404",
      });
    }

    const selectedDesc = String(getTimeDB.description || "").toLowerCase();
    const isKeluar =
      selectedDesc.includes("keluar") || selectedDesc.includes("pulang");
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
    }

    const startTimeDBMoment = moment
      .tz(getTimeDB.start_time, "HH:mm:ss", timezone)
      .format("HH:mm:ss");
    const endTimeDBMoment = moment
      .tz(getTimeDB.end_time, "HH:mm:ss", timezone)
      .format("HH:mm:ss");
    const timeAbsenMomentFormatted = timeAbsenMoment.format("HH:mm:ss");
    const potonganLate = Number(getPotonganLate?.value || 0);

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

    const result = await absensiModel.createAbsensi(
      body,
      imageUrl,
      status_absen,
      status_approval,
      upline,
      timeAbsenFull,
      potongan,
      is_valid
    );

    if (!result) {
      removeUploadedImage(file.filename);

      return res.status(404).json({
        message: "Invalid attendance time configuration in the database!!",
        status: "failed",
        status_code: "404",
      });
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
        is_overtime: isOvertime ? 1 : 0,
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
