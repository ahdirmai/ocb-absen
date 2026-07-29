import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const VITE_API_URL = import.meta.env.VITE_API_URL;

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

  useEffect(() => {
    localStorage.setItem("rekap_mode", mode);
  }, [mode]);

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
      raw.sort((a, b) => {
        const ocA = a.retail_name.match(/^OC(\d+)/i);
        const ocB = b.retail_name.match(/^OC(\d+)/i);
        if (!ocA && !ocB) return a.retail_name.localeCompare(b.retail_name);
        if (!ocA) return -1;
        if (!ocB) return 1;
        return parseInt(ocA[1]) - parseInt(ocB[1]);
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

  const applyDataCell = (cell, status, isNameCol = false) => {
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    cell.alignment = { horizontal: isNameCol ? "left" : "center", vertical: "middle" };
    cell.font = { size: 9 };
    if (!isNameCol) {
      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.belum;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cfg.excelBg } };
      if (status === "terlambat") cell.font = { size: 9, color: { argb: "FF000000" } };
      else if (status !== "belum") cell.font = { size: 9, color: { argb: "FFffffff" } };
    }
  };

  const exportExcel = async () => {
    if (!data.length) return;
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();

      const isStrict = mode === "strict";

      // ── Sheet 1: Rekap ringkasan ──
      const wsSummary = wb.addWorksheet("Rekap");
      // Kolom dinamis: Lembur selalu; Tidak Lengkap hanya strict.
      const summaryHeader = ["No", "Retail", "Nama Karyawan", "Hadir", "Terlambat"];
      if (isStrict) summaryHeader.push("Tidak Lengkap");
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
        Terlambat: { bg: "FFffc107", font: "FF000000" },
        "Tidak Lengkap": { bg: "FFfb8c00", font: "FFffffff" },
        Lembur: { bg: "FF1e88e5", font: "FFffffff" },
        Alpha: { bg: "FFdc3545", font: "FFffffff" },
        Libur: { bg: "FFadb5bd", font: "FFffffff" },
      };

      let no = 1;
      for (const retail of data) {
        for (const user of retail.users) {
          let hadir = 0, terlambat = 0, tidakLengkap = 0, lembur = 0, alpha = 0, libur = 0;
          for (let d = 1; d <= daysInMonth; d++) {
            const cell = user.attendance[d] || { status: "belum" };
            const s = resolveStatus(cell, mode);
            if (s === "hadir") hadir++;
            else if (s === "terlambat") terlambat++;
            else if (s === "tidak_lengkap") tidakLengkap++;
            else if (s === "alpha") alpha++;
            else if (s === "libur") libur++;
            if (typeof cell === "object" && cell.lembur === true) lembur++;
          }
          const rowVals = [no++, retail.retail_name, user.name, hadir, terlambat];
          if (isStrict) rowVals.push(tidakLengkap);
          rowVals.push(lembur, alpha, libur);
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

      // ── Sheet 2+: Detail per retail ──
      for (const retail of data) {
        const ws = wb.addWorksheet(retail.retail_name.slice(0, 31));
        const headerRow = ["Nama Karyawan"];
        for (let d = 1; d <= daysInMonth; d++) {
          headerRow.push(`${String(d).padStart(2, "0")}\n${dayNames[d - 1]}`);
        }
        const hRow = ws.addRow(headerRow);
        hRow.height = 30;
        hRow.eachCell((cell, colNum) => {
          const isWeekend = colNum > 1 && (dayNames[colNum - 2] === "Min" || dayNames[colNum - 2] === "Sab");
          applyHeaderStyle(cell, isWeekend);
        });
        ws.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
        ws.getColumn(1).width = 28;
        for (let d = 1; d <= daysInMonth; d++) ws.getColumn(d + 1).width = 10;

        for (const user of retail.users) {
          const rowData = [user.name];
          const cellMeta = [null];
          for (let d = 1; d <= daysInMonth; d++) {
            const cell = user.attendance[d] || { status: "belum", time: null };
            const status = resolveStatus(cell, mode);
            const time = typeof cell === "object" ? cell.time : null;
            const isLembur = typeof cell === "object" && cell.lembur === true;
            let text = time ? time : status === "libur" ? "Libur" : status === "alpha" ? "Alpha" : status === "tidak_lengkap" ? "Tdk Lengkap" : "-";
            if (isLembur) text = `${text} (L)`;
            rowData.push(text);
            cellMeta.push({ status, time, isLembur });
          }
          const dataRow = ws.addRow(rowData);
          dataRow.height = 20;
          dataRow.eachCell((exCell, colNum) => {
            const meta = cellMeta[colNum - 1];
            applyDataCell(exCell, meta?.status, colNum === 1);
            if (meta?.isLembur && colNum > 1) {
              exCell.border = {
                top: { style: "medium", color: { argb: "FF1e88e5" } },
                bottom: { style: "medium", color: { argb: "FF1e88e5" } },
                left: { style: "medium", color: { argb: "FF1e88e5" } },
                right: { style: "medium", color: { argb: "FF1e88e5" } },
              };
            }
          });
        }
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Rekap_Absensi_${month}_${mode}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Rekap Absensi Kalender</h3>
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
          <button className="btn btn-gradient-info btn-sm mb-1" onClick={fetchRekap}>
            Tampilkan
          </button>
          <button
            className="btn btn-success btn-sm mb-1"
            onClick={exportExcel}
            disabled={exporting || !data.length}
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
          if (key === "belum") return null;
          if (key === "tidak_lengkap" && mode !== "strict") return null;
          const labels = {
            hadir: "Hadir",
            terlambat: "Terlambat",
            tidak_lengkap: "Tidak Lengkap",
            alpha: "Alpha",
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

      {!loading && !error && data.map((retail) => (
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
                        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.belum;
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
                        return (
                          <td
                            key={d}
                            onMouseMove={(e) => tooltipText && showTooltip(e, tooltipText)}
                            onMouseLeave={hideTooltip}
                            style={{
                              ...tdStyle(28),
                              background: cfg.bg,
                              textAlign: "center",
                              cursor: "default",
                              position: "relative",
                              boxShadow: incompleteLate ? `inset 0 0 0 2px ${INCOMPLETE_BORDER}` : undefined,
                            }}
                          >
                            <span style={{ color: cfg.color, fontSize: 10, fontWeight: "bold" }}>
                              {cfg.label}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {!loading && !error && data.length === 0 && (
        <div className="alert alert-warning">Tidak ada data untuk bulan ini.</div>
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
