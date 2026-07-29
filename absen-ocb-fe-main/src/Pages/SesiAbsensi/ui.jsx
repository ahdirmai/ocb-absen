/* eslint-disable react/prop-types */
// Overlay + kartu modal reusable. Klik backdrop menutup; klik kartu tidak.
export const Modal = ({ onClose, width = 460, children }) => (
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
    onClick={onClose}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: 20,
        width,
        maxWidth: "94%",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

// Baris tombol aksi kanan-bawah modal (Batal + aksi utama).
export const ModalActions = ({ onCancel, onConfirm, confirmLabel, saving, confirmDisabled }) => (
  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
    <button className="btn btn-light" onClick={onCancel} disabled={saving}>
      Batal
    </button>
    <button
      className="btn btn-gradient-primary"
      onClick={onConfirm}
      disabled={saving || confirmDisabled}
    >
      {saving ? "Menyimpan..." : confirmLabel}
    </button>
  </div>
);

export const statusPill = (status) => {
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

export const iconBtn = (bg, title, onClick, icon, disabled = false) => (
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
