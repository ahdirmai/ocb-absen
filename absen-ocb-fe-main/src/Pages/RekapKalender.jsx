import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Select from "react-select";
import { format } from "date-fns";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;

const STATUS_CONFIG = {
  hadir:         { bg: "#28a745", color: "#fff", label: "H", excelBg: "FF28a745" },
  terlambat:     { bg: "#ffc107", color: "#000", label: "T", excelBg: "FFffc107" },
  tidak_lengkap: { bg: "#fb8c00", color: "#fff", label: "TL", excelBg: "FFfb8c00" },
  alpha:         { bg: "#dc3545", color: "#fff", label: "A", excelBg: "FFdc3545" },
  libur:         { bg: "#adb5bd", color: "#fff", label: "L", excelBg: "FFadb5bd" },
  belum:         { bg: "#f8f9fa", color: "#ccc", label: "-", excelBg: "FFf8f9fa" },
};

const LEMBUR_DOT = "#1e88e5"; // penanda lembur (badge biru)
const INCOMPLETE_BORDER = "#fb8c00"; // penanda telat-tak-lengkap (border oranye)

// Derive status tampil dari mode + kelengkapan sesi.
//  moderat: apa adanya. strict: hadir-tak-lengkap → tidak_lengkap; telat-tak-
//  lengkap tetap terlambat (ditandai border, bukan ganti status).
const resolveStatus = (cell, mode) => {
  const status = typeof cell === "string" ? cell : cell?.status;
  if (mode !== "strict") return status;
  const complete = typeof cell === "object" ? cell?.complete : true;
  if (status === "hadir" && complete === false) return "tidak_lengkap";
  return status;
};

const RekapKalender = () => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
  const tooltipTimeout = useRef(null);
  // Mode rekap: "moderat" (hadir = ada masuk) | "strict" (wajib masuk+keluar).
  const [mode, setMode] = useState(() => localStorage.getItem("rekap_mode") || "moderat");
  // Filter kategori user (array id_category, kosong = semua).
  const [categoryFilter, setCategoryFilter] = useState([]);
  // Modal detail absen per hari.
  const [detail, setDetail] = useState(null); // { user, retail, dateStr, dateLabel, rows, loading }
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    localStorage.setItem("rekap_mode", mode);
  }, [mode]);

  // Daftar kategori unik dari data (untuk dropdown filter).
  const categoryOptions = useMemo(() => {
    const map = new Map();
    for (const retail of data) {
      for (const u of retail.users) {
        if (u.id_category != null && !map.has(u.id_category)) {
          map.set(u.id_category, u.category_name || `Kategori ${u.id_category}`);
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Data setelah filter kategori (multi): buang user tak cocok, retail kosong.
  const filteredData = useMemo(() => {
    if (!categoryFilter.length) return data;
    const ids = new Set(categoryFilter.map(Number));
    return data
      .map((retail) => ({
        ...retail,
        users: retail.users.filter((u) => ids.has(Number(u.id_category))),
      }))
      .filter((retail) => retail.users.length > 0);
  }, [data, categoryFilter]);

  const fetchRekap = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${VITE_API_URL}/absensi/rekap-kalender`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month },
      });
      const raw = res.data.data || [];
      // Sort natural OC: "OC 1" < "OC 2" < ... < "OC 10" (bukan 1,10,11).
      // Regex izinkan spasi/nol depan: "OC 1", "OC01", "OC-1".
      raw.sort((a, b) => {
        const ocA = a.retail_name.match(/^OC\s*0*(\d+)/i);
        const ocB = b.retail_name.match(/^OC\s*0*(\d+)/i);
        if (!ocA && !ocB) return a.retail_name.localeCompare(b.retail_name);
        if (!ocA) return -1;
        if (!ocB) return 1;
        return parseInt(ocA[1], 10) - parseInt(ocB[1], 10);
      });
      setData(raw);
      setDaysInMonth(res.data.days_in_month || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, []);

  // Ringkasan per user (dari resolveStatus + mode). Telat = BAGIAN dari hadir
  // (hadir total termasuk telat + tidak-lengkap). Lembur terpisah (bukan hadir).
  const summarizeUser = (user) => {
    let hadir = 0, terlambat = 0, tidakLengkap = 0, lembur = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = user.attendance[d] || { status: "belum" };
      const s = resolveStatus(cell, mode);
      // Hadir = semua yang absen masuk: hadir + telat + (strict) tidak_lengkap.
      if (s === "hadir" || s === "terlambat" || s === "tidak_lengkap") hadir++;
      if (s === "terlambat") terlambat++;
      if (s === "tidak_lengkap") tidakLengkap++;
      if (typeof cell === "object" && cell.lembur === true) lembur++;
    }
    return { hadir, terlambat, tidakLengkap, lembur };
  };

  // Klik sel → buka modal detail absen hari itu (fetch history user 1 hari).
  const openDetail = async (user, retail, d) => {
    const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dateLabel = `${String(d).padStart(2, "0")}/${String(mon).padStart(2, "0")}/${year}`;
    setDetail({ user, retail, dateStr, dateLabel, rows: [], loading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${VITE_API_URL}/absensi/history-user/${user.user_id}`,
        { start_date: dateStr, end_date: dateStr },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const rows = (res.data.data || []).sort(
        (a, b) => new Date(a.absen_time).getTime() - new Date(b.absen_time).getTime()
      );
      setDetail((prev) => (prev ? { ...prev, rows, loading: false } : prev));
    } catch (err) {
      setDetail((prev) =>
        prev ? { ...prev, rows: [], loading: false, error: err.response?.data?.message || err.message } : prev
      );
    }
  };

  const showTooltip = (e, text) => {
    clearTimeout(tooltipTimeout.current);
    setTooltip({ visible: true, text, x: e.clientX + 12, y: e.clientY + 12 });
  };
  const hideTooltip = () => {
    tooltipTimeout.current = setTimeout(() => setTooltip((t) => ({ ...t, visible: false })), 100);
  };

  const [year, mon] = month.split("-").map(Number);
  const dayNames = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, mon - 1, d));
    const dayName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][date.getUTCDay()];
    dayNames.push(dayName);
  }

  const applyHeaderStyle = (cell, isWeekend = false) => {
    cell.font = { bold: true, size: 10, color: { argb: isWeekend ? "FFdc3545" : "FF000000" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFe9ecef" } };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  };


  const exportExcel = async () => {
    const exportData = filteredData;
    if (!exportData.length) return;
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();

      const isStrict = mode === "strict";

      // ── Sheet 1: Rekap ringkasan ──
      const wsSummary = wb.addWorksheet("Rekap");
      // Hadir = total (termasuk telat + TL). "Dari Telat"/"Dari TL" = subset hadir.
      // Kolom dinamis: Lembur selalu; Dari TL hanya strict.
      const summaryHeader = ["No", "Retail", "Nama Karyawan", "Hadir", "Dari Telat"];
      if (isStrict) summaryHeader.push("Dari TL");
      summaryHeader.push("Lembur", "Alpha", "Libur");
      const shRow = wsSummary.addRow(summaryHeader);
      shRow.height = 22;
      shRow.eachCell((cell) => applyHeaderStyle(cell));
      wsSummary.getColumn(1).width = 5;
      wsSummary.getColumn(2).width = 22;
      wsSummary.getColumn(3).width = 28;
      for (let c = 4; c <= summaryHeader.length; c++) wsSummary.getColumn(c).width = 13;
      wsSummary.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

      // Warna per nama kolom (biar tak tergantung indeks yg berubah krn mode).
      const colColor = {
        Hadir: { bg: "FF28a745", font: "FFffffff" },
        "Dari Telat": { bg: "FFffc107", font: "FF000000" },
        "Dari TL": { bg: "FFfb8c00", font: "FFffffff" },
        Lembur: { bg: "FF1e88e5", font: "FFffffff" },
        Alpha: { bg: "FFdc3545", font: "FFffffff" },
        Libur: { bg: "FFadb5bd", font: "FFffffff" },
      };

      let no = 1;
      for (const retail of exportData) {
        for (const user of retail.users) {
          // hadir = summarizeUser.hadir (sudah termasuk telat + tidak_lengkap).
          const sm = summarizeUser(user);
          let alpha = 0, libur = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const cell = user.attendance[d] || { status: "belum" };
            const s = resolveStatus(cell, mode);
            if (s === "alpha") alpha++;
            else if (s === "libur") libur++;
          }
          const rowVals = [no++, retail.retail_name, user.name, sm.hadir, sm.terlambat];
          if (isStrict) rowVals.push(sm.tidakLengkap);
          rowVals.push(sm.lembur, alpha, libur);
          const r = wsSummary.addRow(rowVals);
          r.height = 18;
          [1, 2, 3].forEach((col) => {
            r.getCell(col).border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
            r.getCell(col).alignment = { vertical: "middle" };
            r.getCell(col).font = { size: 9 };
          });
          for (let col = 4; col <= summaryHeader.length; col++) {
            const cc = colColor[summaryHeader[col - 1]] || { bg: "FFffffff", font: "FF000000" };
            const c = r.getCell(col);
            c.alignment = { horizontal: "center", vertical: "middle" };
            c.font = { bold: true, size: 9, color: { argb: cc.font } };
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cc.bg } };
            c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
          }
        }
      }

      // ── Sheet per-orang: detail vertikal TGL/HARI/STATUS/KETERANGAN ──
      const usedNames = new Set();
      const safeSheetName = (base) => {
        let name = base.replace(/[\\/*?:[\]]/g, " ").slice(0, 31).trim() || "Sheet";
        let n = name, i = 2;
        while (usedNames.has(n)) { n = `${name.slice(0, 28)} ${i++}`; }
        usedNames.add(n);
        return n;
      };

      for (const retail of exportData) {
        for (const user of retail.users) {
          const ws = wb.addWorksheet(safeSheetName(`${user.name} ${retail.retail_name}`));
          ws.getColumn(1).width = 6;
          ws.getColumn(2).width = 6;
          ws.getColumn(3).width = 16;
          ws.getColumn(4).width = 30;

          // Judul: nama + meta (OC · ID OCB · Period).
          ws.getCell("A1").value = user.name;
          ws.getCell("A1").font = { bold: true, size: 13 };
          ws.getCell("A2").value = `${retail.retail_name} · ID OCB: ${user.username || "-"} · Period ${month}`;
          ws.getCell("A2").font = { size: 10, color: { argb: "FF64748b" } };

          // Header tabel (row 4).
          const head = ws.getRow(4);
          ["TGL", "HARI", "STATUS", "KETERANGAN"].forEach((t, i) => {
            const c = head.getCell(i + 1);
            c.value = t;
            c.font = { bold: true, size: 10 };
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
            c.alignment = { horizontal: i < 3 ? "center" : "left", vertical: "middle" };
            c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
          });
          head.height = 18;

          const sm = summarizeUser(user);
          // Baris per tanggal mulai row 5.
          for (let d = 1; d <= daysInMonth; d++) {
            const cell = user.attendance[d] || { status: "belum", time: null };
            const rawStatus = resolveStatus(cell, mode);
            const isLembur = typeof cell === "object" && cell.lembur === true;
            const time = typeof cell === "object" ? cell.time : null;

            // Label STATUS + warna.
            let label = "—", fillArgb = null, fontArgb = "FF334155";
            if (rawStatus === "hadir") { label = "Hadir"; fillArgb = "FFDCFCE7"; fontArgb = "FF166534"; }
            else if (rawStatus === "terlambat") { label = "Telat"; fillArgb = "FFFEF9C3"; fontArgb = "FF854d0e"; }
            else if (rawStatus === "tidak_lengkap") { label = "Tidak Lengkap"; fillArgb = "FFFFEDD5"; fontArgb = "FF9a3412"; }
            else if (rawStatus === "libur") { label = "Libur"; fillArgb = "FFF1F5F9"; fontArgb = "FF475569"; }
            // alpha/belum → "—" (tak ditandai).

            // KETERANGAN: jam absen + penanda.
            const ket = [];
            if (time) ket.push(time.includes(" ") ? time.split(" ").slice(1).join(" ") : time);
            if (rawStatus === "terlambat") ket.push("Telat");
            if (rawStatus === "tidak_lengkap") ket.push("Tidak absen keluar");
            if (isLembur) ket.push("Lembur");

            const r = ws.getRow(4 + d);
            const dow = dayNames[d - 1];
            r.getCell(1).value = d;
            r.getCell(2).value = dow;
            r.getCell(3).value = label;
            r.getCell(4).value = ket.join(" · ");
            r.getCell(1).alignment = { horizontal: "center" };
            r.getCell(2).alignment = { horizontal: "center" };
            r.getCell(2).font = { color: { argb: dow === "Min" || dow === "Sab" ? "FFdc3545" : "FF334155" } };
            const sc = r.getCell(3);
            sc.font = { bold: true, color: { argb: fontArgb } };
            sc.alignment = { horizontal: "center" };
            if (fillArgb) sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } };
            [1, 2, 3, 4].forEach((c) => {
              r.getCell(c).border = { top: { style: "hair" }, bottom: { style: "hair" }, left: { style: "hair" }, right: { style: "hair" } };
              if (r.getCell(c).font == null) r.getCell(c).font = { size: 10 };
            });
          }

          // Baris TOTAL.
          const totalRow = ws.getRow(5 + daysInMonth);
          totalRow.getCell(1).value = "TOTAL";
          totalRow.getCell(1).font = { bold: true };
          const totalParts = [`${sm.hadir} Hadir`, `${sm.terlambat} Telat`];
          if (isStrict) totalParts.push(`${sm.tidakLengkap} Tidak Lengkap`);
          totalParts.push(`${sm.lembur} Lembur`);
          totalRow.getCell(3).value = totalParts.join(" · ");
          totalRow.getCell(3).font = { bold: true };
          ws.mergeCells(5 + daysInMonth, 3, 5 + daysInMonth, 4);
        }
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const catLabel = categoryFilter.length
        ? "_" + (categoryFilter.length === 1
            ? (categoryOptions.find((c) => String(c.id) === String(categoryFilter[0]))?.name || "kat")
                .replace(/[^a-zA-Z0-9]+/g, "-")
            : `${categoryFilter.length}kategori`)
        : "";
      saveAs(blob, `Detail_Absen_perOrang_${month}_${mode}${catLabel}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const totalUser = filteredData.reduce((acc, r) => acc + r.users.length, 0);

  return (
    <div className="content-wrapper">
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap">
        <h3 className="page-title mb-0">Rekap Absensi Kalender</h3>
        {!loading && !error && data.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="badge" style={{ background: "#eef4fb", color: "#1a5276", fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>
              <i className="mdi mdi-store"></i> {filteredData.length} OC/Retail
            </span>
            <span className="badge" style={{ background: "#e8f5e9", color: "#2e7d32", fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>
              <i className="mdi mdi-account-group"></i> {totalUser} karyawan
            </span>
            {categoryFilter.length > 0 && (
              <span className="badge" style={{ background: "#fff3e0", color: "#e65100", fontSize: 12, padding: "6px 12px", borderRadius: 8 }}>
                <i className="mdi mdi-filter"></i>{" "}
                {categoryFilter.length === 1
                  ? categoryOptions.find((c) => String(c.id) === String(categoryFilter[0]))?.name
                  : `${categoryFilter.length} kategori`}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="row mb-3">
        <div className="col-md-7 d-flex align-items-end gap-2 flex-wrap">
          <div style={{ minWidth: 160 }}>
            <label>Bulan:</label>
            <input
              type="month"
              className="form-control"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          {/* Toggle mode */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#607d8b", fontWeight: 600 }}>Mode</label>
            <div style={{ display: "inline-flex", background: "#eceff1", borderRadius: 999, padding: 3 }}>
              {[
                { key: "moderat", label: "Moderat" },
                { key: "strict", label: "Strict" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setMode(opt.key)}
                  title={opt.key === "strict" ? "Wajib absen masuk DAN keluar" : "Cukup absen masuk"}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: mode === opt.key ? "#e74c3c" : "transparent",
                    color: mode === opt.key ? "#fff" : "#607d8b",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Filter kategori (multi) */}
          <div style={{ minWidth: 260 }}>
            <label style={{ display: "block", fontSize: 12, color: "#607d8b", fontWeight: 600 }}>Kategori</label>
            <Select
              isMulti
              options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
              value={categoryFilter.map((id) => ({
                value: id,
                label: categoryOptions.find((c) => String(c.id) === String(id))?.name || id,
              }))}
              onChange={(opts) => setCategoryFilter((opts || []).map((o) => o.value))}
              placeholder="Semua Kategori"
              closeMenuOnSelect={false}
              menuPosition="fixed"
            />
          </div>
          <button className="btn btn-gradient-info btn-sm mb-1" onClick={fetchRekap}>
            Tampilkan
          </button>
          <button
            className="btn btn-success btn-sm mb-1"
            onClick={exportExcel}
            disabled={exporting || !filteredData.length}
            style={{ whiteSpace: "nowrap" }}
          >
            {exporting ? "..." : "Export Excel"}
          </button>
        </div>
      </div>

      {mode === "strict" && (
        <div className="alert alert-warning py-2 mb-3" style={{ fontSize: 13 }}>
          <b>Mode Strict:</b> hari absen masuk tanpa absen keluar ditandai <b>Tidak Lengkap</b> (oranye).
          Telat tanpa keluar tetap Telat dengan border oranye.
        </div>
      )}

      {/* Legend */}
      <div className="d-flex gap-3 mb-3 flex-wrap align-items-center">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          if (key === "belum" || key === "alpha") return null;
          if (key === "tidak_lengkap" && mode !== "strict") return null;
          const labels = {
            hadir: "Hadir",
            terlambat: "Terlambat",
            tidak_lengkap: "Tidak Lengkap",
            libur: "Libur/Off",
          };
          return (
            <div key={key} className="d-flex align-items-center gap-1">
              <div style={{ width: 18, height: 18, background: cfg.bg, borderRadius: 3, border: "1px solid #ddd" }} />
              <small>{labels[key]}</small>
            </div>
          );
        })}
        <div className="d-flex align-items-center gap-1">
          <div style={{ width: 18, height: 18, background: "#28a745", borderRadius: 3, border: "1px solid #ddd", position: "relative" }}>
            <span style={{ position: "absolute", top: 1, right: 1, width: 6, height: 6, borderRadius: "50%", background: LEMBUR_DOT, border: "1px solid #fff" }} />
          </div>
          <small>Lembur</small>
        </div>
      </div>

      {loading && <p>Loading data...</p>}
      {error && <p className="text-danger">Error: {error}</p>}

      {!loading && !error && filteredData.map((retail) => (
        <div key={retail.retail_id} className="card mb-4">
          <div className="card-header py-2">
            <h5 className="mb-0 card-title">{retail.retail_name}</h5>
          </div>
          <div className="card-body p-0">
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", minWidth: "100%", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f4f4f4" }}>
                    <th style={thStyle(160, true)}>Nama Karyawan</th>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <th
                        key={d}
                        style={{
                          ...thStyle(28),
                          color: dayNames[d - 1] === "Min" || dayNames[d - 1] === "Sab" ? "#dc3545" : "#333",
                        }}
                      >
                        <div>{d}</div>
                        <div style={{ fontSize: 9, fontWeight: "normal" }}>{dayNames[d - 1]}</div>
                      </th>
                    ))}
                    {/* Kolom rekap di akhir. Telat & TL = bagian dari Hadir. */}
                    <th title="Total hari hadir (termasuk telat)" style={{ ...thStyle(44), background: "#e8f5e9", color: "#2e7d32", borderLeft: "2px solid #bbb" }}>Hadir</th>
                    <th title="Dari hadir, berapa yang telat" style={{ ...thStyle(44), background: "#fff8e1", color: "#ef6c00" }}>› Telat</th>
                    {mode === "strict" && (
                      <th title="Dari hadir, berapa yang tidak absen keluar" style={{ ...thStyle(44), background: "#fff3e0", color: "#e65100" }}>› TL</th>
                    )}
                    <th title="Lembur (terpisah dari hadir)" style={{ ...thStyle(44), background: "#e3f2fd", color: "#1565c0" }}>Lembur</th>
                  </tr>
                </thead>
                <tbody>
                  {retail.users.map((user) => (
                    <tr key={user.user_id}>
                      <td style={tdStyle(160, true)}>{user.name}</td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                        const cell = user.attendance[d] || { status: "belum", time: null };
                        const rawStatus = typeof cell === "string" ? cell : cell.status;
                        const status = resolveStatus(cell, mode);
                        const time = typeof cell === "object" ? cell.time : null;
                        const isLembur = typeof cell === "object" && cell.lembur === true;
                        const incompleteLate =
                          mode === "strict" && status === "terlambat" &&
                          typeof cell === "object" && cell.complete === false;
                        // Tandai hadir/telat/TL/libur saja. Alpha & belum → kosong (blank).
                        const displayStatus = status === "alpha" ? "belum" : status;
                        const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.belum;
                        const dateLabel = `${String(d).padStart(2, "0")}/${String(mon).padStart(2, "0")}/${year}`;
                        const parts = [];
                        if (time) parts.push(`Absen: ${time}`);
                        else if (rawStatus === "libur") parts.push(`${dateLabel} — Libur / Off`);
                        else if (rawStatus === "alpha") parts.push(`${dateLabel} — Alpha (tidak absen)`);
                        else if (rawStatus === "belum") parts.push(`${dateLabel} — Belum wajib absen`);
                        else parts.push(dateLabel);
                        if (status === "tidak_lengkap") parts.push("Tidak absen keluar");
                        if (incompleteLate) parts.push("Telat + tidak absen keluar");
                        if (isLembur) parts.push("Lembur (masuk 2x / flag lembur)");
                        const tooltipText = parts.join(" • ");
                        // Klik hanya bila ada absen (hadir/telat/TL) di hari itu.
                        const clickable = ["hadir", "terlambat", "tidak_lengkap"].includes(status);
                        return (
                          <td
                            key={d}
                            onMouseMove={(e) => tooltipText && showTooltip(e, tooltipText)}
                            onMouseLeave={hideTooltip}
                            onClick={() => clickable && openDetail(user, retail, d)}
                            style={{
                              ...tdStyle(28),
                              background: cfg.bg,
                              textAlign: "center",
                              cursor: clickable ? "pointer" : "default",
                              position: "relative",
                              boxShadow: incompleteLate ? `inset 0 0 0 2px ${INCOMPLETE_BORDER}` : undefined,
                            }}
                          >
                            <span style={{ color: cfg.color, fontSize: 10, fontWeight: "bold" }}>
                              {displayStatus === "belum" ? "" : cfg.label}
                            </span>
                            {isLembur && (
                              <span
                                title="Lembur"
                                style={{
                                  position: "absolute",
                                  top: 1,
                                  right: 1,
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: LEMBUR_DOT,
                                  border: "1px solid #fff",
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                      {(() => {
                        const sm = summarizeUser(user);
                        const recapCell = (val, bg, color) => (
                          <td style={{ ...tdStyle(40), textAlign: "center", background: bg, color, fontWeight: "bold", fontSize: 12 }}>
                            {val}
                          </td>
                        );
                        return (
                          <>
                            <td style={{ ...tdStyle(40), textAlign: "center", background: "#e8f5e9", color: "#2e7d32", fontWeight: "bold", fontSize: 12, borderLeft: "2px solid #bbb" }}>
                              {sm.hadir}
                            </td>
                            {recapCell(sm.terlambat, "#fff8e1", "#ef6c00")}
                            {mode === "strict" && recapCell(sm.tidakLengkap, "#fff3e0", "#e65100")}
                            {recapCell(sm.lembur, "#e3f2fd", "#1565c0")}
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {!loading && !error && filteredData.length === 0 && (
        <div className="alert alert-warning">
          {data.length === 0
            ? "Tidak ada data untuk bulan ini."
            : "Tidak ada karyawan untuk kategori ini."}
        </div>
      )}

      {tooltip.visible && (
        <div style={{
          position: "fixed",
          left: tooltip.x,
          top: tooltip.y,
          background: "#333",
          color: "#fff",
          padding: "4px 10px",
          borderRadius: 5,
          fontSize: 12,
          pointerEvents: "none",
          zIndex: 9999,
          whiteSpace: "nowrap",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}>
          {tooltip.text}
        </div>
      )}

      {/* Modal detail absen per hari */}
      {detail && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1050,
          }}
          onClick={() => setDetail(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 14, width: 520, maxWidth: "94%",
              maxHeight: "90vh", overflowY: "auto", padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h5 style={{ margin: 0, fontWeight: 700, color: "#263238" }}>
                  <i className="mdi mdi-calendar-clock" style={{ color: "#2471a3", marginRight: 6 }}></i>
                  Detail Absen
                </h5>
                <div style={{ fontSize: 12, color: "#90a4ae" }}>
                  {detail.user.name} · {detail.retail.retail_name} · {detail.dateLabel}
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                style={{ border: "none", background: "transparent", fontSize: 22, color: "#b0bec5", cursor: "pointer", lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {detail.loading ? (
              <div style={{ textAlign: "center", padding: 30, color: "#90a4ae" }}>
                <i className="mdi mdi-loading mdi-spin" style={{ fontSize: 26 }}></i>
                <p style={{ marginTop: 8 }}>Memuat...</p>
              </div>
            ) : detail.error ? (
              <div className="alert alert-danger">{detail.error}</div>
            ) : detail.rows.length === 0 ? (
              <div className="alert alert-warning">Tidak ada catatan absen pada tanggal ini.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {detail.rows.map((row) => {
                  const dir = row.sesi_direction ||
                    (String(row.description || "").toLowerCase().includes("keluar") ||
                     String(row.description || "").toLowerCase().includes("pulang") ? "keluar" : "masuk");
                  const isKeluar = dir === "keluar";
                  const telat = Number(row.status_absen) === 2;
                  const photo = row.photo_url ? `${VITE_API_IMAGE}${row.photo_url}` : null;
                  const isVid = photo && (photo.endsWith(".mp4") || photo.endsWith(".webm"));
                  return (
                    <div
                      key={row.absensi_id}
                      style={{
                        display: "flex", gap: 12, alignItems: "center",
                        border: "1px solid #eceff1", borderRadius: 12, padding: 12,
                        borderLeft: `4px solid ${isKeluar ? "#e53935" : "#43a047"}`,
                      }}
                    >
                      {photo ? (
                        isVid ? (
                          <video src={photo} onClick={() => setPreviewImg(photo)}
                            style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", cursor: "pointer", flexShrink: 0 }} />
                        ) : (
                          <img src={photo} alt="absen" onClick={() => setPreviewImg(photo)}
                            style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", cursor: "pointer", flexShrink: 0 }} />
                        )
                      ) : (
                        <div style={{ width: 54, height: 54, borderRadius: 10, background: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0bec5", flexShrink: 0 }}>
                          <i className="mdi mdi-image-off" style={{ fontSize: 22 }}></i>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                            background: isKeluar ? "#ffebee" : "#e8f5e9", color: isKeluar ? "#c62828" : "#2e7d32",
                          }}>
                            {isKeluar ? "Keluar" : "Masuk"}
                          </span>
                          {telat && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: "#fff8e1", color: "#ef6c00" }}>Telat</span>}
                          {(row.is_lembur === 1 || row.is_lembur === "1") && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: "#e3f2fd", color: "#1565c0" }}>Lembur</span>}
                          {Number(row.is_valid) !== 1 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: "#ffebee", color: "#c62828" }}>Invalid</span>}
                        </div>
                        <div style={{ fontWeight: 600, color: "#37474f", fontSize: 14, marginTop: 3 }}>
                          {row.absen_time ? format(new Date(row.absen_time), "HH:mm:ss") : "-"}
                          <span style={{ fontSize: 12, color: "#90a4ae", fontWeight: 400 }}> · {row.category_absen || row.description}</span>
                        </div>
                        {row.reason && (
                          <div style={{ fontSize: 12, color: "#607d8b", marginTop: 2 }}>
                            <i className="mdi mdi-note-text-outline"></i> {row.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview foto/video full */}
      {previewImg && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}
          onClick={() => setPreviewImg(null)}
        >
          {previewImg.endsWith(".mp4") || previewImg.endsWith(".webm") ? (
            <video src={previewImg} controls style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10 }} onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={previewImg} alt="preview" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10 }} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
};

const thStyle = (minWidth, sticky = false) => ({
  padding: "6px 4px",
  border: "1px solid #dee2e6",
  minWidth,
  textAlign: "center",
  whiteSpace: "nowrap",
  ...(sticky ? { position: "sticky", left: 0, background: "#f4f4f4", zIndex: 2 } : {}),
});

const tdStyle = (minWidth, sticky = false) => ({
  padding: "4px",
  border: "1px solid #dee2e6",
  minWidth,
  whiteSpace: "nowrap",
  ...(sticky ? { position: "sticky", left: 0, background: "#fff", zIndex: 1 } : {}),
});

export default RekapKalender;
