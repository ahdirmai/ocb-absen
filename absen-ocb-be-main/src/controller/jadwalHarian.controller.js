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

const getEmployeesByRetail = async (req, res) => {
  const { retailId } = req.params;
  try {
    const [data] = await jadwalHarianModel.getEmployeesByRetail(retailId);
    res.json({
      message: "Get employees by retail success",
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

const getKategoriShift = async (_req, res) => {
  try {
    const [data] = await jadwalHarianModel.getKategoriShift();
    res.json({
      message: "Get kategori absen success",
      status: "success",
      status_code: "200",
      // [{ shift_name, kategori_absen, absen_masuk_id, absen_keluar_id }]
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

const assign = async (req, res) => {
  const { body } = req;
  const { user_ids, retail_id, absen_masuk_id, absen_keluar_id } = body;

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({
      message: "user_ids wajib diisi (array).",
      status: "failed",
      status_code: "400",
    });
  }

  if (!retail_id || !absen_masuk_id || !absen_keluar_id) {
    return res.status(400).json({
      message: "retail_id, absen_masuk_id, dan absen_keluar_id wajib diisi.",
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
        absen_masuk_id,
        absen_keluar_id,
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

const getByDate = async (req, res) => {
  const { retail_id, tanggal } = req.query;

  if (!retail_id || !tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return res.status(400).json({
      message: "retail_id dan tanggal (YYYY-MM-DD) wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }

  try {
    const [data] = await jadwalHarianModel.getJadwalByDate(retail_id, tanggal);
    res.json({
      message: "Get jadwal per tanggal success",
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

// Set/replace jadwal satu retail pada satu tanggal.
// body: { retail_id, tanggal, assignments: [{ user_id, absen_masuk_id, absen_keluar_id }] }
const setByDate = async (req, res) => {
  const { retail_id, tanggal, assignments } = req.body;

  if (!retail_id || !tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return res.status(400).json({
      message: "retail_id dan tanggal (YYYY-MM-DD) wajib diisi.",
      status: "failed",
      status_code: "400",
    });
  }

  if (!Array.isArray(assignments)) {
    return res.status(400).json({
      message: "assignments wajib berupa array.",
      status: "failed",
      status_code: "400",
    });
  }

  const rows = [];
  for (const a of assignments) {
    if (!a || a.user_id == null || !a.absen_masuk_id || !a.absen_keluar_id) {
      return res.status(400).json({
        message: "Setiap assignment wajib punya user_id, absen_masuk_id, dan absen_keluar_id.",
        status: "failed",
        status_code: "400",
      });
    }
    rows.push({
      user_id: a.user_id,
      absen_masuk_id: a.absen_masuk_id,
      absen_keluar_id: a.absen_keluar_id,
    });
  }

  const meta = {
    at: moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
    by: req.user?.id ? String(req.user.id) : null,
  };

  try {
    const result = await jadwalHarianModel.setJadwalByDate(
      retail_id,
      tanggal,
      rows,
      meta
    );
    res.json({
      message: "Jadwal harian berhasil disimpan.",
      status: "success",
      status_code: "200",
      data: result,
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
  getEmployeesByRetail,
  getJadwal,
  getKategoriShift,
  getByDate,
  assign,
  setByDate,
  deleteJadwal,
};
