const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const dbpool = require("../config/database");
const jadwalHarianModel = require("../models/jadwalHarian.model");

const timezone = "Asia/Makassar";

const MAX_IMPORT_ROWS = 5000;
const TEMP_DIR = path.resolve(__dirname, "../../public/laporan");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

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

const getActiveJadwalRetails = async (_req, res) => {
  try {
    const [data] = await jadwalHarianModel.getActiveJadwalRetails();
    res.json({
      message: "Get active jadwal-harian retails success",
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

// Download template Excel jadwal-harian. Sheet 1: header + baris contoh.
// Sheet 2: referensi daftar tipe_absen (admin tahu id yg valid).
const getImportTemplate = async (_req, res) => {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: template
    const header = [
      "user_id",
      "tanggal",
      "absen_masuk_id",
      "absen_keluar_id",
      "retail_id",
    ];
    const example = [
      {
        user_id: 123,
        tanggal: "2026-07-25",
        absen_masuk_id: 9,
        absen_keluar_id: 11,
        retail_id: 4,
      },
    ];
    const sheet1 = XLSX.utils.json_to_sheet(example, { header });
    XLSX.utils.book_append_sheet(wb, sheet1, "Jadwal Harian");

    // Sheet 2: referensi tipe_absen
    const [tipe] = await dbpool.query(
      `SELECT absen_id, name, description, kategori_absen
       FROM tipe_absen WHERE is_deleted = 0 ORDER BY name ASC`
    );
    const sheet2 = XLSX.utils.json_to_sheet(tipe);
    XLSX.utils.book_append_sheet(wb, sheet2, "Referensi Tipe Absen");

    const filename = `template-jadwal-harian-${moment()
      .tz(timezone)
      .format("YYYYMMDD_HHmmss")}.xlsx`;
    const outPath = path.join(TEMP_DIR, filename);
    XLSX.writeFile(wb, outPath);

    res.download(outPath, "template-jadwal-harian.xlsx", () => {
      fs.unlink(outPath, () => {});
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal generate template.",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

// Import Excel jadwal-harian. Upload file → parse → validasi → group per
// retail_id+tanggal → panggil setJadwalByDate per group. Partial success.
const importJadwal = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "File Excel wajib diupload (field 'file').",
      status: "failed",
      status_code: "400",
    });
  }

  const filePath = req.file.path;
  const errors = [];
  const groupsInserted = [];
  let inserted = 0;
  let skipped = 0;

  try {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (rows.length === 0) {
      return res.status(400).json({
        message: "Sheet kosong.",
        status: "failed",
        status_code: "400",
      });
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      return res.status(400).json({
        message: `Maksimum ${MAX_IMPORT_ROWS} baris. File punya ${rows.length}.`,
        status: "failed",
        status_code: "400",
      });
    }

    // Validasi header
    const required = ["user_id", "tanggal", "absen_masuk_id", "absen_keluar_id"];
    const sample = rows[0];
    const sampleKeys = Object.keys(sample).map((k) => k.toLowerCase().trim());
    const missing = required.filter((r) => !sampleKeys.includes(r));
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Header wajib hilang: ${missing.join(", ")}. Download template untuk format benar.`,
        status: "failed",
        status_code: "400",
      });
    }

    // Normalisasi keys (case-insensitive)
    const norm = (r) => {
      const out = {};
      for (const k of Object.keys(r)) {
        out[k.toLowerCase().trim()] = r[k];
      }
      return out;
    };
    const normalized = rows.map(norm);

    // Pre-fetch validasi: bulk query untuk user, tipe_absen, retail
    const userIds = [...new Set(normalized.map((r) => Number(r.user_id)).filter(Boolean))];
    const tipeIds = [
      ...new Set(
        normalized
          .flatMap((r) => [Number(r.absen_masuk_id), Number(r.absen_keluar_id)])
          .filter(Boolean)
      ),
    ];
    const retailIds = [
      ...new Set(normalized.map((r) => Number(r.retail_id)).filter(Boolean)),
    ];

    const [validUsers] = userIds.length
      ? await dbpool.query(`SELECT user_id FROM user WHERE is_deleted = 0 AND user_id IN (?)`, [userIds])
      : [[]];
    const [validTipe] = tipeIds.length
      ? await dbpool.query(`SELECT absen_id FROM tipe_absen WHERE is_deleted = 0 AND absen_id IN (?)`, [tipeIds])
      : [[]];
    const [validRetail] = retailIds.length
      ? await dbpool.query(`SELECT retail_id FROM retail WHERE is_deleted = 0 AND retail_id IN (?)`, [retailIds])
      : [[]];

    const userSet = new Set(validUsers.map((r) => Number(r.user_id)));
    const tipeSet = new Set(validTipe.map((r) => Number(r.absen_id)));
    const retailSet = new Set(validRetail.map((r) => Number(r.retail_id)));

    // Validasi per row
    const validRows = [];
    normalized.forEach((r, idx) => {
      const rowNumber = idx + 2; // +2 karena header di row 1
      const userId = Number(r.user_id);
      const masukId = Number(r.absen_masuk_id);
      const keluarId = Number(r.absen_keluar_id);
      const retailId = Number(r.retail_id);
      const tanggal = String(r.tanggal || "").trim();

      if (!userId || !masukId || !keluarId || !tanggal || !retailId) {
        errors.push({ row: rowNumber, error: "Field wajib kosong." });
        skipped++;
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
        errors.push({ row: rowNumber, error: `Format tanggal salah: ${tanggal}` });
        skipped++;
        return;
      }
      if (!userSet.has(userId)) {
        errors.push({ row: rowNumber, error: `user_id ${userId} tidak ditemukan.` });
        skipped++;
        return;
      }
      if (!tipeSet.has(masukId) || !tipeSet.has(keluarId)) {
        errors.push({ row: rowNumber, error: `absen_type_id tidak valid (masuk=${masukId}, keluar=${keluarId}).` });
        skipped++;
        return;
      }
      if (!retailSet.has(retailId)) {
        errors.push({ row: rowNumber, error: `retail_id ${retailId} tidak ditemukan.` });
        skipped++;
        return;
      }
      validRows.push({ user_id: userId, tanggal, absen_masuk_id: masukId, absen_keluar_id: keluarId, retail_id: retailId });
    });

    // Group by retail_id + tanggal
    const groupMap = new Map();
    for (const r of validRows) {
      const key = `${r.retail_id}|${r.tanggal}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, { retail_id: r.retail_id, tanggal: r.tanggal, assignments: [] });
      }
      groupMap.get(key).assignments.push({
        user_id: r.user_id,
        absen_masuk_id: r.absen_masuk_id,
        absen_keluar_id: r.absen_keluar_id,
      });
    }

    // Insert per group via setJadwalByDate existing
    const meta = {
      at: moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
      by: req.user?.id ? String(req.user.id) : null,
    };
    for (const g of groupMap.values()) {
      try {
        await jadwalHarianModel.setJadwalByDate(
          g.retail_id,
          g.tanggal,
          g.assignments,
          meta
        );
        inserted += g.assignments.length;
        groupsInserted.push({ retail_id: g.retail_id, tanggal: g.tanggal, count: g.assignments.length });
      } catch (e) {
        errors.push({
          row: 0,
          error: `Group retail=${g.retail_id} tanggal=${g.tanggal}: ${e.message || e}`,
        });
      }
    }

    res.json({
      message: "Import selesai.",
      status: "success",
      status_code: "200",
      data: {
        total_rows: rows.length,
        inserted,
        skipped,
        groups: groupsInserted.length,
        errors,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal parse/import Excel.",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  } finally {
    fs.unlink(filePath, () => {});
  }
};

module.exports = {
  getEligibleUsers,
  getActiveJadwalRetails,
  getEmployeesByRetail,
  getJadwal,
  getKategoriShift,
  getByDate,
  assign,
  setByDate,
  deleteJadwal,
  getImportTemplate,
  importJadwal,
};
