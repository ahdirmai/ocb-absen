/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const now = new Date();
const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

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

const RetailBaru = ({
  loading,
  error,
  stats,
  rows,
  columns,
  globalSearch,
  setGlobalSearch,
  quickFilter,
  setQuickFilter,
  onAdd,
}) => {
  const chips = [
    { key: "semua", label: "Semua" },
    { key: "aktif", label: "Aktif" },
    { key: "nonaktif", label: "Non Aktif" },
    { key: "nolokasi", label: "Tanpa Lokasi" },
  ];

  return (
    <div style={{ padding: "4px 2px" }}>
      {/* Stat ringkasan */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <StatCard label="Total Retail" value={stats.total} color="#455a64" icon="mdi-store" />
        <StatCard label="Aktif" value={stats.aktif} color="#2e7d32" icon="mdi-store-check" />
        <StatCard label="Non Aktif" value={stats.nonaktif} color="#c62828" icon="mdi-store-remove" />
        <StatCard label="Tanpa Lokasi" value={stats.nolokasi} color="#ef6c00" icon="mdi-map-marker-off" />
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
          <div style={{ flex: "2 1 240px" }}>
            <label style={{ fontSize: "12px", color: "#607d8b", fontWeight: 600 }}>Cari</label>
            <div style={{ position: "relative" }}>
              <i
                className="mdi mdi-magnify"
                style={{ position: "absolute", left: "10px", top: "9px", color: "#b0bec5", fontSize: "18px" }}
              ></i>
              <input
                type="text"
                className="form-control"
                placeholder="Nama retail / outlet..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                style={{ paddingLeft: "34px", borderRadius: "10px" }}
              />
            </div>
          </div>
          <button
            className="btn"
            onClick={onAdd}
            style={{ background: "#2471a3", color: "#fff", borderRadius: "10px", fontWeight: 600 }}
          >
            <i className="mdi mdi-plus"></i> Tambah Retail
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
            <i className="mdi mdi-store-off" style={{ fontSize: "36px" }}></i>
            <p style={{ marginTop: "8px" }}>Tidak ada data retail.</p>
          </div>
        ) : (
          <DataTable
            keyField="retail_id"
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

const Retail = () => {
  const [retails, setRetails] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRetail, setSelectedRetail] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [newRetail, setNewRetail] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: "",
    is_active: 1,
  });

  // UI baru (toggle dalam halaman). Default "baru", persist ke localStorage.
  const [uiMode, setUiMode] = useState(
    () => localStorage.getItem("retail_ui_mode") || "baru"
  );
  const [globalSearch, setGlobalSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("semua"); // semua|aktif|nonaktif|nolokasi

  useEffect(() => {
    localStorage.setItem("retail_ui_mode", uiMode);
  }, [uiMode]);

  useEffect(() => {
    const fetchRetails = async () => {
      setLoading(true);
      try {
        
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${VITE_API_URL}/retail`, { headers });
        const fetchedData = response.data.data || [];
        const validData = fetchedData.filter((item) => item && item.name);
        setRetails(validData);
        
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRetails();
  }, []);

  const filteredRetail= retails.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";
  const hasLokasi = (row) =>
    !isBlank(row.latitude) && !isBlank(row.longitude) && !isBlank(row.radius);

  // Baris UI BARU: search global + quick filter chip.
  const displayedRows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return retails.filter((row) => {
      if (q && !String(row.name || "").toLowerCase().includes(q)) return false;
      switch (quickFilter) {
        case "aktif":
          return !!row.is_active;
        case "nonaktif":
          return !row.is_active;
        case "nolokasi":
          return !hasLokasi(row);
        default:
          return true;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retails, globalSearch, quickFilter]);

  const stats = useMemo(() => {
    return {
      total: displayedRows.length,
      aktif: displayedRows.filter((r) => !!r.is_active).length,
      nonaktif: displayedRows.filter((r) => !r.is_active).length,
      nolokasi: displayedRows.filter((r) => !hasLokasi(r)).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedRows]);

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userData = JSON.parse(sessionStorage.getItem("userData"));
      const userId = userData?.id;

      const response = await axios.post(
        `${VITE_API_URL}/retail/create`,
        {
          ...newRetail,
          created_by: userId,
          created_at: DateNow,
        },
        { headers }
      );

      setRetails((prev) => [ response.data.data, ...prev,]);
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalVisible(false);
      setNewRetail({ name: "", latitude: "", longitude: "", radius: "", is_active: 1 });
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    }
  };

  const handleUpdate = (row) => {
    setSelectedRetail(row);
    setModalVisible(true);
  };

  const handleDelete = async (row) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete Retail : ${row.name} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const userData = JSON.parse(sessionStorage.getItem("userData"));
          const userId = userData?.id;
          const headers = { Authorization: `Bearer ${token}` };
          const responseDelete = await axios.post(`${VITE_API_URL}/retail/delete/${row.retail_id}`,
            {
              deleted_by : userId,
              deleted_at: DateNow
            }, { headers });
          Swal.fire("Deleted!", `${responseDelete.data.message}`, "success");
          setRetails((prev) => prev.filter((item) => item.retail_id !== row.retail_id));
        } catch (error) {
          Swal.fire("Error!", error.response?.data?.message || error.message, "error");
        }
      }
    });
  };

  

  const handleSaveUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userData = JSON.parse(sessionStorage.getItem("userData"));
      const userId = userData?.id;
      const responseUpdate = await axios.post(
        `${VITE_API_URL}/retail/update/${selectedRetail.retail_id}`,
        {
          name: selectedRetail.name,
          latitude: selectedRetail.latitude,
          longitude: selectedRetail.longitude,
          radius: selectedRetail.radius,
          is_active: selectedRetail.is_active,
          updated_by : userId,
          updated_at: DateNow

        },
        { headers }
      );
      // setRetails(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      setRetails((prev) =>
        prev.map((item) =>
          item.retail_id === selectedRetail.retail_id ? selectedRetail : item
        )
      );
      setModalVisible(false);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };



  const columns = [
    {
      name: "#",
      cell: (row, index) => <span>{index + 1}</span>,
      width: "50px",
    },
    { name: "Nama Retail", selector: (row) => row.name },
    { name: "Latitude", selector: (row) => row.latitude },
    { name: "Longitude", selector: (row) => row.longitude },
    { name: "Radius(m)", selector: (row) => row.radius },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`badge ${
            row.is_active ? "badge-success" : "badge-danger"
          }`}
        >
          {row.is_active ? "Active" : "Non Active"}
        </span>
      ),
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="action-buttons">
          <button
            className="btn btn-gradient-warning btn-sm"
            onClick={() => handleUpdate(row)}
          >
            Update
          </button>
          <button
            className="btn btn-gradient-danger btn-sm"
            onClick={() => handleDelete(row)}
          >
            Delete
          </button>
        </div>
      ),
    }
  ];

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

  // Kolom UI BARU: sortable, badge lokasi/status, link map, aksi ikon.
  const columnsV2 = [
    {
      name: "Retail / Outlet",
      sortable: true,
      selector: (row) => row.name || "",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "9px",
              background: row.is_active ? "#e3f2fd" : "#eceff1",
              color: row.is_active ? "#1976d2" : "#90a4ae",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              flexShrink: 0,
            }}
          >
            <i className="mdi mdi-store"></i>
          </span>
          <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "13px" }}>{row.name}</span>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Koordinat",
      sortable: false,
      cell: (row) =>
        hasLokasi(row) ? (
          <span style={{ fontSize: "12px", color: "#546e7a", fontVariantNumeric: "tabular-nums" }}>
            {Number(row.latitude).toFixed(5)}, {Number(row.longitude).toFixed(5)}
          </span>
        ) : (
          <span style={{ fontSize: "12px", color: "#ef6c00" }}>
            <i className="mdi mdi-map-marker-off"></i> belum diset
          </span>
        ),
      grow: 1.8,
    },
    {
      name: "Radius",
      sortable: true,
      selector: (row) => Number(row.radius) || 0,
      cell: (row) =>
        isBlank(row.radius) ? (
          <span style={{ color: "#b0bec5", fontSize: "12px" }}>-</span>
        ) : (
          <span style={{ fontSize: "12px", color: "#455a64", fontWeight: 600 }}>{row.radius} m</span>
        ),
      width: "100px",
    },
    {
      name: "Status",
      sortable: true,
      selector: (row) => (row.is_active ? 0 : 1),
      cell: (row) =>
        row.is_active
          ? pill("#e8f5e9", "#2e7d32", "Aktif")
          : pill("#ffebee", "#c62828", "Non Aktif"),
      width: "110px",
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {hasLokasi(row) &&
            iconBtn(
              "#26a69a",
              "Lihat lokasi di peta",
              () =>
                window.open(
                  `https://www.google.com/maps?q=${row.latitude},${row.longitude}`,
                  "_blank",
                  "noopener,noreferrer"
                ),
              "mdi-map-marker"
            )}
          {iconBtn("#fb8c00", "Edit retail", () => handleUpdate(row), "mdi-pencil")}
          {iconBtn("#c62828", "Hapus retail", () => handleDelete(row), "mdi-delete")}
        </div>
      ),
      width: "140px",
    },
  ];

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
        <h3 className="page-title" style={{ margin: 0 }}>Data Retails</h3>
        {uiToggle}
      </div>

      {uiMode === "baru" ? (
        <RetailBaru
          loading={loading}
          error={error}
          stats={stats}
          rows={displayedRows}
          columns={columnsV2}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          onAdd={() => setAddModalVisible(true)}
        />
      ) : (
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Retail / Outlet</h4>
              <div className="">
              {loading ? (
                  <p>Loading data...</p>
                ) : error ? (
                  <p className="text-danger">Error: {error}</p>
                ) : (
                  <>
                <div className="row">
                  <div className="col-sm-8">
                  <button className="btn btn-gradient-primary btn-sm"
                          onClick={() => setAddModalVisible(true)}
                        >
                  Tambah Retail
                </button>
                  </div>
                  <div className="col-sm-4">
                        <div className="input-group">
                          <div className="input-group-prepend bg-transparent">
                            <i className="input-group-text border-0 mdi mdi-magnify" style={{margin: "10px",}}></i>
                          </div>
                          <input
                            className="form-control bg-transparent border-0"
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                              margin: "10px",
                              padding: "5px",
                              width: "200px",
                            }}
                          />
                        </div>
                      </div>
                </div>
                  
                    
                    {filteredRetail && filteredRetail.length > 0 ? (
                      <DataTable
                        keyField="retail_id"
                        columns={columns}
                        data={filteredRetail}
                        pagination
                      />
                    ) : (
                      <p>No retail data available.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modal Tambah Retail */}
      <Modal show={addModalVisible} onHide={() => setAddModalVisible(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #eceff1" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: 700, color: "#263238" }}>
            <i className="mdi mdi-store-plus" style={{ color: "#2471a3", marginRight: "8px" }}></i>
            Tambah Retail
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f7f9fb", padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-store-outline" style={{ marginRight: "4px" }}></i>Nama Retail
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: "10px" }}
                value={newRetail.name}
                onChange={(e) => setNewRetail({ ...newRetail, name: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-latitude" style={{ marginRight: "4px" }}></i>Latitude
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  value={newRetail.latitude}
                  onChange={(e) => setNewRetail({ ...newRetail, latitude: e.target.value })}
                />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-longitude" style={{ marginRight: "4px" }}></i>Longitude
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  value={newRetail.longitude}
                  onChange={(e) => setNewRetail({ ...newRetail, longitude: e.target.value })}
                />
              </div>
            </div>
            {!isBlank(newRetail.latitude) && !isBlank(newRetail.longitude) && (
              <a
                href={`https://www.google.com/maps?q=${newRetail.latitude},${newRetail.longitude}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#26a69a", display: "inline-block", marginBottom: "16px", fontWeight: 600 }}
              >
                <i className="mdi mdi-map-marker"></i> Cek titik di Google Maps
              </a>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-radius" style={{ marginRight: "4px" }}></i>Radius (m)
                </label>
                <input
                  type="number"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  value={newRetail.radius}
                  onChange={(e) => setNewRetail({ ...newRetail, radius: e.target.value })}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-check-circle-outline" style={{ marginRight: "4px" }}></i>Status
                </label>
                <select
                  className="form-select"
                  style={{ borderRadius: "10px" }}
                  value={newRetail.is_active}
                  onChange={(e) =>
                    setNewRetail({ ...newRetail, is_active: e.target.value === "1" ? 1 : 0 })
                  }
                >
                  <option value="1">Aktif</option>
                  <option value="0">Non Aktif</option>
                </select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #eceff1" }}>
          <Button className="btn btn-light" onClick={() => setAddModalVisible(false)}>
            Batal
          </Button>
          <Button onClick={handleAddUser} style={{ background: "#2471a3", border: "none", fontWeight: 600 }}>
            <i className="mdi mdi-plus" style={{ marginRight: "5px" }}></i>Tambah Retail
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Edit Retail */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #eceff1" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: 700, color: "#263238" }}>
            <i className="mdi mdi-store-edit" style={{ color: "#fb8c00", marginRight: "8px" }}></i>
            Edit Retail
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f7f9fb", padding: "20px" }}>
          {/* Ringkasan */}
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "10px", background: "#fff", borderRadius: "12px",
              padding: "14px 16px", marginBottom: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "40px", height: "40px", borderRadius: "10px", background: "#e3f2fd",
                  color: "#1976d2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                }}
              >
                <i className="mdi mdi-store"></i>
              </span>
              <div>
                <div style={{ fontWeight: 700, color: "#263238", fontSize: "14px" }}>
                  {selectedRetail.name || "Retail"}
                </div>
                <div style={{ fontSize: "12px", color: "#90a4ae" }}>
                  {hasLokasi(selectedRetail) ? `Radius ${selectedRetail.radius} m` : "Lokasi belum diset"}
                </div>
              </div>
            </div>
            {selectedRetail.is_active
              ? pill("#e8f5e9", "#2e7d32", "Aktif")
              : pill("#ffebee", "#c62828", "Non Aktif")}
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-store-outline" style={{ marginRight: "4px" }}></i>Nama Retail
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: "10px" }}
                value={selectedRetail.name || ""}
                onChange={(e) => setSelectedRetail({ ...selectedRetail, name: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-latitude" style={{ marginRight: "4px" }}></i>Latitude
                </label>
                <input
                  className="form-control"
                  type="text"
                  style={{ borderRadius: "10px" }}
                  value={selectedRetail.latitude || ""}
                  onChange={(e) => setSelectedRetail({ ...selectedRetail, latitude: e.target.value })}
                />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-longitude" style={{ marginRight: "4px" }}></i>Longitude
                </label>
                <input
                  className="form-control"
                  type="text"
                  style={{ borderRadius: "10px" }}
                  value={selectedRetail.longitude || ""}
                  onChange={(e) => setSelectedRetail({ ...selectedRetail, longitude: e.target.value })}
                />
              </div>
            </div>
            {!isBlank(selectedRetail.latitude) && !isBlank(selectedRetail.longitude) && (
              <a
                href={`https://www.google.com/maps?q=${selectedRetail.latitude},${selectedRetail.longitude}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "12px", color: "#26a69a", display: "inline-block", marginBottom: "16px", fontWeight: 600 }}
              >
                <i className="mdi mdi-map-marker"></i> Cek titik di Google Maps
              </a>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-radius" style={{ marginRight: "4px" }}></i>Radius (m)
                </label>
                <input
                  className="form-control"
                  type="number"
                  style={{ borderRadius: "10px" }}
                  value={selectedRetail.radius || ""}
                  onChange={(e) => setSelectedRetail({ ...selectedRetail, radius: e.target.value })}
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-check-circle-outline" style={{ marginRight: "4px" }}></i>Status
                </label>
                <select
                  className="form-select"
                  style={{ borderRadius: "10px" }}
                  value={selectedRetail.is_active ? "1" : "0"}
                  onChange={(e) =>
                    setSelectedRetail({ ...selectedRetail, is_active: e.target.value === "1" ? 1 : 0 })
                  }
                >
                  <option value="1">Aktif</option>
                  <option value="0">Non Aktif</option>
                </select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #eceff1" }}>
          <Button className="btn btn-light" onClick={() => setModalVisible(false)}>
            Batal
          </Button>
          <Button onClick={handleSaveUpdate} style={{ background: "#2471a3", border: "none", fontWeight: 600 }}>
            <i className="mdi mdi-content-save" style={{ marginRight: "5px" }}></i>Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Retail;
