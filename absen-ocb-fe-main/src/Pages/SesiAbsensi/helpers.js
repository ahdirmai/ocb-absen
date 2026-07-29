import { format } from "date-fns";

const pad = (n) => String(n).padStart(2, "0");

export const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Derive start/end date dari mode (hari/minggu/bulan) + tanggal anchor.
export const deriveRange = (mode, anchorStr) => {
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

export const fmtTime = (t) => (t ? format(new Date(t), "dd MMM, HH:mm") : "—");

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
