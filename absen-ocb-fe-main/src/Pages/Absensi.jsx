/* eslint-disable react/prop-types */
import { useState,useRef, useEffect, useMemo } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;
import Swal from "sweetalert2";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Tooltip } from "react-tooltip";
// const now = new Date();
// const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

// ── UI BARU (modern clean) ──────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div
    style={{
      flex: "1 1 140px",
      background: "#fff",
      borderRadius: "14px",
      padding: "16px 18px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <div
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        background: `${color}1a`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        flexShrink: 0,
      }}
    >
      <i className={`mdi ${icon}`}></i>
    </div>
    <div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: "#263238", lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#90a4ae" }}>{label}</div>
    </div>
  </div>
);

const AbsensiBaru = ({
  loading,
  error,
  stats,
  rows,
  columns,
  globalSearch,
  setGlobalSearch,
  quickFilter,
  setQuickFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onFilter,
  onExport,
}) => {
  const chips = [
    { key: "semua", label: "Semua" },
    { key: "valid", label: "Valid" },
    { key: "invalid", label: "Invalid" },
    { key: "telat", label: "Telat" },
    { key: "lembur", label: "Lembur" },
  ];

  return (
    <div style={{ padding: "4px 2px" }}>
      {/* Stat ringkasan */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <StatCard label="Total Absen" value={stats.total} color="#455a64" icon="mdi-clipboard-text" />
        <StatCard label="Ontime" value={stats.ontime} color="#2e7d32" icon="mdi-check-circle" />
        <StatCard label="Telat" value={stats.telat} color="#ef6c00" icon="mdi-clock-alert" />
        <StatCard label="Lembur" value={stats.lembur} color="#8e24aa" icon="mdi-briefcase-clock" />
      </div>

      {/* Toolbar */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 220px" }}>
            <label style={{ fontSize: "12px", color: "#607d8b", fontWeight: 600 }}>Cari</label>
            <div style={{ position: "relative" }}>
              <i
                className="mdi mdi-magnify"
                style={{ position: "absolute", left: "10px", top: "9px", color: "#b0bec5", fontSize: "18px" }}
              ></i>
              <input
                type="text"
                className="form-control"
                placeholder="Nama, retail, code, deskripsi, catatan..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                style={{ paddingLeft: "34px", borderRadius: "10px" }}
              />
            </div>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ fontSize: "12px", color: "#607d8b", fontWeight: 600 }}>Dari</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ borderRadius: "10px" }}
            />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ fontSize: "12px", color: "#607d8b", fontWeight: 600 }}>Sampai</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ borderRadius: "10px" }}
            />
          </div>
          <button
            className="btn"
            onClick={onFilter}
            style={{ background: "#2471a3", color: "#fff", borderRadius: "10px", fontWeight: 600 }}
          >
            <i className="mdi mdi-filter-variant"></i> Filter
          </button>
          <button
            className="btn"
            onClick={onExport}
            style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", fontWeight: 600 }}
          >
            <i className="mdi mdi-file-excel"></i> Export
          </button>
        </div>

        {/* Quick filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setQuickFilter(c.key)}
              style={{
                border: "1px solid",
                borderColor: quickFilter === c.key ? "#e74c3c" : "#cfd8dc",
                background: quickFilter === c.key ? "#e74c3c" : "#fff",
                color: quickFilter === c.key ? "#fff" : "#607d8b",
                borderRadius: "999px",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "6px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#90a4ae" }}>
            <i className="mdi mdi-loading mdi-spin" style={{ fontSize: "28px" }}></i>
            <p style={{ marginTop: "8px" }}>Memuat data...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#c62828" }}>
            <i className="mdi mdi-alert-circle" style={{ fontSize: "28px" }}></i>
            <p style={{ marginTop: "8px" }}>Error: {error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#b0bec5" }}>
            <i className="mdi mdi-inbox-remove" style={{ fontSize: "36px" }}></i>
            <p style={{ marginTop: "8px" }}>Tidak ada data absensi.</p>
          </div>
        ) : (
          <DataTable
            keyField="absensi_id"
            columns={columns}
            data={rows}
            pagination
            responsive
            highlightOnHover
            fixedHeader
            fixedHeaderScrollHeight="62vh"
            customStyles={{
              headCells: {
                style: {
                  background: "#f5f7fa",
                  color: "#546e7a",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                },
              },
              rows: { style: { minHeight: "56px", fontSize: "13px" } },
              cells: { style: { paddingTop: "6px", paddingBottom: "6px" } },
            }}
          />
        )}
      </div>
    </div>
  );
};

const Absensi = () => {
  const [Absensies, setAbsensies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageAbsensi, setSelectedImageAbsensi] = useState(null);
  const [isModalOpenAbsensi, setIsModalOpenAbsensi] = useState(false);
  const [selectedKoreksi, setSelectedKoreksi] = useState(null);
  const [koreksiModalVisible, setKoreksiModalVisible] = useState(false);
  const [savingKoreksi, setSavingKoreksi] = useState(false);
  const [tipeAbsenOptions, setTipeAbsenOptions] = useState([]);
  const [loadingTipe, setLoadingTipe] = useState(false);
  // UI baru (toggle dalam halaman). Default "baru", persist ke localStorage.
  const [uiMode, setUiMode] = useState(
    () => localStorage.getItem("absensi_ui_mode") || "baru"
  );
  const [globalSearch, setGlobalSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("semua"); // semua|valid|invalid|telat|lembur

  useEffect(() => {
    localStorage.setItem("absensi_ui_mode", uiMode);
  }, [uiMode]);
  const [startDate, setStartDate] = useState(""); // Tanggal mulai
  const [endDate, setEndDate] = useState(""); // Tanggal akhir
  const [filterText, setFilterText] = useState({
    nama_karyawan: "",
    retail_name: "",
    category_absen: "",
    description: "",
    absen_time: "",
    fee: "",
    reason:""
  

  });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);
  

  

  const fetchAbsensies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);


      const response = await axios.get(`${VITE_API_URL}/absensi/history?${params.toString()}`, {
        headers,
      });
      const fetchedData = response.data.data || [];

      setAbsensies(fetchedData);

      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsensies();
  }, []);


  const handleFilter = () => {
    fetchAbsensies();
  };


  const filteredAbsensi = Absensies.filter((item) =>
    Object.keys(filterText).every((key) => {
      const itemValue = String(item[key])?.toLowerCase(); // Pastikan item selalu jadi string kecil
      const filterValue = filterText[key].toLowerCase(); // Pastikan filter input menjadi huruf kecil

      // Pastikan bahwa itemValue mengandung filterValue
      return itemValue.includes(filterValue);
    })
  );

  // Deteksi baris "diabaikan" (rejected) — dipakai badge + quick filter.
  const isRejected = (row) =>
    String(row.status_approval).toLowerCase().includes("tolak") ||
    String(row.status_approval).toLowerCase().includes("reject") ||
    String(row.status_approval) === "3";
  const isLembur = (row) => row.is_lembur === 1 || row.is_lembur === "1";

  // Baris untuk UI BARU: search global (multi-field) + quick filter chip.
  // Terpisah dari filteredAbsensi (UI lama pakai filterText per-kolom).
  const displayedRows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return Absensies.filter((row) => {
      if (q) {
        const hay = [
          row.nama_karyawan,
          row.retail_name,
          row.category_absen,
          row.description,
          row.reason,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      switch (quickFilter) {
        case "valid":
          return row.is_valid === 1 && !isRejected(row);
        case "invalid":
          return row.is_valid !== 1 && !isRejected(row);
        case "telat":
          return Number(row.status_absen) === 2;
        case "lembur":
          return isLembur(row);
        default:
          return true;
      }
    });
  }, [Absensies, globalSearch, quickFilter]);

  // Ringkasan stat dari baris tampil.
  const stats = useMemo(() => {
    return {
      total: displayedRows.length,
      ontime: displayedRows.filter((r) => Number(r.status_absen) === 1).length,
      telat: displayedRows.filter((r) => Number(r.status_absen) === 2).length,
      lembur: displayedRows.filter((r) => isLembur(r)).length,
    };
  }, [displayedRows]);

  const handleInputChange = (field, value) => {
    setFilterText((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  

  const handleImageAbsensiClick = (imageUrl) => {
    setSelectedImageAbsensi(imageUrl);
    setIsModalOpenAbsensi(true);
  };

  const closeAbsensiModal = () => {
    setSelectedImageAbsensi(null);
    setIsModalOpenAbsensi(false);
  };

  const handleValidasi = async (row) => {
    let is_valid = "";
    let text = "";
    if (row.is_valid === 1) {
      is_valid = 0;
      text = "Invalidkan Absensi Ini ?";
    } else {
      is_valid = 1;
      text = "validasi Absensi Ini ?";
    }
    Swal.fire({
      title: "Are you sure?",
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes!!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const responseValidasi = await axios.post(
            `${VITE_API_URL}/absensi/validasi/${row.absensi_id}`,
            {
              is_valid: is_valid,
            },
            { headers }
          );
          Swal.fire("Updated!", `${responseValidasi.data.message}`, "success");
          setAbsensies((prev) =>
            prev.map((item) =>
              item.absensi_id === row.absensi_id ? { ...item, is_valid } : item
            )
          );
        } catch (error) {
          Swal.fire(
            "Error!",
            error.response?.data?.message || error.message,
            "error"
          );
        }
      }
    });
  };

  const handleIgnore = async (row) => {
    Swal.fire({
      title: "Ignore absen ini?",
      text: `Absen ${row.nama_karyawan} akan diabaikan (ditolak) dan karyawan bisa absen ulang.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, ignore",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.post(
          `${VITE_API_URL}/absensi/reject-absensi/${row.absensi_id}`,
          {},
          { headers }
        );
        Swal.fire("Diabaikan!", `${res.data.message}`, "success");
        setAbsensies((prev) =>
          prev.map((item) =>
            item.absensi_id === row.absensi_id
              ? { ...item, is_valid: 0, status_approval: "rejected" }
              : item
          )
        );
      } catch (error) {
        Swal.fire("Error!", error.response?.data?.message || error.message, "error");
      }
    });
  };

  // Arah absen dari description (selaras BE absenDirectionOf).
  const getRowDirection = (desc) => {
    const d = String(desc || "").toLowerCase();
    if (d.includes("keluar") || d.includes("pulang")) return "keluar";
    if (d.includes("masuk")) return "masuk";
    return "";
  };

  // Ambil tipe absen searah baris (untuk dropdown ganti tipe).
  const fetchTipeAbsen = async (direction) => {
    if (!direction) {
      setTipeAbsenOptions([]);
      return;
    }
    setLoadingTipe(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${VITE_API_URL}/absensi/tipe-absen?direction=${direction}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTipeAbsenOptions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setTipeAbsenOptions([]);
    } finally {
      setLoadingTipe(false);
    }
  };

  // Buka modal koreksi: prefill jam (datetime-local), status, catatan, tipe.
  const handleKoreksi = (row) => {
    const direction = getRowDirection(row.description);
    setSelectedKoreksi({
      absensi_id: row.absensi_id,
      nama_karyawan: row.nama_karyawan,
      category_absen: row.category_absen,
      absen_type_id: String(row.absen_type_id ?? ""),
      original_type_id: String(row.absen_type_id ?? ""),
      direction,
      // datetime-local butuh "yyyy-MM-dd'T'HH:mm".
      absen_time_local: row.absen_time
        ? format(new Date(row.absen_time), "yyyy-MM-dd'T'HH:mm")
        : "",
      status_absen: String(row.status_absen ?? ""),
      reason: row.reason || "",
    });
    setKoreksiModalVisible(true);
    fetchTipeAbsen(direction);
  };

  const handleSaveKoreksi = async () => {
    if (!selectedKoreksi?.absen_time_local) {
      Swal.fire("Error", "Waktu absen wajib diisi.", "error");
      return;
    }
    setSavingKoreksi(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      // datetime-local "yyyy-MM-ddTHH:mm" → "yyyy-MM-dd HH:mm:ss" untuk BE.
      const absen_time = format(
        new Date(selectedKoreksi.absen_time_local),
        "yyyy-MM-dd HH:mm:ss"
      );
      const payload = {
        absen_time,
        reason: selectedKoreksi.reason,
      };
      // status_absen opsional: kirim hanya bila admin set eksplisit (1/2).
      if (selectedKoreksi.status_absen === "1" || selectedKoreksi.status_absen === "2") {
        payload.status_absen = Number(selectedKoreksi.status_absen);
      }
      // absen_type_id: kirim hanya bila admin ganti tipe.
      if (
        selectedKoreksi.absen_type_id &&
        selectedKoreksi.absen_type_id !== selectedKoreksi.original_type_id
      ) {
        payload.absen_type_id = Number(selectedKoreksi.absen_type_id);
      }

      const res = await axios.post(
        `${VITE_API_URL}/absensi/koreksi/${selectedKoreksi.absensi_id}`,
        payload,
        { headers }
      );

      const updated = res.data.data;
      setAbsensies((prev) =>
        prev.map((item) =>
          item.absensi_id === selectedKoreksi.absensi_id
            ? {
                ...item,
                absen_time: updated.absen_time,
                status_absen: updated.status_absen,
                reason: updated.reason,
                absen_type_id: updated.absen_type_id ?? item.absen_type_id,
                category_absen: updated.category_absen ?? item.category_absen,
                description: updated.description ?? item.description,
              }
            : item
        )
      );
      Swal.fire("Berhasil!", res.data.message || "Koreksi tersimpan.", "success");
      setKoreksiModalVisible(false);
      setSelectedKoreksi(null);
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingKoreksi(false);
    }
  };

  // Hapus 1 baris absensi. Sesi terkait ikut disesuaikan di BE (slot di-NULL-kan
  // / sesi dihapus bila jadi kosong).
  const handleDeleteAbsensi = async (row) => {
    const ok = await Swal.fire({
      title: "Hapus absensi?",
      html: `<div style="font-size:13px;text-align:left">
        <b>${row.nama_karyawan || "-"}</b><br/>
        ${row.description || "-"}<br/>
        ${row.absen_time ? format(new Date(row.absen_time), "dd MMM yyyy, HH:mm") : "-"}
        <hr/>Baris absensi dihapus permanen. Sesi terkait ikut disesuaikan
        (slot dikosongkan; sesi dihapus bila jadi kosong).</div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#c62828",
    });
    if (!ok.isConfirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${VITE_API_URL}/absensi/delete/${row.absensi_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAbsensies((prev) => prev.filter((item) => item.absensi_id !== row.absensi_id));
      Swal.fire("Berhasil!", res.data?.message || "Absensi dihapus.", "success");
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    }
  };

  // Badge status berwarna (pill) untuk UI baru.
  const pill = (bg, text, label) => (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        background: bg,
        color: text,
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
  const renderStatusBadge = (row) => {
    if (isRejected(row)) return pill("#eceff1", "#607d8b", "Diabaikan");
    if (row.is_valid === 1) return pill("#e8f5e9", "#2e7d32", "Valid");
    return pill("#ffebee", "#c62828", "Invalid");
  };

  // Kolom UI BARU: sortable, badge, thumbnail, aksi ikon ringkas.
  const iconBtn = (bg, title, onClick, icon) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        border: "none",
        background: bg,
        color: "#fff",
        width: "30px",
        height: "30px",
        borderRadius: "7px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "4px",
        fontSize: "15px",
      }}
    >
      <i className={`mdi ${icon}`}></i>
    </button>
  );

  const columnsV2 = [
    {
      name: "Karyawan",
      sortable: true,
      selector: (row) => row.nama_karyawan || "",
      cell: (row) => (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontWeight: 600, color: "#2c3e50" }}>{row.nama_karyawan}</div>
          <div style={{ fontSize: "11px", color: "#90a4ae" }}>{row.retail_name}</div>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Code",
      sortable: true,
      selector: (row) => row.category_absen || "",
      cell: (row) => (
        <span style={{ fontSize: "12px", color: "#546e7a" }}>{row.category_absen}</span>
      ),
    },
    {
      name: "Waktu",
      sortable: true,
      selector: (row) => (row.absen_time ? new Date(row.absen_time).getTime() : 0),
      cell: (row) => (
        <span style={{ fontSize: "12px", color: "#455a64" }}>
          {row.absen_time
            ? format(new Date(row.absen_time), "dd MMM yyyy, HH:mm")
            : "-"}
        </span>
      ),
      grow: 1.4,
    },
    {
      name: "Deskripsi",
      sortable: true,
      selector: (row) => row.description || "",
      cell: (row) => (
        <span style={{ fontSize: "12px" }}>
          {row.description || "-"}
          {isLembur(row) && (
            <span
              style={{
                marginLeft: "6px",
                padding: "2px 7px",
                borderRadius: "999px",
                background: "#fff3e0",
                color: "#e65100",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              Lembur
            </span>
          )}
        </span>
      ),
      grow: 2,
    },
    {
      name: "Fee",
      sortable: true,
      selector: (row) => Number(row.fee) || 0,
      cell: (row) => (
        <span style={{ fontSize: "12px", color: "#455a64" }}>{row.fee}</span>
      ),
      width: "80px",
    },
    {
      name: "Catatan",
      sortable: true,
      selector: (row) => row.reason || "",
      cell: (row) => {
        const text = String(row.reason || "");
        if (!text) return <span style={{ fontSize: "12px", color: "#b0bec5" }}>-</span>;
        return (
          <span
            style={{
              fontSize: "12px",
              color: "#455a64",
              whiteSpace: "pre-line",
              lineHeight: 1.4,
              display: "block",
              padding: "4px 0",
            }}
          >
            {text}
          </span>
        );
      },
      wrap: true,
      grow: 2.4,
    },
    {
      name: "Foto",
      cell: (row) => {
        const isVid =
          row?.photo_url &&
          (row.photo_url.endsWith(".mp4") || row.photo_url.endsWith(".webm"));
        const src = row?.photo_url ? `${VITE_API_IMAGE}${row.photo_url}` : "/absen.jpg";
        return isVid ? (
          <video
            src={src}
            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
            onClick={() => handleImageAbsensiClick(src)}
          />
        ) : (
          <img
            src={src}
            alt="foto"
            style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
            onClick={() => handleImageAbsensiClick(src)}
          />
        );
      },
      width: "70px",
    },
    {
      name: "Status",
      sortable: true,
      selector: (row) => (isRejected(row) ? 2 : row.is_valid === 1 ? 0 : 1),
      cell: (row) => renderStatusBadge(row),
      width: "110px",
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {iconBtn(
            row.is_valid ? "#43a047" : "#e53935",
            row.is_valid ? "Set Invalid" : "Validasi",
            () => handleValidasi(row),
            row.is_valid ? "mdi-check-circle" : "mdi-close-circle"
          )}
          {!isRejected(row) &&
            iconBtn("#fb8c00", "Ignore (karyawan bisa absen ulang)", () => handleIgnore(row), "mdi-cancel")}
          {iconBtn("#1e88e5", "Koreksi jam/status/catatan", () => handleKoreksi(row), "mdi-pencil")}
          {iconBtn("#c62828", "Hapus absensi", () => handleDeleteAbsensi(row), "mdi-delete")}
        </div>
      ),
      grow: 1.6,
      width: "175px",
    },
  ];

  const columns = [
    {
      name: (
        <span style={{ marginBottom: "45px" }}>#</span>
      ),
      cell: (row, index) => <span>{index + 1}</span>,
      width: "50px",
    },
      {
     
      selector: (row) => row.nama_karyawan,
      cell: (row) => row.nama_karyawan,
      // Header dengan input filter
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Nama Karyawan</span>
          <input
            type="text"
            value={filterText.nama_karyawan}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.nama_karyawan = el)}
            onChange={(e) => handleInputChange("nama_karyawan", e.target.value)}
            onFocus={() => setActiveInput('nama_karyawan')} // Set active input
          />
        </div>
      ),
    },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Retail/Outlet</span>
          <input
            type="text"
            value={filterText.retail_name}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.retail_name = el)}
            onChange={(e) => handleInputChange("retail_name", e.target.value)}
            onFocus={() => setActiveInput('retail_name')} // Set active input
          />
        </div>
      ),
      selector: (row) => row.retail_name,
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Code Absen</span>
          <input
            type="text"
            value={filterText.category_absen}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.category_absen = el)}
            onChange={(e) => handleInputChange("category_absen", e.target.value)}
            onFocus={() => setActiveInput('category_absen')} // Set active input
          />
        </div>
      ),
      selector: (row) => row.category_absen },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Waktu Absen</span>
          <input
            type="text"
            value={filterText.absen_time}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.absen_time = el)}
            onChange={(e) => handleInputChange("absen_time", e.target.value)}
            onFocus={() => setActiveInput('absen_time')} // Set active input
          />
        </div>
      ),
      selector: (row) =>
        format(new Date(row.absen_time), "yyyy-MM-dd HH:mm:ss"),
      wrap: true,
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Deskripsi</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            value={filterText.description}
            ref={(el) => (inputRefs.current.description = el)}
            onChange={(e) => handleInputChange("description", e.target.value)}
            onFocus={() => setActiveInput('description')} // Set active input
          />
        </div>
      ),
      
      
      selector: (row) => row.description,
      cell: (row) => (
        <span>
          {row.description || "-"}
          {(row.is_lembur === 1 || row.is_lembur === "1") && (
            <span className="badge bg-warning text-dark" style={{ marginLeft: "6px", fontSize: "10px" }}>
              Lembur
            </span>
          )}
        </span>
      ),
    },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Fee</span>
          <input
            type="text"
            value={filterText.fee}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.fee = el)}
            onChange={(e) => handleInputChange("fee", e.target.value)}
            onFocus={() => setActiveInput('fee')} // Set active input
           
          />
        </div>
      ),
      selector: (row) => row.fee },

      { name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Catatan Karyawan</span>
          <input
            type="text"
            value={filterText.reason}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.reason = el)}
            onChange={(e) => handleInputChange("reason", e.target.value)}
            onFocus={() => setActiveInput('reason')} // Set active input
          />
        </div>
      ), 
      cell: (row) => {
        // Format teks tooltip: setiap 2 kata setelah koma, masuk ke baris baru
        const formattedText = row.reason;
  
        return (
          <div>
            <span data-tooltip-id={`tooltip-${row.reason}`}>
              {row.reason.length > 30
                ? row.reason.substring(0, 25) + "..."
                : row.reason}
            </span>
            <Tooltip
              id={`tooltip-${row.reason}`}
              place="top"
              effect="solid"
              style={{
                backgroundColor: "#FAD9CF", // Ubah background tooltip ke orange
                color: "black", // Warna teks agar kontras
                borderRadius: "8px",
                padding: "8px",
                whiteSpace: "pre-line",
                zIndex: 9999,
              }} // Tambahkan white-space agar newline terbaca
            >
              {formattedText}
            </Tooltip>
          </div>
        );
      },selector: (row) => row.reason },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",  }}>
          <span style={{ marginBottom: "6px" }}>Photo/Video</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            disabled
          />
        </div>
      ),
      cell: (row) => (
        <div >
          {row?.photo_url &&
          (row.photo_url.endsWith(".mp4") ||
            row.photo_url.endsWith(".webm")) ? (
            <video
              src={`${VITE_API_IMAGE}${row.photo_url}`}
              alt="Video Preview"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "10%",
                cursor: "pointer",
                objectFit: "cover",
              }}
              onClick={() =>
                handleImageAbsensiClick(`${VITE_API_IMAGE}${row.photo_url}`)
              }
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={
                row?.photo_url
                  ? `${VITE_API_IMAGE}${row.photo_url}`
                  : "/absen.jpg"
              }
              alt="Profile"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "10%",
                cursor: "pointer",
                objectFit: "cover",
              }}
              onClick={() =>
                handleImageAbsensiClick(
                  row?.photo_url
                    ? `${VITE_API_IMAGE}${row.photo_url}`
                    : "/absen.jpg"
                )
              }
            />
          )}
        </div>
      ),
    },
    {
      name: (
        <span style={{ marginBottom: "45px" }}>Status</span>
      ),
      cell: (row) => (
        <button
          className={`btn btn-sm ${
            row.is_valid ? "btn-gradient-success" : "btn-gradient-danger"
          }`}
          onClick={() => {
            handleValidasi(row);
          }}
        >
          {row.is_valid ? "Valid" : "Invalid"}
        </button>
      ),
    },
    {
      name: (
        <span style={{ marginBottom: "45px" }}>Ignore</span>
      ),
      cell: (row) =>
        String(row.status_approval).toLowerCase().includes("tolak") ||
        String(row.status_approval).toLowerCase().includes("reject") ||
        String(row.status_approval) === "3" ? (
          <span className="badge bg-secondary">Diabaikan</span>
        ) : (
          <button
            className="btn btn-sm btn-gradient-warning"
            onClick={() => handleIgnore(row)}
            title="Abaikan absen, karyawan bisa absen ulang"
          >
            Ignore
          </button>
        ),
    },
    {
      name: (
        <span style={{ marginBottom: "45px" }}>Koreksi</span>
      ),
      cell: (row) => (
        <button
          className="btn btn-sm btn-gradient-info"
          onClick={() => handleKoreksi(row)}
          title="Koreksi jam / status / catatan absen"
        >
          Koreksi
        </button>
      ),
    },
  ];

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

    const exportToExcel = () => {
      const data = filteredAbsensi.map((row, index) => ({
        "No": index + 1,
        "Nama Karyawan": row.nama_karyawan,
        "Retail / Outlet": row.retail_name,
        "Code Absen": row.category_absen,
        "Waktu Absen": format(new Date(row.absen_time), "yyyy-MM-dd HH:mm:ss"),
        "Deskripsi Absen": row.description,
        "Fee": row.fee,
        "Status": row.is_valid ? "Valid" : "Invalid",
        "Lembur": (row.is_lembur === 1 || row.is_lembur === "1") ? "Ya" : "Tidak",
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi Data");
  
      const dateNow = new Date().toISOString().split("T")[0]; // Current date
      XLSX.writeFile(workbook, `Absensi_Data_${dateNow}.xlsx`);
    };
  
 

  // Segmented toggle UI Lama/Baru.
  const uiToggle = (
    <div
      style={{
        display: "inline-flex",
        background: "#eceff1",
        borderRadius: "999px",
        padding: "3px",
      }}
    >
      {[
        { key: "baru", label: "UI Baru" },
        { key: "lama", label: "UI Lama" },
      ].map((opt) => (
        <button
          key={opt.key}
          onClick={() => setUiMode(opt.key)}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            background: uiMode === opt.key ? "#e74c3c" : "transparent",
            color: uiMode === opt.key ? "#fff" : "#607d8b",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="content-wrapper">
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <h3 className="page-title" style={{ margin: 0 }}>Data Absensi</h3>
        {uiToggle}
      </div>

      {uiMode === "baru" ? (
        <AbsensiBaru
          loading={loading}
          error={error}
          stats={stats}
          rows={displayedRows}
          columns={columnsV2}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onFilter={handleFilter}
          onExport={exportToExcel}
        />
      ) : (
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Absensi</h4>
              <div className="">
                {loading ? (
                  <p>Loading data...</p>
                ) : error ? (
                  <p className="text-danger">Error: {error}</p>
                ) : (
                  <>
                    {/* <div className="row"> */}
                    <div className="row mb-5">
                      <div className="col-md-3 d-flex align-items-end">
                        <div className="me-2 w-100">
                          <label htmlFor="startDate">Start Date:</label>
                          <input
                            id="startDate"
                            type="date"
                            className="form-control filter-header"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3 d-flex align-items-end">
                        <div className="me-2 w-100">
                          <label htmlFor="endDate">End Date:</label>
                          <input
                            id="endDate"
                            type="date"
                            className="form-control filter-header"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                        <button
                          className="btn btn-sm btn-gradient-info mb-2"
                          onClick={handleFilter}
                        >
                          Filter
                        </button>
                      </div>

                      <div className="col-sm-4 d-flex align-items-center"></div>
                      <div className="col-sm-4 d-flex align-items-center">
                        {/* <div className="input-group me-2 w-100">
                          <div className="input-group-prepend bg-transparent">
                            <span className="input-group-text border-0 bg-transparent">
                              <i className="mdi mdi-magnify"></i>
                            </span>
                          </div>
                          <input
                            className="form-control bg-transparent border-0"
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div> */}
                         <button
                          className="btn btn-success btn-sm"
                          onClick={exportToExcel}
                        >
                          Export to Excel
                        </button>
                      </div>
                    </div>

                    {filteredAbsensi && filteredAbsensi.length > 0 ? (
                      <DataTable
                        keyField="Absensi_id"
                        columns={columns}
                        data={filteredAbsensi}
                        customStyles={{
                          rows: {
                            style: {
                              animation: "fadeIn 0.5s ease-in-out",
                            },
                          },
                        }}
                        pagination
                      />
                    ) : (
                      <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            {columns.map((col, index) => (
                              <th key={index} style={{fontSize:"12px"}}>{col.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAbsensi.length > 0 ? (
                            filteredAbsensi.map((row, index) => (
                              <tr key={index}>
                                {columns.map((col, colIndex) => (
                                  <td key={colIndex} >
                                    {col.cell ? col.cell(row) : col.selector(row)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={columns.length} style={{ textAlign: "center" }}>
                                <em>No data found</em>
                              </td>
                            </tr>
                          )}
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
      </div>
      )}
      {isModalOpenAbsensi && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeAbsensiModal}
        >
          {selectedImageAbsensi && selectedImageAbsensi.endsWith(".mp4") ? (
            <video
              controls
              style={{
                maxWidth: "60%",
                maxHeight: "60%",
                borderRadius: "10px",
              }}
              onClick={(e) => e.stopPropagation()} // Prevent close on video click
            >
              <source src={selectedImageAbsensi} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={selectedImageAbsensi}
              alt="Preview"
              style={{
                maxWidth: "60%",
                maxHeight: "60%",
                borderRadius: "10px",
              }}
              onClick={(e) => e.stopPropagation()} // Prevent close on image click
            />
          )}
        </div>
      )}

      {koreksiModalVisible && selectedKoreksi && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setKoreksiModalVisible(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "20px",
              width: "420px",
              maxWidth: "92%",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 style={{ marginTop: 0, marginBottom: "4px" }}>Koreksi Absen</h5>
            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#666" }}>
              {selectedKoreksi.nama_karyawan} — {selectedKoreksi.category_absen}
            </p>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>
                Tipe Absen{" "}
                <span style={{ fontWeight: 400, color: "#888" }}>
                  ({selectedKoreksi.direction || "-"})
                </span>
              </label>
              <select
                className="form-control"
                value={selectedKoreksi.absen_type_id}
                disabled={loadingTipe}
                onChange={(e) =>
                  setSelectedKoreksi({
                    ...selectedKoreksi,
                    absen_type_id: e.target.value,
                  })
                }
              >
                {loadingTipe && <option value="">Memuat tipe...</option>}
                {!loadingTipe &&
                  tipeAbsenOptions.length === 0 &&
                  selectedKoreksi.absen_type_id && (
                    <option value={selectedKoreksi.absen_type_id}>
                      {selectedKoreksi.category_absen}
                    </option>
                  )}
                {tipeAbsenOptions.map((t) => (
                  <option key={t.absen_id} value={String(t.absen_id)}>
                    {t.description || t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>Waktu Absen</label>
              <input
                type="datetime-local"
                className="form-control"
                value={selectedKoreksi.absen_time_local}
                onChange={(e) =>
                  setSelectedKoreksi({
                    ...selectedKoreksi,
                    absen_time_local: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>
                Status{" "}
                <span style={{ fontWeight: 400, color: "#888" }}>
                  (kosongkan = hitung otomatis dari jam)
                </span>
              </label>
              <select
                className="form-control"
                value={selectedKoreksi.status_absen}
                onChange={(e) =>
                  setSelectedKoreksi({
                    ...selectedKoreksi,
                    status_absen: e.target.value,
                  })
                }
              >
                <option value="">Otomatis (dari jam)</option>
                <option value="1">Ontime</option>
                <option value="2">Telat</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>Catatan</label>
              <textarea
                className="form-control"
                rows={3}
                value={selectedKoreksi.reason}
                onChange={(e) =>
                  setSelectedKoreksi({
                    ...selectedKoreksi,
                    reason: e.target.value,
                  })
                }
                placeholder="Catatan koreksi..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                className="btn btn-light"
                onClick={() => setKoreksiModalVisible(false)}
                disabled={savingKoreksi}
              >
                Batal
              </button>
              <button
                className="btn btn-gradient-primary"
                onClick={handleSaveKoreksi}
                disabled={savingKoreksi}
              >
                {savingKoreksi ? "Menyimpan..." : "Simpan Koreksi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Absensi;
