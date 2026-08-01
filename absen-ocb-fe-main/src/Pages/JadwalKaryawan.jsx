import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Warna badge per kategori shift.
const KAT_COLOR = {
  pagi: { bg: "#e8f5e9", fg: "#2e7d32" },
  sore: { bg: "#fff3e0", fg: "#e65100" },
  malam: { bg: "#e3f2fd", fg: "#1565c0" },
};
const katColor = (k) => KAT_COLOR[String(k || "").toLowerCase()] || { bg: "#eceff1", fg: "#455a64" };

const hhmm = (t) => (t ? String(t).slice(0, 5) : "");

const JadwalKaryawan = () => {
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [jadwal, setJadwal] = useState([]);
  const [usesJadwal, setUsesJadwal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      window.location.href = "/absen";
      return;
    }
    try {
      const prof = JSON.parse(sessionStorage.getItem("userProfile"));
      const p = Array.isArray(prof) ? prof[0] : prof;
      setUserName(p?.name || p?.nama || p?.username || "");
    } catch {
      // abaikan — nama opsional
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) return;

    const fetchJadwal = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${VITE_API_URL}/jadwal-harian/user/${userId}?month=${month}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setJadwal(res.data.jadwal || []);
        setUsesJadwal(res.data.uses_jadwal_harian !== false);
      } catch (err) {
        if (err.response?.status === 401) {
          window.location.href = "/absen";
          return;
        }
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJadwal();
  }, [month]);

  // Map tanggal(YYYY-MM-DD) -> baris jadwal.
  const jadwalMap = useMemo(() => {
    const m = new Map();
    for (const j of jadwal) m.set(j.tanggal, j);
    return m;
  }, [jadwal]);

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const firstDayOffset = new Date(year, mon - 1, 1).getDay(); // 0=Min

  // Susun sel kalender: offset kosong + hari 1..N.
  const cells = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = format(now, "yyyy-MM-dd");

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#e74c3c", margin: 0 }}>Jadwal Saya</h2>
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
        </div>
      )}

      {/* Month picker */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", fontSize: 16, boxSizing: "border-box" }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#90a4ae" }}>
          <i className="mdi mdi-loading mdi-spin" style={{ fontSize: 28 }}></i>
          <p style={{ marginTop: 8 }}>Memuat jadwal...</p>
        </div>
      ) : error ? (
        <div style={{ background: "#ffebee", color: "#c62828", padding: 14, borderRadius: 10 }}>{error}</div>
      ) : !usesJadwal ? (
        <div style={{ background: "#fff8e1", color: "#8d6e00", padding: 18, borderRadius: 12, textAlign: "center" }}>
          <i className="mdi mdi-calendar-remove" style={{ fontSize: 34, display: "block", marginBottom: 8 }}></i>
          Anda tidak menggunakan jadwal harian.
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {/* Nama hari */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {HARI.map((h, i) => (
              <div key={h} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? "#e53935" : "#78909c", padding: "4px 0" }}>
                {h}
              </div>
            ))}
          </div>
          {/* Grid tanggal */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((d, idx) => {
              if (d === null) return <div key={`e${idx}`} />;
              const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const j = jadwalMap.get(dateStr);
              const isToday = dateStr === todayStr;
              const c = j ? katColor(j.kategori_absen) : null;
              return (
                <div
                  key={dateStr}
                  style={{
                    minHeight: 62,
                    border: isToday ? "2px solid #e74c3c" : "1px solid #eceff1",
                    borderRadius: 8,
                    padding: 4,
                    background: j ? c.bg : "#fafafa",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#e74c3c" : "#607d8b" }}>{d}</div>
                  {j && (
                    <div style={{ marginTop: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: c.fg, lineHeight: 1.1 }}>
                        {j.kategori_absen ? String(j.kategori_absen).toUpperCase() : j.shift_name}
                      </div>
                      {(j.masuk_time || j.keluar_time) && (
                        <div style={{ fontSize: 8, color: c.fg, opacity: 0.85, marginTop: 1 }}>
                          {hhmm(j.masuk_time)}–{hhmm(j.keluar_time)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ringkasan bawah */}
          <div style={{ marginTop: 12, fontSize: 12, color: "#78909c", textAlign: "center" }}>
            {jadwal.length} hari terjadwal · {format(new Date(year, mon - 1, 1), "MMMM yyyy", { locale: localeId })}
          </div>
        </div>
      )}
    </div>
  );
};

export default JadwalKaryawan;
