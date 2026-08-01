import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Swal from "sweetalert2";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;

// Normalisasi status_approval (angka / teks) -> waiting|approved|rejected.
const normStatus = (v) => {
  const s = String(v ?? "").toLowerCase();
  if (s === "2" || s.includes("approv") || s.includes("setuju")) return "approved";
  if (s === "3" || s.includes("reject") || s.includes("tolak")) return "rejected";
  return "waiting";
};

const STATUS_META = {
  waiting: { label: "Menunggu", bg: "#fff8e1", fg: "#8d6e00", icon: "mdi-clock-outline" },
  approved: { label: "Disetujui", bg: "#e8f5e9", fg: "#2e7d32", icon: "mdi-check-circle-outline" },
  rejected: { label: "Ditolak", bg: "#ffebee", fg: "#c62828", icon: "mdi-close-circle-outline" },
};

const fmtTime = (t) => {
  if (!t) return "-";
  try {
    return format(new Date(String(t).replace(" ", "T")), "dd MMM yyyy HH:mm", { locale: localeId });
  } catch {
    return String(t);
  }
};

const ApprovalAbsen = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [tab, setTab] = useState("pending"); // pending | riwayat
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    try {
      const prof = JSON.parse(sessionStorage.getItem("userProfile"));
      const p = Array.isArray(prof) ? prof[0] : prof;
      setUserName(p?.name || p?.nama || p?.username || "");
    } catch {
      // nama opsional
    }
  }, []);

  const fetchApproval = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      window.location.href = "/absen";
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${VITE_API_URL}/absensi/approval/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRows(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = "/absen";
        return;
      }
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApproval();
  }, [fetchApproval]);

  // Hanya tampilkan absen hari ini + kemarin (H-1).
  const allowedDates = useMemo(() => {
    const d = new Date();
    const ymd = (x) => format(x, "yyyy-MM-dd");
    const today = ymd(d);
    const yst = ymd(new Date(d.getTime() - 86400000));
    return new Set([today, yst]);
  }, []);

  const decorated = useMemo(
    () =>
      rows
        .filter((r) => allowedDates.has(String(r.absen_time || "").slice(0, 10)))
        .map((r) => ({ ...r, _st: normStatus(r.status_approval) })),
    [rows, allowedDates]
  );

  const pending = useMemo(() => decorated.filter((r) => r._st === "waiting"), [decorated]);
  const riwayat = useMemo(() => decorated.filter((r) => r._st !== "waiting"), [decorated]);
  const shown = tab === "pending" ? pending : riwayat;

  const doAction = async (row, action) => {
    const isApprove = action === "approve";
    const conf = await Swal.fire({
      title: isApprove ? "Setujui absen ini?" : "Tolak absen ini?",
      html: `<b>${row.nama_karyawan}</b><br/>${row.category_absen || ""}<br/>${fmtTime(row.absen_time)}`,
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#2e7d32" : "#d33",
      cancelButtonColor: "#95a5a6",
      confirmButtonText: isApprove ? "Ya, setujui" : "Ya, tolak",
      cancelButtonText: "Batal",
    });
    if (!conf.isConfirmed) return;

    const token = localStorage.getItem("token");
    const url = isApprove
      ? `${VITE_API_URL}/absensi/approve-absensi/${row.absensi_id}`
      : `${VITE_API_URL}/absensi/reject-absensi/${row.absensi_id}`;
    setBusyId(row.absensi_id);
    try {
      const res = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      // Update lokal: pindahkan baris ke riwayat dengan status baru.
      setRows((prev) =>
        prev.map((it) =>
          it.absensi_id === row.absensi_id
            ? { ...it, status_approval: isApprove ? "approved" : "rejected" }
            : it
        )
      );
      Swal.fire(isApprove ? "Disetujui!" : "Ditolak!", res.data.message || "Berhasil", "success");
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#e74c3c", margin: 0 }}>Approval Absen</h2>
        <button
          onClick={() => (window.location.href = "/absen")}
          style={{ padding: "8px 15px", background: "#95a5a6", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}
        >
          ← Absen
        </button>
      </div>

      {userName && (
        <div style={{ background: "#f0f0f0", padding: "10px 15px", borderRadius: 10, marginBottom: 16 }}>
          <strong>{userName}</strong>
          <span style={{ color: "#78909c", fontSize: 13 }}> · Atasan</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "pending", label: `Pending (${pending.length})` },
          { key: "riwayat", label: `Riwayat (${riwayat.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === t.key ? "#e74c3c" : "#eceff1",
              color: tab === t.key ? "#fff" : "#607d8b",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#90a4ae" }}>
          <i className="mdi mdi-loading mdi-spin" style={{ fontSize: 28 }}></i>
          <p style={{ marginTop: 8 }}>Memuat data...</p>
        </div>
      ) : error ? (
        <div style={{ background: "#ffebee", color: "#c62828", padding: 14, borderRadius: 10 }}>{error}</div>
      ) : shown.length === 0 ? (
        <div style={{ background: "#fff8e1", color: "#8d6e00", padding: 18, borderRadius: 12, textAlign: "center" }}>
          <i className="mdi mdi-inbox-outline" style={{ fontSize: 34, display: "block", marginBottom: 8 }}></i>
          {tab === "pending"
            ? "Tidak ada absen menunggu persetujuan."
            : "Belum ada riwayat approval."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shown.map((row) => {
            const meta = STATUS_META[row._st];
            const busy = busyId === row.absensi_id;
            return (
              <div
                key={row.absensi_id}
                style={{ background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <img
                    src={row.photo_url ? `${VITE_API_IMAGE}${row.photo_url}` : "/user-icon.jpg"}
                    alt="absen"
                    style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#eceff1" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#263238", fontSize: 15 }}>{row.nama_karyawan}</div>
                    <div style={{ fontSize: 12, color: "#607d8b" }}>{row.category_absen}</div>
                    <div style={{ fontSize: 12, color: "#90a4ae", marginTop: 2 }}>
                      <i className="mdi mdi-map-marker" /> {row.retail_name}
                    </div>
                    <div style={{ fontSize: 12, color: "#90a4ae" }}>
                      <i className="mdi mdi-clock-outline" /> {fmtTime(row.absen_time)}
                    </div>
                  </div>
                  <span
                    style={{
                      alignSelf: "flex-start",
                      background: meta.bg,
                      color: meta.fg,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <i className={`mdi ${meta.icon}`} /> {meta.label}
                  </span>
                </div>

                {row.reason && (
                  <div style={{ marginTop: 10, background: "#f7f9fa", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#546e7a" }}>
                    <i className="mdi mdi-comment-text-outline" /> {row.reason}
                  </div>
                )}

                {row._st === "waiting" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      disabled={busy}
                      onClick={() => doAction(row, "approve")}
                      style={{
                        flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                        background: "#2e7d32", color: "#fff", fontWeight: 700, fontSize: 13,
                        cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
                      }}
                    >
                      <i className="mdi mdi-check" /> Setujui
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => doAction(row, "reject")}
                      style={{
                        flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                        background: "#d33", color: "#fff", fontWeight: 700, fontSize: 13,
                        cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
                      }}
                    >
                      <i className="mdi mdi-close" /> Tolak
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApprovalAbsen;
