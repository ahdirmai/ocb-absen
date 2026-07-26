import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { format } from "date-fns";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const pad = (n) => String(n).padStart(2, "0");
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Derive start/end date dari mode (hari/minggu/bulan) + tanggal anchor.
const deriveRange = (mode, anchorStr) => {
  const anchor = anchorStr ? new Date(anchorStr + "T00:00:00") : new Date();
  if (mode === "bulan") {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return { start: toYMD(start), end: toYMD(end) };
  }
  if (mode === "minggu") {
    // Minggu = Senin..Minggu yang memuat anchor.
    const day = (anchor.getDay() + 6) % 7; // 0=Senin
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toYMD(start), end: toYMD(end) };
  }
  // hari
  return { start: toYMD(anchor), end: toYMD(anchor) };
};

const statusPill = (status) => {
  const map = {
    open: ["#e3f2fd", "#1565c0", "Open"],
    closed: ["#e8f5e9", "#2e7d32", "Closed"],
    incomplete: ["#ffebee", "#c62828", "Incomplete"],
  };
  const [bg, color, label] = map[status] || ["#eceff1", "#607d8b", status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        background: bg,
        color,
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

const iconBtn = (bg, title, onClick, icon, disabled = false) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    style={{
      border: "none",
      background: disabled ? "#cfd8dc" : bg,
      color: "#fff",
      width: "30px",
      height: "30px",
      borderRadius: "7px",
      cursor: disabled ? "not-allowed" : "pointer",
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

const fmtTime = (t) => (t ? format(new Date(t), "dd MMM, HH:mm") : "—");

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const SesiAbsensi = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);

  // Filter
  const [status, setStatus] = useState("incomplete");
  const [rangeMode, setRangeMode] = useState("hari"); // hari|minggu|bulan
  const [anchorDate, setAnchorDate] = useState(toYMD(new Date()));
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Modal match
  const [matchModal, setMatchModal] = useState(null); // { sesi, needDir, candidates, selected }
  const [loadingCand, setLoadingCand] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  // Modal edit status
  const [statusModal, setStatusModal] = useState(null); // { sesi_id, status }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSesi = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = deriveRange(rangeMode, anchorDate);
      const params = new URLSearchParams({
        start_date: start,
        end_date: end,
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await axios.get(`${VITE_API_URL}/absensi/sesi?${params.toString()}`, {
        headers: authHeaders(),
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total) || 0);
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || error.message, "error");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, rangeMode, anchorDate, searchDebounced, page, limit]);

  useEffect(() => {
    fetchSesi();
  }, [fetchSesi]);

  // Reset ke page 1 saat filter berubah.
  useEffect(() => {
    setPage(1);
  }, [status, rangeMode, anchorDate, searchDebounced]);

  // ── Aksi ──
  const openMatchModal = async (row) => {
    setMatchModal({ sesi: row, needDir: null, candidates: [], selected: "" });
    setLoadingCand(true);
    try {
      const res = await axios.get(
        `${VITE_API_URL}/absensi/sesi/${row.sesi_id}/candidates`,
        { headers: authHeaders() }
      );
      setMatchModal({
        sesi: row,
        needDir: res.data?.need_direction || null,
        candidates: Array.isArray(res.data?.data) ? res.data.data : [],
        selected: "",
      });
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || error.message, "error");
      setMatchModal(null);
    } finally {
      setLoadingCand(false);
    }
  };

  const submitMatch = async () => {
    if (!matchModal?.selected) {
      Swal.fire("Error", "Pilih sesi pasangan dulu.", "error");
      return;
    }
    // Sesi ini keluar-only → butuh masuk; else masuk-only → butuh keluar.
    const isKeluarOrphan = matchModal.sesi.masuk_absensi_id == null;
    const payload = isKeluarOrphan
      ? { masuk_sesi_id: Number(matchModal.selected), keluar_sesi_id: matchModal.sesi.sesi_id }
      : { masuk_sesi_id: matchModal.sesi.sesi_id, keluar_sesi_id: Number(matchModal.selected) };
    setSavingAction(true);
    try {
      const res = await axios.post(`${VITE_API_URL}/absensi/sesi/match`, payload, {
        headers: authHeaders(),
      });
      Swal.fire("Berhasil!", res.data?.message || "Sesi dipasangkan.", "success");
      setMatchModal(null);
      fetchSesi();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingAction(false);
    }
  };

  const handleUnmatch = async (row) => {
    const ok = await Swal.fire({
      title: "Pisah sesi?",
      text: "Sesi closed ini dipisah jadi 2 incomplete (masuk & keluar terpisah).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, pisah",
      cancelButtonText: "Batal",
    });
    if (!ok.isConfirmed) return;
    try {
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${row.sesi_id}/unmatch`,
        {},
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Sesi dipisah.", "success");
      fetchSesi();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || error.message, "error");
    }
  };

  const submitStatus = async () => {
    if (!statusModal?.status) return;
    setSavingAction(true);
    try {
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${statusModal.sesi_id}/status`,
        { status: statusModal.status },
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Status diperbarui.", "success");
      setStatusModal(null);
      fetchSesi();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingAction(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await Swal.fire({
      title: "Hapus sesi?",
      text: `Sesi #${row.sesi_id} akan dihapus permanen (baris absensi tidak terhapus).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#c62828",
    });
    if (!ok.isConfirmed) return;
    try {
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${row.sesi_id}/delete`,
        {},
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Sesi dihapus.", "success");
      fetchSesi();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || error.message, "error");
    }
  };

  const columns = [
    {
      name: "Tanggal",
      sortable: true,
      width: "110px",
      selector: (row) => row.tanggal,
      cell: (row) => (row.tanggal ? format(new Date(row.tanggal), "dd MMM yyyy") : "—"),
    },
    {
      name: "Karyawan",
      grow: 1.4,
      selector: (row) => row.nama_karyawan || "",
      cell: (row) => (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontWeight: 600 }}>{row.nama_karyawan}</div>
          <div style={{ fontSize: "11px", color: "#78909c" }}>{row.username}</div>
        </div>
      ),
    },
    {
      name: "Retail",
      grow: 0.8,
      selector: (row) => row.retail_name || "—",
    },
    {
      name: "Shift",
      grow: 1,
      selector: (row) => row.shift_name || row.kategori_absen || "—",
      cell: (row) => (
        <div>
          <div style={{ fontSize: "12px" }}>{row.shift_name || "—"}</div>
          <div style={{ fontSize: "11px", color: "#78909c" }}>{row.kategori_absen || ""}</div>
        </div>
      ),
    },
    {
      name: "Masuk",
      grow: 1,
      cell: (row) =>
        row.masuk_absensi_id ? (
          <span style={{ fontSize: "12px", color: "#2e7d32" }}>{fmtTime(row.masuk_time)}</span>
        ) : (
          <span style={{ color: "#c62828", fontWeight: 600 }}>—</span>
        ),
    },
    {
      name: "Keluar",
      grow: 1,
      cell: (row) =>
        row.keluar_absensi_id ? (
          <span style={{ fontSize: "12px", color: "#1565c0" }}>{fmtTime(row.keluar_time)}</span>
        ) : (
          <span style={{ color: "#c62828", fontWeight: 600 }}>—</span>
        ),
    },
    {
      name: "Status",
      grow: 0.8,
      cell: (row) => (
        <div>
          {statusPill(row.status)}
          {row.is_lembur === 1 && (
            <span
              style={{
                marginLeft: 4,
                fontSize: "10px",
                color: "#ef6c00",
                fontWeight: 700,
              }}
            >
              Lembur
            </span>
          )}
          {row.has_candidate === 1 && (
            <div style={{ fontSize: "10px", color: "#00897b", fontWeight: 700, marginTop: 2 }}>
              ada pasangan
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Aksi",
      grow: 1.2,
      cell: (row) => (
        <div style={{ display: "flex" }}>
          {row.status === "incomplete" &&
            iconBtn("#00897b", "Match pasangan", () => openMatchModal(row), "mdi-link-variant")}
          {row.status === "closed" &&
            iconBtn("#f57c00", "Unmatch (pisah)", () => handleUnmatch(row), "mdi-link-variant-off")}
          {iconBtn(
            "#1e88e5",
            "Ubah status",
            () => setStatusModal({ sesi_id: row.sesi_id, status: row.status }),
            "mdi-pencil"
          )}
          {iconBtn("#c62828", "Hapus sesi", () => handleDelete(row), "mdi-delete")}
        </div>
      ),
    },
  ];

  const { start, end } = deriveRange(rangeMode, anchorDate);

  return (
    <div className="content-wrapper" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0 }}>Kelola Sesi Absensi</h4>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#78909c" }}>
            Pasangkan absen masuk & keluar, kelola sesi incomplete/closed. Rentang: {start} s/d {end}
          </p>
        </div>
      </div>

      {/* Toolbar filter */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-end",
          background: "#fff",
          padding: 14,
          borderRadius: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>
            <option value="incomplete">Incomplete</option>
            <option value="closed">Closed</option>
            <option value="open">Open</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Rentang</label>
          <select className="form-control" value={rangeMode} onChange={(e) => setRangeMode(e.target.value)}>
            <option value="hari">Per Hari</option>
            <option value="minggu">Per Minggu</option>
            <option value="bulan">Per Bulan</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tanggal</label>
          <input
            type="date"
            className="form-control"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Cari Karyawan</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nama / username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-light" onClick={fetchSesi} disabled={loading}>
          <i className="mdi mdi-refresh"></i> Refresh
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, padding: 8 }}>
        <DataTable
          columns={columns}
          data={rows}
          progressPending={loading}
          pagination
          paginationServer
          paginationTotalRows={total}
          paginationDefaultPage={page}
          paginationPerPage={limit}
          paginationRowsPerPageOptions={[25, 50, 100, 200]}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(newLimit, p) => {
            setLimit(newLimit);
            setPage(p);
          }}
          highlightOnHover
          dense
          noDataComponent={<div style={{ padding: 24, color: "#90a4ae" }}>Tidak ada sesi.</div>}
        />
      </div>

      {/* Modal Match */}
      {matchModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setMatchModal(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: 20,
              width: 520,
              maxWidth: "94%",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 style={{ marginTop: 0 }}>Match Sesi Absensi</h5>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
              {matchModal.sesi.nama_karyawan} — {matchModal.sesi.shift_name || "-"}
            </p>
            <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12 }}>
              <div>
                <b>Sesi ini (#{matchModal.sesi.sesi_id})</b>
              </div>
              <div>Masuk: {matchModal.sesi.masuk_absensi_id ? fmtTime(matchModal.sesi.masuk_time) : "— (kosong)"}</div>
              <div>Keluar: {matchModal.sesi.keluar_absensi_id ? fmtTime(matchModal.sesi.keluar_time) : "— (kosong)"}</div>
            </div>

            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Pilih sesi pasangan ({matchModal.needDir === "masuk" ? "absen masuk" : "absen keluar"})
            </label>
            {loadingCand ? (
              <p style={{ color: "#90a4ae" }}>Memuat kandidat...</p>
            ) : matchModal.candidates.length === 0 ? (
              <p style={{ color: "#c62828" }}>Tidak ada kandidat pasangan yang cocok.</p>
            ) : (
              <select
                className="form-control"
                value={matchModal.selected}
                onChange={(e) => setMatchModal({ ...matchModal, selected: e.target.value })}
              >
                <option value="">-- pilih --</option>
                {matchModal.candidates.map((c) => (
                  <option key={c.sesi_id} value={String(c.sesi_id)}>
                    #{c.sesi_id} · {c.shift_name} · {fmtTime(c.pair_time)}
                  </option>
                ))}
              </select>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-light" onClick={() => setMatchModal(null)} disabled={savingAction}>
                Batal
              </button>
              <button
                className="btn btn-gradient-primary"
                onClick={submitMatch}
                disabled={savingAction || !matchModal.selected}
              >
                {savingAction ? "Menyimpan..." : "Pasangkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Status */}
      {statusModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setStatusModal(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: 10, padding: 20, width: 380, maxWidth: "92%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 style={{ marginTop: 0 }}>Ubah Status Sesi #{statusModal.sesi_id}</h5>
            <select
              className="form-control"
              value={statusModal.status}
              onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="incomplete">Incomplete</option>
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn btn-light" onClick={() => setStatusModal(null)} disabled={savingAction}>
                Batal
              </button>
              <button className="btn btn-gradient-primary" onClick={submitStatus} disabled={savingAction}>
                {savingAction ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SesiAbsensi;
