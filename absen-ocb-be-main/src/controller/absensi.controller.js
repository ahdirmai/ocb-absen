const absensiModel = require("../models/absensi.model");
const moment = require("moment-timezone");
const timezone = "Asia/Jakarta";
const fs = require("fs");
const path = require("path");

const createAbsensi = async (req, res) => {
  const { body } = req;

  try {
    const imageUrl = `/assets/${req.file.filename}`;
    let status_absen = 0;
    let status_approval = 0;
    let potongan = 0;
    const idPotongan = 1;

    const timeAbsenMoment = moment().tz(timezone);
    const timeAbsenFull = timeAbsenMoment.format("YYYY-MM-DD HH:mm:ss");

    // Ambil konfigurasi waktu dari database
    const getTimeDB = await absensiModel.getTimeDB(body.absen_type_id);
    const getUpline = await absensiModel.getUpline(body.user_id);
    const getPotonganLate = await absensiModel.getPotonganLate(idPotongan);
    const upline = getUpline?.upline;

    if (!getTimeDB) {
      // Hapus file jika konfigurasi waktu tidak ditemukan
      fs.unlink(path.resolve(imageUrl), (err) => {
        if (err) console.error("Failed to delete file:", err);
      });
      return res.status(404).json({
        message: "Invalid attendance time configuration in the database!!",
        status: "failed",
        status_code: "404",
      });
    }

    const startTimeDB = getTimeDB.start_time;
    const endTimeDB = getTimeDB.end_time;
    const PotonganLate = getPotonganLate.value;

    // Konversi waktu dari database ke moment untuk perbandingan
    // const startTimeDBMoment = moment.tz(startTimeDB, 'HH:mm:ss', timezone);
    // const endTimeDBMoment = moment.tz(endTimeDB, 'HH:mm:ss', timezone);
    // Ambil tanggal hari ini agar semua format jadi YYYY-MM-DD HH:mm:ss
    const startTimeDBMoment = moment.tz(startTimeDB, 'HH:mm:ss', timezone).format("HH:mm:ss");
const endTimeDBMoment = moment.tz(endTimeDB, 'HH:mm:ss', timezone).format("HH:mm:ss");
const timeAbsenMomentFormatted = timeAbsenMoment.format("HH:mm:ss"); // Pastikan absen juga dalam format 24 jam


    console.log(startTimeDBMoment);
    console.log(endTimeDBMoment);
    console.log(timeAbsenMomentFormatted);
    // Tentukan status_absen (ontime/late)
    // if (timeAbsenMoment.isBefore(startTimeDBMoment)) {
    //     status_absen = 1; // Ontime (karena absen dilakukan sebelum jam masuk)
    // } else if (timeAbsenMoment.isBetween(startTimeDBMoment, endTimeDBMoment)) {
    //     status_absen = 1; // Ontime (karena masih dalam rentang yang diperbolehkan)
    // } else {
    //     status_absen = 2; // Late (karena sudah melewati end_time)
    //     const diffMinutes = timeAbsenMoment.diff(endTimeDBMoment, 'minutes');

    //     if (diffMinutes > 15) {
    //         potongan = PotonganLate; // Potongan jika lebih dari 15 menit setelah end_time
    //     }
    // }
    // Tentukan status_absen (ontime/late)
    if (timeAbsenMomentFormatted < startTimeDBMoment) {
        status_absen = 1; // ✅ Ontime (karena absen dilakukan sebelum jam masuk)
    } else if (timeAbsenMomentFormatted >= startTimeDBMoment && timeAbsenMomentFormatted < endTimeDBMoment) {
        status_absen = 1; // ✅ Ontime (karena masih dalam rentang yang diperbolehkan)
    } else {
        status_absen = 2; // ❌ Late (karena sudah melewati end_time)
        const diffMinutes = moment(timeAbsenMomentFormatted, "HH:mm:ss").diff(moment(endTimeDBMoment, "HH:mm:ss"), 'minutes');
    
        if (diffMinutes > 15) {
            potongan = PotonganLate; // Potongan jika lebih dari 15 menit setelah end_time
        }
    }
    

    // Tentukan status_approval
    status_approval = body.is_approval == 1 ? 1 : 2;

    // Simpan tipe absen baru ke database
    const result = await absensiModel.createAbsensi(
      body,
      imageUrl,
      status_absen,
      status_approval,
      upline,
      timeAbsenFull,
      potongan
    );

    if (!result) {
      // Hapus file jika konfigurasi waktu tidak ditemukan
      fs.unlink(path.resolve(imageUrl), (err) => {
        if (err) console.error("Failed to delete file:", err);
      });
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
        absen_time: timeAbsenFull, // Kirim waktu absen yang digunakan
      },
    });
  } catch (error) {
    console.error("Error:", error);
    // Hapus file jika terjadi error
    if (req.file && req.file.filename) {
      const imageUrl = `/assets/${req.file.filename}`;
      fs.unlink(path.resolve(imageUrl), (err) => {
        if (err) console.error("Failed to delete file:", err);
      });
    }
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const approveAbsen = async (req, res) => {
  const { absenId } = req.params;

  // const {body} = req;
  try {
    const timeApproveMoment = moment().tz(timezone);
    const timeApprove = timeApproveMoment.format("YYYY-MM-DD HH:mm:ss");
    await absensiModel.approveAbsen(timeApprove, absenId);
    // console.log('idUser: ', idUser);
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
    // console.log('idUser: ', idUser);
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
  // const {body} = req;
  try {
    const timeApproveMoment = moment().tz(timezone);
    const timeApprove = timeApproveMoment.format("YYYY-MM-DD HH:mm:ss");
    await absensiModel.rejectAbsen(timeApprove, absenId);
    // console.log('idUser: ', idUser);
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
  const body = req.body; // Tidak perlu destructuring { body }, langsung saja

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
    // Ambil parameter start_date dan end_date dari request query
    const { start_date, end_date } = req.query;

    // Tetapkan nilai default untuk bulan berjalan tanpa konversi UTC
    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01 00:00:00`;

    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastDayOfMonth = `${lastDay.getFullYear()}-${String(
      lastDay.getMonth() + 1
    ).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")} 23:59:59`;

    // Gunakan parameter dari request atau nilai default
    const effectiveStartDate = start_date || firstDayOfMonth;
    const effectiveEndDate = end_date || lastDayOfMonth;

    console.log("Start Date:", effectiveStartDate);
    console.log("End Date:", effectiveEndDate);

    // Panggil model dengan parameter
    const [data] = await absensiModel.historyAbsensiAllUser(
      effectiveStartDate,
      effectiveEndDate
    );

    res.json({
      message: "Get History Absensi Success",
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

module.exports = {
  createAbsensi,
  historyAbsensiPerUser,
  cekFeePeruser,
  historyAbsensiAllUser,
  listAbsensiApproval,
  totalAbsenPerMonth,
  approveAbsen,
  rejectAbsen,
  validasiAbsen,
};
