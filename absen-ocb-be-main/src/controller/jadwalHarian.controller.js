const moment = require("moment-timezone");
const jadwalHarianModel = require("../models/jadwalHarian.model");

const timezone = "Asia/Makassar";

const getEligibleUsers = async (_req, res) => {
  try {
    const [data] = await jadwalHarianModel.getEligibleUsers();
    res.json({
      message: "Get eligible users success",
      status: "success",
      status_code: "200",
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

const getJadwal = async (req, res) => {
  const { month, retail_id } = req.query;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({
      message: "Parameter 'month' wajib format YYYY-MM.",
      status: "failed",
      status_code: "400",
    });
  }

  try {
    const [data] = await jadwalHarianModel.getJadwalByMonth(month, retail_id);
    res.json({
      message: "Get jadwal harian success",
      status: "success",
      status_code: "200",
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

// Bangun daftar tanggal dari tanggal_list eksplisit atau rentang {start, end}.
const buildTanggalList = (body) => {
  if (Array.isArray(body.tanggal_list) && body.tanggal_list.length > 0) {
    return body.tanggal_list;
  }

  if (body.start_date && body.end_date) {
    const start = moment.tz(body.start_date, "YYYY-MM-DD", timezone);
    const end = moment.tz(body.end_date, "YYYY-MM-DD", timezone);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      return [];
    }

    const dates = [];
    const cursor = start.clone();
    while (cursor.isSameOrBefore(end, "day")) {
      dates.push(cursor.format("YYYY-MM-DD"));
      cursor.add(1, "day");
    }
    return dates;
  }

  return [];
};

const getKategoriByRetail = async (req, res) => {
  const { retailId } = req.params;
  try {
    const [data] = await jadwalHarianModel.getKategoriByRetail(retailId);
    res.json({
      message: "Get kategori absen success",
      status: "success",
      status_code: "200",
      data: data.map((r) => r.kategori_absen),
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

const assign = async (req, res) => {
  const { body } = req;
  const { user_ids, retail_id, kategori_absen } = body;

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      message: "user_ids wajib diisi (array).",
      status: "failed",
      status_code: "400",
    });
  }

  if (!retail_id || !kategori_absen) {
    return res.status(400).json({
      message: "retail_id dan kategori_absen wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }

  const tanggalList = buildTanggalList(body);
  if (tanggalList.length === 0) {
    return res.status(400).json({
      message: "Tanggal wajib diisi (tanggal_list atau start_date & end_date valid).",
      status: "failed",
      status_code: "400",
    });
  }

  const now = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  const createdBy = req.user?.id ? String(req.user.id) : null;

  const rows = [];
  for (const userId of user_ids) {
    for (const tanggal of tanggalList) {
      rows.push({
        user_id: userId,
        tanggal,
        retail_id,
        kategori_absen,
        created_at: now,
        created_by: createdBy,
      });
    }
  }

  try {
    await jadwalHarianModel.assignJadwal(rows);
    res.json({
      message: "Jadwal harian berhasil disimpan.",
      status: "success",
      status_code: "200",
      data: { total: rows.length },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

const deleteJadwal = async (req, res) => {
  const { id } = req.params;
  const now = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  const body = {
    deleted_at: now,
    deleted_by: req.user?.id ? String(req.user.id) : null,
  };

  try {
    await jadwalHarianModel.deleteJadwal(body, id);
    res.json({
      message: "Jadwal harian berhasil dihapus.",
      status: "success",
      status_code: "200",
      data: { id },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

module.exports = {
  getEligibleUsers,
  getJadwal,
  getKategoriByRetail,
  assign,
  deleteJadwal,
};
