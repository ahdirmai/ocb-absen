import { format } from "date-fns";
import { fmtTime } from "./helpers";
import { statusPill, iconBtn } from "./ui";

// Bangun kolom DataTable. Handler aksi di-inject dari container.
export const buildColumns = ({ onMatch, onAdd, onUnmatch, onEditStatus, onEditLembur, onDelete }) => [
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
          <span style={{ marginLeft: 4, fontSize: "10px", color: "#ef6c00", fontWeight: 700 }}>
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
          iconBtn("#00897b", "Match pasangan", () => onMatch(row), "mdi-link-variant")}
        {(row.status === "incomplete" || row.status === "open") &&
          (row.masuk_absensi_id == null || row.keluar_absensi_id == null) &&
          iconBtn(
            "#43a047",
            `Tambah absen ${row.masuk_absensi_id == null ? "masuk" : "keluar"}`,
            () => onAdd(row),
            "mdi-plus-circle"
          )}
        {row.status === "closed" &&
          iconBtn("#f57c00", "Unmatch (pisah)", () => onUnmatch(row), "mdi-link-variant-off")}
        {iconBtn("#1e88e5", "Ubah status", () => onEditStatus(row), "mdi-pencil")}
        {iconBtn(
          "#ef6c00",
          row.is_lembur === 1 ? "Ubah ke Regular" : "Ubah ke Lembur",
          () => onEditLembur(row),
          "mdi-swap-horizontal"
        )}
        {iconBtn("#c62828", "Hapus sesi", () => onDelete(row), "mdi-delete")}
      </div>
    ),
  },
];
