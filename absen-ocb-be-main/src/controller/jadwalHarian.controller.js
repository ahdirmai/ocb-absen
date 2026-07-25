const moment = require("moment-timezone");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const dbpool = require("../config/database");
const jadwalHarianModel = require("../models/jadwalHarian.model");

const timezone = "Asia/Makassar";

const MAX_IMPORT_ROWS = 5000;
const TEMP_DIR = path.resolve(__dirname, "../../public/laporan");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// --- Helper matrix template/import ---
// Layout kolom: 1=Id, 2=Nama, 3=OC, 4=retail_id(hidden), 5..=hari 1..N.
const COL_ID = 1;
const COL_NAMA = 2;
const COL_OC = 3;
const COL_RETAIL_ID = 4;
const COL_DAY_START = 5; // hari ke-1 di kolom E
const HEADER_ROW = 2; // baris header (row 1 = meta bulan)

// Hanya OC 1..40 (selaras filter FE JadwalHarian.jsx).
const OC_RE = /^OC\s*0*(\d{1,2})$/i;
const isOcRetail = (name) => {
  const m = String(name).trim().match(OC_RE);
  if (!m) return false;
  const n = Number(m[1]);
  return n >= 1 && n <= 40;
};
const ocNumber = (name) => {
  const m = String(name).trim().match(OC_RE);
  return m ? Number(m[1]) : 9999;
};

// exceljs cell.value bisa string / number / objek (richText/formula). Ambil teks polos.
const cellText = (v) => {
  if (v == null) return "";
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("");
    if (v.text != null) return String(v.text);
    if (v.result != null) return String(v.result);
    return "";
  }
  return String(v);
};

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

// Label shift untuk dropdown & mapping import. Format: "S1 PAGI (Pagi)".
// Encode ke absen_masuk_id/absen_keluar_id via map label->pair.
const shiftLabel = (k) => `${k.shift_name} (${k.kategori_absen})`;

// Download template Excel jadwal-harian (MATRIX, per bulan).
// Baris = karyawan OC aktif (dikelompok per OC dgn baris judul), kolom = Id, Nama,
// OC, retail_id(hidden), lalu 1..N tanggal bulan tsb. Tiap sel tanggal punya
// dropdown (data validation) berisi semua shift OC + prefill jadwal existing.
// ?month=YYYY-MM (default bulan berjalan).
const getImportTemplate = async (req, res) => {
  try {
    const month =
      req.query.month && /^\d{4}-\d{2}$/.test(req.query.month)
        ? req.query.month
        : moment().tz(timezone).format("YYYY-MM");

    const monthStart = moment.tz(`${month}-01`, "YYYY-MM-DD", timezone);
    const daysInMonth = monthStart.daysInMonth();

    // Data: OC aktif + karyawan, shift options, jadwal existing bulan tsb.
    const [[rows], [kategori], [existing]] = await Promise.all([
      jadwalHarianModel.getActiveRetailEmployees(),
      jadwalHarianModel.getKategoriShift(),
      jadwalHarianModel.getJadwalByMonth(month, null),
    ]);

    const shiftOptions = (kategori || []).filter(
      (k) => k.absen_masuk_id && k.absen_keluar_id
    );
    // Map absen_masuk_id -> label (untuk prefill existing dari jadwal).
    const masukIdToLabel = new Map(
      shiftOptions.map((k) => [Number(k.absen_masuk_id), shiftLabel(k)])
    );
    // Map "user_id|tanggal" -> label shift existing.
    const existingMap = new Map();
    for (const r of existing || []) {
      const lbl = masukIdToLabel.get(Number(r.absen_masuk_id));
      if (lbl) existingMap.set(`${r.user_id}|${r.tanggal}`, lbl);
    }

    // Filter OC 1..40 + group per retail.
    const byRetail = new Map();
    for (const r of rows || []) {
      if (!isOcRetail(r.retail_name)) continue;
      if (!byRetail.has(r.retail_id)) {
        byRetail.set(r.retail_id, {
          retail_id: r.retail_id,
          retail_name: r.retail_name,
          users: [],
        });
      }
      byRetail.get(r.retail_id).users.push({
        user_id: r.user_id,
        user_name: r.user_name,
      });
    }
    const ocGroups = [...byRetail.values()].sort(
      (a, b) => ocNumber(a.retail_name) - ocNumber(b.retail_name)
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Jadwal Harian");

    // Sheet referensi shift (dropdown source + panduan).
    const refWs = wb.addWorksheet("Referensi Shift");
    refWs.columns = [
      { header: "Pilihan Shift (untuk dropdown)", key: "label", width: 34 },
      { header: "Kategori", key: "kat", width: 12 },
    ];
    shiftOptions.forEach((k) =>
      refWs.addRow({ label: shiftLabel(k), kat: k.kategori_absen })
    );
    const optCount = shiftOptions.length;

    // Baris 1: judul bulan. Baris 2 (HEADER_ROW): header kolom.
    ws.mergeCells(1, COL_ID, 1, COL_DAY_START + daysInMonth - 1);
    ws.getCell(1, COL_ID).value = `Jadwal Harian — ${monthStart.format(
      "MMMM YYYY"
    )} (pilih shift via dropdown di tiap sel tanggal)`;
    ws.getCell(1, COL_ID).font = { bold: true, size: 12 };

    const headerCells = ["Id", "Nama", "OC", "retail_id"];
    headerCells.forEach((h, i) => {
      const c = ws.getCell(HEADER_ROW, COL_ID + i);
      c.value = h;
      c.font = { bold: true };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9ECEF" } };
    });
    for (let d = 1; d <= daysInMonth; d++) {
      const c = ws.getCell(HEADER_ROW, COL_DAY_START + d - 1);
      c.value = d;
      c.font = { bold: true };
      c.alignment = { horizontal: "center" };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9ECEF" } };
    }

    ws.getColumn(COL_ID).width = 8;
    ws.getColumn(COL_NAMA).width = 26;
    ws.getColumn(COL_OC).width = 10;
    ws.getColumn(COL_RETAIL_ID).hidden = true;
    for (let d = 1; d <= daysInMonth; d++) {
      ws.getColumn(COL_DAY_START + d - 1).width = 16;
    }

    // Dropdown formula: referensi rentang sheet Referensi Shift.
    const dvFormula =
      optCount > 0
        ? [`'Referensi Shift'!$A$2:$A$${optCount + 1}`]
        : null;

    let rowIdx = HEADER_ROW + 1;
    for (const g of ocGroups) {
      // Baris judul OC (merge lebar).
      ws.mergeCells(rowIdx, COL_ID, rowIdx, COL_DAY_START + daysInMonth - 1);
      const gc = ws.getCell(rowIdx, COL_ID);
      gc.value = g.retail_name;
      gc.font = { bold: true, color: { argb: "FFFFFFFF" } };
      gc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D6EFD" } };
      rowIdx++;

      for (const u of g.users) {
        ws.getCell(rowIdx, COL_ID).value = u.user_id;
        ws.getCell(rowIdx, COL_NAMA).value = u.user_name;
        ws.getCell(rowIdx, COL_OC).value = g.retail_name;
        ws.getCell(rowIdx, COL_RETAIL_ID).value = g.retail_id;

        for (let d = 1; d <= daysInMonth; d++) {
          const tanggal = monthStart.clone().date(d).format("YYYY-MM-DD");
          const cell = ws.getCell(rowIdx, COL_DAY_START + d - 1);
          const pre = existingMap.get(`${u.user_id}|${tanggal}`);
          if (pre) cell.value = pre;
          if (dvFormula) {
            cell.dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: dvFormula,
              showErrorMessage: true,
              errorTitle: "Shift tidak valid",
              error: "Pilih shift dari dropdown.",
            };
          }
        }
        rowIdx++;
      }
    }

    ws.views = [{ state: "frozen", xSplit: COL_OC, ySplit: HEADER_ROW }];

    const filename = `template-jadwal-harian-${month}-${moment()
      .tz(timezone)
      .format("YYYYMMDD_HHmmss")}.xlsx`;
    const outPath = path.join(TEMP_DIR, filename);
    await wb.xlsx.writeFile(outPath);

    res.download(outPath, `template-jadwal-harian-${month}.xlsx`, () => {
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

// Import Excel jadwal-harian (MATRIX). Parse baris user (Id/Nama/OC/retail_id +
// kolom tanggal berlabel angka hari di HEADER_ROW). Tiap sel berisi label shift
// ("S1 PAGI (Pagi)") -> map ke absen_masuk_id/absen_keluar_id. Upsert non-destruktif
// via assignJadwal (sel kosong = tak diubah, TIDAK menghapus jadwal existing).
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
  let inserted = 0;
  let skipped = 0;
  let totalCells = 0;

  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.getWorksheet("Jadwal Harian") || wb.worksheets[0];
    if (!ws) {
      return res.status(400).json({
        message: "Sheet 'Jadwal Harian' tidak ditemukan.",
        status: "failed",
        status_code: "400",
      });
    }

    // Peta label shift -> {masuk_id, keluar_id}. Normalisasi lower+trim.
    const [kategori] = await jadwalHarianModel.getKategoriShift();
    const labelToShift = new Map();
    for (const k of kategori || []) {
      if (!k.absen_masuk_id || !k.absen_keluar_id) continue;
      labelToShift.set(shiftLabel(k).toLowerCase().trim(), {
        absen_masuk_id: Number(k.absen_masuk_id),
        absen_keluar_id: Number(k.absen_keluar_id),
      });
      // Terima juga hanya nama shift tanpa "(kategori)".
      labelToShift.set(String(k.shift_name).toLowerCase().trim(), {
        absen_masuk_id: Number(k.absen_masuk_id),
        absen_keluar_id: Number(k.absen_keluar_id),
      });
    }

    // Baca header: kolom tanggal (COL_DAY_START..) berisi angka hari.
    const headerRow = ws.getRow(HEADER_ROW);
    const dayColMap = []; // [{col, day}]
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (colNumber < COL_DAY_START) return;
      const day = Number(cellText(cell.value).trim());
      if (Number.isInteger(day) && day >= 1 && day <= 31) {
        dayColMap.push({ col: colNumber, day });
      }
    });
    if (dayColMap.length === 0) {
      return res.status(400).json({
        message:
          "Header kolom tanggal tidak ditemukan. Gunakan template terbaru (Download Template).",
        status: "failed",
        status_code: "400",
      });
    }

    // Tentukan bulan/tahun dari judul baris 1 (mis. "... — July 2026 ...").
    const titleText = cellText(ws.getRow(1).getCell(COL_ID).value);
    const mTitle = moment(
      titleText.replace(/^.*—\s*/, "").replace(/\s*\(.*$/, "").trim(),
      "MMMM YYYY"
    );
    const monthYear = mTitle.isValid()
      ? mTitle
      : moment().tz(timezone); // fallback bulan berjalan

    // Kumpulkan baris valid.
    const collected = []; // {user_id, retail_id, tanggal, absen_masuk_id, absen_keluar_id}
    const userIds = new Set();
    const retailIds = new Set();

    const lastRow = ws.rowCount;
    for (let r = HEADER_ROW + 1; r <= lastRow; r++) {
      const row = ws.getRow(r);
      const userId = Number(cellText(row.getCell(COL_ID).value).trim());
      const retailId = Number(cellText(row.getCell(COL_RETAIL_ID).value).trim());
      // Baris judul OC / kosong: tak ada user_id numerik -> lewati diam.
      if (!userId || !retailId) continue;
      userIds.add(userId);
      retailIds.add(retailId);

      for (const { col, day } of dayColMap) {
        const raw = cellText(row.getCell(col).value).trim();
        if (!raw) continue; // sel kosong = tak diubah
        totalCells++;
        const shift = labelToShift.get(raw.toLowerCase());
        if (!shift) {
          errors.push({
            row: r,
            error: `Shift "${raw}" tidak dikenal (baris user ${userId}, hari ${day}).`,
          });
          skipped++;
          continue;
        }
        const tanggal = monthYear.clone().date(day).format("YYYY-MM-DD");
        collected.push({
          user_id: userId,
          retail_id: retailId,
          tanggal,
          absen_masuk_id: shift.absen_masuk_id,
          absen_keluar_id: shift.absen_keluar_id,
        });
      }
    }

    if (totalCells > MAX_IMPORT_ROWS) {
      return res.status(400).json({
        message: `Maksimum ${MAX_IMPORT_ROWS} sel terisi. File punya ${totalCells}.`,
        status: "failed",
        status_code: "400",
      });
    }

    // Validasi user & retail exist (bulk).
    const [validUsers] = userIds.size
      ? await dbpool.query(
          `SELECT user_id FROM user WHERE is_deleted = 0 AND user_id IN (?)`,
          [[...userIds]]
        )
      : [[]];
    const [validRetail] = retailIds.size
      ? await dbpool.query(
          `SELECT retail_id FROM retail WHERE is_deleted = 0 AND retail_id IN (?)`,
          [[...retailIds]]
        )
      : [[]];
    const userSet = new Set(validUsers.map((x) => Number(x.user_id)));
    const retailSet = new Set(validRetail.map((x) => Number(x.retail_id)));

    const now = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
    const createdBy = req.user?.id ? String(req.user.id) : null;
    const upsertRows = [];
    for (const c of collected) {
      if (!userSet.has(c.user_id)) {
        errors.push({ row: 0, error: `user_id ${c.user_id} tidak ditemukan.` });
        skipped++;
        continue;
      }
      if (!retailSet.has(c.retail_id)) {
        errors.push({ row: 0, error: `retail_id ${c.retail_id} tidak ditemukan.` });
        skipped++;
        continue;
      }
      upsertRows.push({
        user_id: c.user_id,
        tanggal: c.tanggal,
        retail_id: c.retail_id,
        absen_masuk_id: c.absen_masuk_id,
        absen_keluar_id: c.absen_keluar_id,
        created_at: now,
        created_by: createdBy,
      });
    }

    if (upsertRows.length > 0) {
      await jadwalHarianModel.assignJadwal(upsertRows);
      inserted = upsertRows.length;
    }

    res.json({
      message: "Import selesai.",
      status: "success",
      status_code: "200",
      data: {
        total_rows: totalCells,
        inserted,
        skipped,
        groups: 0,
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
