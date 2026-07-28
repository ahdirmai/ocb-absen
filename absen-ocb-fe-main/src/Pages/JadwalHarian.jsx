import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import {
  format,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import Select from "react-select";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const DAY_INITIAL = ["M", "S", "S", "R", "K", "J", "S"]; // Min..Sab

// Hanya tampilkan OC 1 - OC 40.
const isOcRetail = (name) => {
  const m = String(name).trim().match(/^OC\s*0*(\d{1,2})$/i);
  if (!m) return false;
  const n = Number(m[1]);
  return n >= 1 && n <= 40;
};
const ocNumber = (name) => Number(String(name).trim().match(/^OC\s*0*(\d{1,2})$/i)[1]);

// Warna sel per grup shift (deteksi dari nama shift: PAGI/SORE/SUBUH/MALAM).
const shiftColor = (shiftName) => {
  const k = String(shiftName || "").toLowerCase();
  if (k.includes("pagi")) return "#c8e6c9";
  if (k.includes("sore")) return "#ffe0b2";
  if (k.includes("malam") || k.includes("subuh")) return "#d1c4e9";
  return "#e0e0e0";
};
// Kode ringkas untuk sel matrix: ambil kode shift (S1, S2, T1...) dari nama.
const shiftCode = (shiftName) => {
  const s = String(shiftName || "").trim();
  const m = s.match(/^(S\d+|TRAINEE\s*\d+|T\d+)/i);
  if (m) return m[1].toUpperCase().replace(/\s+/g, "");
  return s.slice(0, 3).toUpperCase();
};

const CELL_BORDER = "1px solid #dee2e6";

// Deteksi viewport mobile (< 768px) untuk layout responsif.
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
};

const statChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "#fff",
  border: "1px solid #eceff1",
  borderRadius: "12px",
  padding: "8px 14px",
  fontSize: "12px",
  color: "#607d8b",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};
const statNum = { fontSize: "17px", fontWeight: 700, color: "#37474f" };

const JadwalHarian = () => {
  const isMobile = useIsMobile();
  const [retails, setRetails] = useState([]);
  const [selectedRetail, setSelectedRetail] = useState(null);

  const [employees, setEmployees] = useState([]); // [{value,label}]
  const [kategoriList, setKategoriList] = useState([]);

  const [monthDate, setMonthDate] = useState(new Date());
  const [monthJadwal, setMonthJadwal] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCell, setModalCell] = useState(null); // { user_id, user_name, tanggal, existing }
  const [modalKategori, setModalKategori] = useState(null);
  const [savingModal, setSavingModal] = useState(false);

  // Mobile: tanggal aktif untuk list per-hari (yyyy-MM-dd). Default hari ini.
  const [selectedDay, setSelectedDay] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Import Excel state
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const monthStr = format(monthDate, "yyyy-MM");

  // --- Fetch retails sekali: HANYA OC dgn shift jadwal-harian AKTIF hari ini ---
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const retailRes = await axios.get(
          `${VITE_API_URL}/jadwal-harian/active-retails`,
          { headers: authHeaders() }
        );
        setRetails(
          (retailRes.data.data || [])
            .filter((r) => isOcRetail(r.name))
            .sort((a, b) => ocNumber(a.name) - ocNumber(b.name))
            .map((r) => ({ value: r.retail_id, label: r.name }))
        );
      } catch (error) {
        console.error("Init fetch failed:", error);
      }
    };
    fetchInit();
  }, []);

  // --- Saat OC dipilih: ambil kategori shift + karyawan retail itu ---
  const handleRetailChange = async (option) => {
    setSelectedRetail(option);
    setKategoriList([]);
    setEmployees([]);
    setMonthJadwal([]);
    if (!option) return;
    try {
      const [katRes, empRes] = await Promise.all([
        axios.get(`${VITE_API_URL}/jadwal-harian/kategori`, {
          headers: authHeaders(),
        }),
        axios.get(`${VITE_API_URL}/jadwal-harian/employees/${option.value}`, {
          headers: authHeaders(),
        }),
      ]);
      setKategoriList(katRes.data.data || []);
      setEmployees(
        (empRes.data.data || []).map((u) => ({ value: u.user_id, label: u.name }))
      );
    } catch (error) {
      console.error("Fetch kategori/employees failed:", error);
    }
  };

  const fetchMonthJadwal = async () => {
    if (!selectedRetail) return;
    setLoadingMonth(true);
    try {
      const res = await axios.get(
        `${VITE_API_URL}/jadwal-harian?month=${monthStr}&retail_id=${selectedRetail.value}`,
        { headers: authHeaders() }
      );
      setMonthJadwal(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setLoadingMonth(false);
    }
  };

  useEffect(() => {
    fetchMonthJadwal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRetail, monthStr]);

  // --- Daftar tanggal 1..N bulan berjalan ---
  const days = useMemo(() => {
    const last = endOfMonth(monthDate).getDate();
    const arr = [];
    for (let d = 1; d <= last; d++) {
      const tanggal = format(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), d),
        "yyyy-MM-dd"
      );
      const dow = getDay(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
      arr.push({ d, tanggal, dow });
    }
    return arr;
  }, [monthDate]);

  // Jaga selectedDay tetap dalam bulan aktif (mobile list per-hari).
  useEffect(() => {
    if (!days.some((dy) => dy.tanggal === selectedDay)) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const match = days.find((dy) => dy.tanggal === todayStr);
      setSelectedDay(match ? match.tanggal : days[0]?.tanggal || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // --- Lookup jadwal[user_id][tanggal] = row ---
  const jadwalMap = useMemo(() => {
    const map = {};
    for (const row of monthJadwal) {
      if (!map[row.user_id]) map[row.user_id] = {};
      map[row.user_id][row.tanggal] = row;
    }
    return map;
  }, [monthJadwal]);

  // Ringkasan bulan: total sel terisi, karyawan, hari, coverage%.
  const stats = useMemo(() => {
    const totalCells = employees.length * days.length;
    const filled = monthJadwal.length;
    return {
      filled,
      employees: employees.length,
      days: days.length,
      coverage: totalCells > 0 ? Math.round((filled / totalCells) * 100) : 0,
    };
  }, [monthJadwal, employees, days]);

  // Encode pasangan shift sebagai "masuk_id:keluar_id" untuk dropdown value.
  const encodeShift = (masukId, keluarId) => `${masukId}:${keluarId}`;
  const decodeShift = (val) => {
    if (!val) return { absen_masuk_id: null, absen_keluar_id: null };
    const [m, k] = String(val).split(":");
    return { absen_masuk_id: Number(m), absen_keluar_id: Number(k) };
  };

  // --- Klik sel: buka modal assign 1 orang 1 hari ---
  const openCell = (user, day) => {
    const existing = jadwalMap[user.value]?.[day.tanggal] || null;
    setModalCell({
      user_id: user.value,
      user_name: user.label,
      tanggal: day.tanggal,
      existing,
    });
    if (existing?.absen_masuk_id && existing?.absen_keluar_id) {
      setModalKategori({
        value: encodeShift(existing.absen_masuk_id, existing.absen_keluar_id),
        label: existing.shift_name,
      });
    } else {
      setModalKategori(null);
    }
    setModalVisible(true);
  };

  // kategoriList: [{ shift_name, kategori_absen, absen_masuk_id, absen_keluar_id }].
  const kategoriOptions = kategoriList.map((k) => ({
    value: encodeShift(k.absen_masuk_id, k.absen_keluar_id),
    label: `${k.shift_name} (${k.kategori_absen})`,
  }));

  // --- Simpan 1 sel (assign upsert 1 user 1 tanggal) ---
  const handleSaveCell = async () => {
    if (!modalKategori) {
      Swal.fire("Pilih shift", "Kategori shift wajib dipilih.", "warning");
      return;
    }
    const { absen_masuk_id, absen_keluar_id } = decodeShift(modalKategori.value);
    setSavingModal(true);
    try {
      await axios.post(
        `${VITE_API_URL}/jadwal-harian/assign`,
        {
          user_ids: [modalCell.user_id],
          retail_id: selectedRetail.value,
          absen_masuk_id,
          absen_keluar_id,
          start_date: modalCell.tanggal,
          end_date: modalCell.tanggal,
        },
        { headers: authHeaders() }
      );
      setModalVisible(false);
      fetchMonthJadwal();
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingModal(false);
    }
  };

  // --- Hapus shift 1 sel ---
  const handleClearCell = async () => {
    if (!modalCell?.existing) {
      setModalVisible(false);
      return;
    }
    setSavingModal(true);
    try {
      await axios.post(
        `${VITE_API_URL}/jadwal-harian/delete/${modalCell.existing.id}`,
        {},
        { headers: authHeaders() }
      );
      setModalVisible(false);
      fetchMonthJadwal();
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingModal(false);
    }
  };

  // --- Import Excel handlers ---
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(
        `${VITE_API_URL}/jadwal-harian/import-template?month=${monthStr}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (!res.ok) throw new Error("Gagal download template.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template-jadwal-harian-${monthStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      Swal.fire("Error!", e.message, "error");
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      Swal.fire("Peringatan", "Pilih file Excel terlebih dahulu.", "warning");
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch(`${VITE_API_URL}/jadwal-harian/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setImportResult(data.data);
        if (data.data.inserted > 0 && selectedRetail) {
          // Refresh jadwal bila ada retail terpilih
          const res2 = await axios.get(
            `${VITE_API_URL}/jadwal-harian?month=${monthStr}&retail_id=${selectedRetail.value}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          if (res2.data.status === "success") {
            setMonthJadwal(res2.data.data || []);
          }
        }
      } else {
        Swal.fire("Error!", data.message || "Import gagal.", "error");
      }
    } catch (e) {
      Swal.fire("Error!", e.message, "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h4 className="card-title mb-0" style={{ fontSize: isMobile ? "16px" : "18px" }}>
                    Jadwal Shift Harian
                  </h4>
                  <span style={{ fontSize: "12px", color: "#90a4ae" }}>
                    Sales Toko / Trainee
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-outline-info btn-sm"
                    style={{ borderRadius: "9px", fontWeight: 600 }}
                    onClick={handleDownloadTemplate}
                  >
                    <i className="mdi mdi-download"></i>{isMobile ? "" : " Template"}
                  </button>
                  <button
                    className="btn btn-outline-success btn-sm"
                    style={{ borderRadius: "9px", fontWeight: 600 }}
                    onClick={() => { setImportModalVisible(true); setImportResult(null); setImportFile(null); }}
                  >
                    <i className="mdi mdi-file-excel"></i>{isMobile ? "" : " Import Excel"}
                  </button>
                </div>
              </div>

              {/* Step 1: Pilih OC */}
              <div className="mb-4" style={{ maxWidth: isMobile ? "100%" : "360px" }}>
                <label className="form-label" style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b" }}>
                  Pilih OC / Retail
                </label>
                <Select
                  options={retails}
                  value={selectedRetail}
                  onChange={handleRetailChange}
                  placeholder="Pilih OC..."
                  isClearable
                  menuPosition="fixed"
                />
              </div>

              {/* Step 2: Matrix karyawan x tanggal */}
              {selectedRetail && (
                <>
                  {/* Month nav (pill) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <button
                      className="btn btn-light btn-sm"
                      style={{ borderRadius: "50%", width: "36px", height: "36px", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                      onClick={() => setMonthDate((d) => subMonths(d, 1))}
                      aria-label="Bulan sebelumnya"
                    >
                      <i className="mdi mdi-chevron-left" style={{ fontSize: "20px" }}></i>
                    </button>
                    <h5 className="mb-0" style={{ minWidth: isMobile ? "150px" : "180px", textAlign: "center", fontWeight: 700, color: "#37474f" }}>
                      {format(monthDate, "MMMM yyyy")}
                    </h5>
                    <button
                      className="btn btn-light btn-sm"
                      style={{ borderRadius: "50%", width: "36px", height: "36px", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                      onClick={() => setMonthDate((d) => addMonths(d, 1))}
                      aria-label="Bulan berikutnya"
                    >
                      <i className="mdi mdi-chevron-right" style={{ fontSize: "20px" }}></i>
                    </button>
                  </div>

                  {/* Stats bar */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                    <span style={statChip}>
                      <i className="mdi mdi-account-group" style={{ color: "#2471a3" }}></i>
                      <span style={statNum}>{stats.employees}</span> Karyawan
                    </span>
                    <span style={statChip}>
                      <i className="mdi mdi-calendar-check" style={{ color: "#27ae60" }}></i>
                      <span style={statNum}>{stats.filled}</span> Shift terisi
                    </span>
                    <span style={statChip}>
                      <i className="mdi mdi-chart-donut" style={{ color: "#8e44ad" }}></i>
                      <span style={statNum}>{stats.coverage}%</span> Coverage
                    </span>
                  </div>

                  {/* Legend chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                    {kategoriList.map((k) => (
                      <span
                        key={k.shift_name}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: shiftColor(k.shift_name),
                          color: "#37474f",
                          borderRadius: "999px",
                          padding: "3px 11px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        <b>{shiftCode(k.shift_name)}</b> {k.shift_name}
                      </span>
                    ))}
                  </div>

                  {loadingMonth && <p className="text-muted">Memuat jadwal...</p>}

                  {employees.length === 0 ? (
                    <p className="text-muted">
                      Belum ada karyawan terhubung ke OC ini.
                    </p>
                  ) : isMobile ? (
                    /* ── MOBILE: list per-hari ── */
                    <div>
                      {/* Strip tanggal */}
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          overflowX: "auto",
                          paddingBottom: "8px",
                          marginBottom: "12px",
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        {days.map((day) => {
                          const active = day.tanggal === selectedDay;
                          return (
                            <button
                              key={day.tanggal}
                              onClick={() => setSelectedDay(day.tanggal)}
                              style={{
                                flex: "0 0 auto",
                                width: "48px",
                                border: "none",
                                borderRadius: "12px",
                                padding: "8px 0",
                                cursor: "pointer",
                                background: active
                                  ? "#2471a3"
                                  : day.dow === 0
                                    ? "#ffebee"
                                    : "#f4f6f8",
                                color: active ? "#fff" : day.dow === 0 ? "#c62828" : "#546e7a",
                                boxShadow: active ? "0 2px 6px rgba(36,113,163,0.35)" : "none",
                              }}
                            >
                              <div style={{ fontSize: "10px", opacity: 0.85 }}>
                                {DAY_INITIAL[day.dow]}
                              </div>
                              <div style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.1 }}>
                                {day.d}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Kartu karyawan hari terpilih */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {employees.map((u) => {
                          const day = days.find((dy) => dy.tanggal === selectedDay);
                          const row = jadwalMap[u.value]?.[selectedDay];
                          return (
                            <div
                              key={u.value}
                              onClick={() => day && openCell(u, day)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "10px",
                                background: "#fff",
                                border: "1px solid #eceff1",
                                borderLeft: `4px solid ${row ? shiftColor(row.shift_name) : "#e0e0e0"}`,
                                borderRadius: "12px",
                                padding: "12px 14px",
                                cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 600, color: "#37474f", fontSize: "14px" }}>
                                  {u.label}
                                </div>
                                <div style={{ fontSize: "12px", color: row ? "#607d8b" : "#b0bec5", marginTop: "2px" }}>
                                  {row ? row.shift_name : "Belum ada shift"}
                                </div>
                              </div>
                              {row ? (
                                <span
                                  style={{
                                    flex: "0 0 auto",
                                    background: shiftColor(row.shift_name),
                                    color: "#37474f",
                                    borderRadius: "10px",
                                    padding: "6px 12px",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                  }}
                                >
                                  {shiftCode(row.shift_name)}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    flex: "0 0 auto",
                                    color: "#2471a3",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                >
                                  <i className="mdi mdi-plus-circle-outline"></i> Set
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        overflowX: "auto",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                      }}
                    >
                      <table
                        className="table table-bordered mb-0"
                        style={{
                          borderCollapse: "separate",
                          borderSpacing: 0,
                          width: "auto",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                position: "sticky",
                                left: 0,
                                background: "#f8f9fa",
                                zIndex: 2,
                                minWidth: isMobile ? "120px" : "180px",
                                padding: "8px 10px",
                                verticalAlign: "middle",
                                border: CELL_BORDER,
                                fontSize: "12px",
                                color: "#546e7a",
                                textTransform: "uppercase",
                                letterSpacing: "0.3px",
                              }}
                            >
                              Karyawan
                            </th>
                            {days.map((day) => (
                              <th
                                key={day.tanggal}
                                style={{
                                  textAlign: "center",
                                  padding: "6px 0",
                                  minWidth: isMobile ? "44px" : "40px",
                                  fontSize: "12px",
                                  lineHeight: 1.25,
                                  border: CELL_BORDER,
                                  background:
                                    day.dow === 0 ? "#ffebee" : "#f8f9fa",
                                }}
                              >
                                <div style={{ fontWeight: 700 }}>{day.d}</div>
                                <div style={{ color: "#999", fontSize: "10px" }}>
                                  {DAY_INITIAL[day.dow]}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map((u) => (
                            <tr key={u.value}>
                              <td
                                style={{
                                  position: "sticky",
                                  left: 0,
                                  background: "#fff",
                                  zIndex: 1,
                                  fontSize: "13px",
                                  padding: "8px 10px",
                                  minWidth: isMobile ? "120px" : "180px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: isMobile ? "140px" : "220px",
                                  border: CELL_BORDER,
                                  fontWeight: 600,
                                  color: "#37474f",
                                }}
                                title={u.label}
                              >
                                {u.label}
                              </td>
                              {days.map((day) => {
                                const row = jadwalMap[u.value]?.[day.tanggal];
                                return (
                                  <td
                                    key={day.tanggal}
                                    onClick={() => openCell(u, day)}
                                    title={
                                      row
                                        ? `${u.label} — ${day.tanggal} — ${row.shift_name}`
                                        : `${u.label} — ${day.tanggal}`
                                    }
                                    style={{
                                      textAlign: "center",
                                      cursor: "pointer",
                                      padding: 0,
                                      height: isMobile ? "46px" : "40px",
                                      minWidth: isMobile ? "44px" : "40px",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      border: CELL_BORDER,
                                      color: row ? "#37474f" : "#cfd8dc",
                                      background: row
                                        ? shiftColor(row.shift_name)
                                        : day.dow === 0
                                          ? "#fff5f5"
                                          : "#fff",
                                    }}
                                  >
                                    {row ? shiftCode(row.shift_name) : "+"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal assign 1 orang 1 hari */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Set Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalCell && (
            <>
              <p className="mb-1">
                <strong>{modalCell.user_name}</strong>
              </p>
              <p className="text-muted">
                {selectedRetail?.label} — {modalCell.tanggal}
              </p>
              <div className="mb-2">
                <label className="form-label">Shift (Kategori Absen)</label>
                <Select
                  options={kategoriOptions}
                  value={modalKategori}
                  onChange={setModalKategori}
                  placeholder="Pilih shift..."
                  noOptionsMessage={() => "Tidak ada kategori shift"}
                  menuPosition="fixed"
                />
              </div>
              <small className="text-muted">
                Satu karyawan hanya boleh 1 shift per hari. Menyimpan akan menimpa
                shift sebelumnya pada tanggal ini.
              </small>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {modalCell?.existing && (
            <Button
              variant="outline-danger"
              onClick={handleClearCell}
              disabled={savingModal}
            >
              Hapus Shift
            </Button>
          )}
          <Button variant="secondary" onClick={() => setModalVisible(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveCell} disabled={savingModal}>
            {savingModal ? "Menyimpan..." : "Simpan"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Import Excel */}
      <Modal show={importModalVisible} onHide={() => setImportModalVisible(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Import Jadwal dari Excel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Upload file .xlsx hasil <strong>Download Template</strong> ({format(monthDate, "MMMM yyyy")}).
            Isi shift lewat dropdown di tiap sel tanggal. Sel kosong dilewati (jadwal lama tak terhapus).
          </p>
          <input
            type="file"
            accept=".xlsx"
            className="form-control mb-3"
            onChange={(e) => setImportFile(e.target.files[0] || null)}
          />
          {importing && <p className="text-info">Mengimport...</p>}
          {importResult && (
            <div className={`alert ${importResult.errors?.length > 0 ? "alert-warning" : "alert-success"}`}>
              <p className="mb-1"><strong>Sel terisi:</strong> {importResult.total_rows}</p>
              <p className="mb-1"><strong>Berhasil simpan:</strong> {importResult.inserted}</p>
              <p className="mb-1"><strong>Dilewati (error):</strong> {importResult.skipped}</p>
              {importResult.errors?.length > 0 && (
                <details className="mt-2">
                  <summary>Detail error ({importResult.errors.length})</summary>
                  <ul className="mb-0 mt-1" style={{ fontSize: "12px" }}>
                    {importResult.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                    {importResult.errors.length > 20 && <li>...dan {importResult.errors.length - 20} error lainnya</li>}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setImportModalVisible(false)}>
            Tutup
          </Button>
          <Button variant="success" onClick={handleImportExcel} disabled={importing || !importFile}>
            {importing ? "Mengimport..." : "Import"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default JadwalHarian;
