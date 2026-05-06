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

    if (!getTimeDB) {
      removeUploadedImage(file.filename);

      return res.status(404).json({
        message: "Invalid attendance time configuration in the database!!",
        status: "failed",
        status_code: "404",
      });
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
};
