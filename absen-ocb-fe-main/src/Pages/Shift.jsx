/* eslint-disable react/prop-types */
import { useState,useRef, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";
import Select from "react-select";
import { Tooltip } from "react-tooltip";

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

const ShiftBaru = ({
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
    { key: "berakhir", label: "Berakhir" },
    { key: "jadwal", label: "Jadwal Harian" },
    { key: "reguler", label: "Reguler" },
  ];

  return (
    <div style={{ padding: "4px 2px" }}>
      {/* Stat ringkasan */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <StatCard label="Total Shift" value={stats.total} color="#455a64" icon="mdi-calendar-multiple" />
        <StatCard label="Aktif" value={stats.aktif} color="#2e7d32" icon="mdi-calendar-check" />
        <StatCard label="Berakhir" value={stats.berakhir} color="#c62828" icon="mdi-calendar-remove" />
        <StatCard label="Jadwal Harian" value={stats.jadwal} color="#8e24aa" icon="mdi-calendar-clock" />
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
                placeholder="Nama karyawan, retail/outlet..."
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
            <i className="mdi mdi-plus"></i> Tambah Shift
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
            <i className="mdi mdi-calendar-remove" style={{ fontSize: "36px" }}></i>
            <p style={{ marginTop: "8px" }}>Tidak ada data shift.</p>
          </div>
        ) : (
          <DataTable
            keyField="id"
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

const Shift = () => {
  const [Shifts, setShifts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [retails, setRetails] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectedRetail, setSelectedRetail] = useState(null);
  const [newShift, setNewShift] = useState({
    start_date: "",
    end_date: "",
    user_id: "",
    retail_id: "",
    uses_jadwal_harian: 0,
  });
  const [filterText, setFilterText] = useState({
    start_date: "",
    end_date: "",
    name: "",
    retail_name: "",

  });
  // UI baru (toggle dalam halaman). Default "baru", persist ke localStorage.
  const [uiMode, setUiMode] = useState(
    () => localStorage.getItem("shift_ui_mode") || "baru"
  );
  const [globalSearch, setGlobalSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("semua"); // semua|aktif|berakhir|jadwal|reguler

  useEffect(() => {
    localStorage.setItem("shift_ui_mode", uiMode);
  }, [uiMode]);

  const inputRefs = useRef({});
    const [activeInput, setActiveInput] = useState(null);

    const formatShiftData = (data) => {
      if (!Array.isArray(data)) {
        if (typeof data === "object" && data !== null) {
          data = [data]; // Ubah objek menjadi array tunggal
        } else {
          return []; // Return array kosong jika bukan array atau objek
        }
      }
  
      return data.map((item) => {
        return {
          id: item.shifting_id,
          start_date: item.start_date || "",
          end_date: item.end_date || "",
          retail_name: item.retail_name || "unknown",
          retail_id : item.retail_id || 0,
          uses_jadwal_harian: item.uses_jadwal_harian || 0,
          name: item.detail_user
            ? item.detail_user.map((group) => `${group.name}`).join(", ")
            : "-",
          employes_id: item.detail_user
            ? item.detail_user.map((group) => `${group.user_id}`).join(", ")
            : "-",
        };
      });
    };

  

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
  
      try {
        // Fetch Shifts
        const shiftResponse = await axios.get(`${VITE_API_URL}/shift-management`, { headers });
       
        const formattedData = formatShiftData(shiftResponse.data.data);
        setShifts(formattedData);
  
       
  
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
   }, []);


  useEffect(() => {
    const fetchSelect = async () => {
      try{
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const retailResponse = await axios.get(`${VITE_API_URL}/retail`, { headers });
        const retailOptions = retailResponse.data.data.map((retail) => ({
          value: retail.retail_id,
          label: retail.name,
        }));
        setRetails(retailOptions);
  
        // Sync initial retail if exists
        if (selectedShift.retail_id) {
          const initialRetail = retailOptions.find(
            (retail) => retail.value === selectedShift.retail_id
          );
          setSelectedRetail(initialRetail || null);
        }

         // Fetch Users
         const userResponse = await axios.get(`${VITE_API_URL}/users`, { headers });
         const userOptions = userResponse.data.data.map((user) => ({
           value: user.user_id,
           label: `${user.name}`,
         }));
         setUsers(userOptions);
   
         
         if (selectedShift?.employes_id) {
           const groupIds = selectedShift.employes_id
             .split(", ")
             .map((user_id) => Number(user_id.trim())); // Konversi ke number
           
         
           const initialGroups = userOptions.filter((group) =>
             groupIds.includes(group.value)
           );
         
           setSelectedUser(initialGroups);
         }


      }catch(error){
        console.error("Failed to fetch group:", error);
      }

    };
    fetchSelect();
  },[selectedShift?.employes_id, selectedShift.retail_id]);

  const handleChange = (selected) => {
    setSelectedUser(selected || []);
  };

  // const filteredShift = Shifts.filter(
  //   (item) =>
  //     item.name?.toLowerCase().includes(search.toLowerCase()) ||
  //     item.retail_name?.toLowerCase().includes(search.toLowerCase())
  // );
  
  const filteredShift = Shifts.filter((item) =>
    Object.keys(filterText).every((key) => {
      const itemValue = String(item[key])?.toLowerCase(); // Pastikan item selalu jadi string kecil
      const filterValue = filterText[key].toLowerCase(); // Pastikan filter input menjadi huruf kecil

      // Pastikan bahwa itemValue mengandung filterValue
      return itemValue.includes(filterValue);
    })
  );

  // Shift aktif = end_date >= hari ini (inklusif). Berakhir = end_date lampau.
  const isShiftAktif = (row) => {
    if (!row.end_date) return true;
    const end = new Date(row.end_date);
    if (Number.isNaN(end.getTime())) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return end >= today;
  };
  const usesJadwal = (row) =>
    row.uses_jadwal_harian === 1 || row.uses_jadwal_harian === "1";

  // Baris UI BARU: search global (nama+retail) + quick filter chip.
  const displayedRows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return Shifts.filter((row) => {
      if (q) {
        const hay = [row.name, row.retail_name]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      switch (quickFilter) {
        case "aktif":
          return isShiftAktif(row);
        case "berakhir":
          return !isShiftAktif(row);
        case "jadwal":
          return usesJadwal(row);
        case "reguler":
          return !usesJadwal(row);
        default:
          return true;
      }
    });
  }, [Shifts, globalSearch, quickFilter]);

  const stats = useMemo(() => {
    return {
      total: displayedRows.length,
      aktif: displayedRows.filter((r) => isShiftAktif(r)).length,
      berakhir: displayedRows.filter((r) => !isShiftAktif(r)).length,
      jadwal: displayedRows.filter((r) => usesJadwal(r)).length,
    };
  }, [displayedRows]);

  const handleAddShift = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      let employes_shift = [];
      if (selectedUser?.length > 0) {
        employes_shift = selectedUser.map((user) => ({
          user_id: user.value,
        }));
      }

      const payload = {
        ...newShift,
        created_by: userId,
        created_at: DateNow,
        employes_shift,
      };

      const response = await axios.post(
        `${VITE_API_URL}/shift-management/create`,
         payload,
        { headers }
      );
  
      // Ambil data baru dari respons API
      const addedShift = response.data.data;
  
      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setShifts((prev) => [
        
        {
          ...addedShift,
          name: Array.isArray(selectedUser) 
          ? selectedUser.map((g) => g.label).join(", ") 
          : "Semua Karyawan",
          retail_name: retails.find((r) => r.value == addedShift.retail_id)?.label || "", // Nama retail
        },...prev,
      ]);
  
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalVisible(false);
  
      // Reset form tambah
      setNewShift({
        start_date: "",
        end_date: "",
        user_id: "",
        retail_id: "",
        uses_jadwal_harian: 0,
      });
      setSelectedUser(null);
      setSelectedRetail(null);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  

  const handleUpdate = (row) => {
    
    setSelectedShift(row);
    setModalVisible(true);
  };


  const handleInputChange = (field, value) => {
    setFilterText((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  

  const handleRetailChange = (selectedOption) => {
    setSelectedRetail(selectedOption);
    setSelectedShift({
      ...selectedShift,
      retail_id: selectedOption ? parseInt(selectedOption.value, 10) : null, // Konversi ke integer
    });
  };

  

  const handleDelete = async (row) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete: ${row.name}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;
          const headers = { Authorization: `Bearer ${token}` };
          await axios.post(
            `${VITE_API_URL}/shift-management/delete/${row.id}`,
            {
              deleted_by: userId,
              deleted_at: DateNow,
            },
            { headers }
          );
          Swal.fire("Deleted!", "Shift has been deleted.", "success");
          setShifts((prev) =>
            prev.filter((item) => item.id !== row.id)
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

  const handleSaveUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      let employes_shift = [];
      if (selectedUser?.length > 0) {
        employes_shift = selectedUser.map((group) => ({
          user_id: group.value,
        }));
      }

      const payload = {
        start_date: selectedShift.start_date,
        end_date: selectedShift.end_date,
        retail_id: selectedShift.retail_id,
        uses_jadwal_harian: selectedShift.uses_jadwal_harian ? 1 : 0,
        employes_shift,
        updated_by: userId,
        updated_at: DateNow,
      };
  
      const responseUpdate = await axios.post(
        `${VITE_API_URL}/shift-management/update/${selectedShift.id}`,
        payload,
        { headers }
      );
  
     
  
      // Perbarui state Shifts
      setShifts((prevShifts) =>
        prevShifts.map((item) =>
          item.id === selectedShift.id
            ? {
                ...selectedShift,
                name: Array.isArray(selectedUser)&& selectedUser.length > 0
                ? selectedUser.map((g) => g.label).join(", ")
                : "Semua Karyawan",
                retail_name: retails.find((r) => r.value == selectedShift.retail_id)?.label || "",
              }
            : item
        )
      );
    Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
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
      name: (
        <span style={{ marginBottom: "45px" }}>#</span>
      ),
      cell: (row, index) => <span>{index + 1}</span>,
      width: "50px",
    },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Start Date</span>
          <input
            type="text"
            value={filterText.start_date}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.start_date = el)}
            onChange={(e) => handleInputChange("start_date", e.target.value)}
            onFocus={() => setActiveInput('start_date')} // Set active input
          />
        </div>
      ),
      selector: (row) => format(new Date(row.start_date), "yyyy-MM-dd"), // Format start_date using date-fns
    },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>End Date</span>
          <input
            type="text"
            value={filterText.end_date}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.end_date = el)}
            onChange={(e) => handleInputChange("end_date", e.target.value)}
            onFocus={() => setActiveInput('end_date')} // Set active input
          />
        </div>
      ),
      selector: (row) => format(new Date(row.end_date), "yyyy-MM-dd"),
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Nama Karyawan</span>
          <input
            type="text"
            value={filterText.name}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.name = el)}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onFocus={() => setActiveInput('name')} // Set active input
          />
        </div>
      ), 
      cell: (row) => {
        // Format teks tooltip: setiap 2 kata setelah koma, masuk ke baris baru
        const formattedText = row.name
          .split(",")
          .map((item, index) => (index % 2 === 1 ? item + "\n" : item)) // Tambah newline
          .join(" |");

        return (
          <div>
            <span data-tooltip-id={`tooltip-${row.name}`}>
              {row.name.length > 30
                ? row.name.substring(0, 25) + "..."
                : row.name}
            </span>
            <Tooltip
              id={`tooltip-${row.name}`}
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
      },
      selector: (row) => row.name },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Nama Outlet/Retail</span>
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
      selector: (row) => row.retail_name },
    {
      name: (
        <span style={{ marginBottom: "45px" }}>Action</span>
      ),
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

  // Badge pill untuk UI baru.
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

  const fmtDate = (v) => {
    if (!v) return "-";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "-" : format(d, "dd MMM yyyy");
  };

  // Kolom UI BARU: sortable, badge, aksi ikon. Retail paling kiri.
  const columnsV2 = [
    {
      name: "Retail/Outlet",
      sortable: true,
      selector: (row) => row.retail_name || "",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
          <span
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "#e3f2fd",
              color: "#1976d2",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            <i className="mdi mdi-store"></i>
          </span>
          <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "13px" }}>
            {row.retail_name || "-"}
          </span>
        </div>
      ),
      grow: 1.6,
    },
    {
      name: "Karyawan",
      sortable: true,
      selector: (row) => row.name || "",
      cell: (row) => {
        const text = String(row.name || "-");
        const isAll = text === "-" || text.toLowerCase().includes("semua");
        return (
          <div style={{ padding: "4px 0", maxWidth: "260px" }}>
            <span
              data-tooltip-id={`shift-tip-${row.id}`}
              style={{ fontWeight: 600, color: "#2c3e50", fontSize: "13px" }}
            >
              {isAll
                ? "Semua Karyawan"
                : text.length > 40
                  ? text.substring(0, 37) + "..."
                  : text}
            </span>
            {!isAll && text.length > 40 && (
              <Tooltip
                id={`shift-tip-${row.id}`}
                place="top"
                effect="solid"
                style={{
                  backgroundColor: "#FAD9CF",
                  color: "black",
                  borderRadius: "8px",
                  padding: "8px",
                  whiteSpace: "pre-line",
                  zIndex: 9999,
                  maxWidth: "280px",
                }}
              >
                {text.split(",").join("\n")}
              </Tooltip>
            )}
          </div>
        );
      },
      grow: 2.2,
    },
    {
      name: "Periode",
      sortable: true,
      selector: (row) => (row.start_date ? new Date(row.start_date).getTime() : 0),
      cell: (row) => (
        <span style={{ fontSize: "12px", color: "#455a64" }}>
          {fmtDate(row.start_date)} <span style={{ color: "#b0bec5" }}>&rarr;</span> {fmtDate(row.end_date)}
        </span>
      ),
      grow: 1.8,
    },
    {
      name: "Tipe",
      sortable: true,
      selector: (row) => (usesJadwal(row) ? 1 : 0),
      cell: (row) =>
        usesJadwal(row)
          ? pill("#f3e5f5", "#8e24aa", "Jadwal Harian")
          : pill("#eceff1", "#607d8b", "Reguler"),
      width: "130px",
    },
    {
      name: "Status",
      sortable: true,
      selector: (row) => (isShiftAktif(row) ? 0 : 1),
      cell: (row) =>
        isShiftAktif(row)
          ? pill("#e8f5e9", "#2e7d32", "Aktif")
          : pill("#ffebee", "#c62828", "Berakhir"),
      width: "100px",
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {iconBtn("#fb8c00", "Update shift", () => handleUpdate(row), "mdi-pencil")}
          {iconBtn("#c62828", "Hapus shift", () => handleDelete(row), "mdi-delete")}
        </div>
      ),
      width: "110px",
    },
  ];

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

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
        <h3 className="page-title" style={{ margin: 0 }}>Data Shifts</h3>
        {uiToggle}
      </div>

      {uiMode === "baru" ? (
        <ShiftBaru
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
              <h4 className="card-title">Table Shift</h4>
              <div className="">
                {loading ? (
                  <p>Loading data...</p>
                ) : error ? (
                  <p className="text-danger">Error: {error}</p>
                ) : (
                  <>
                    <div className="row">
                      <div className="col-sm-9">
                        <button
                          className="btn btn-gradient-primary btn-sm"
                          onClick={() => setAddModalVisible(true)}
                          style={{marginBottom:"20px"}}
                        >
                          Tambah Shift
                        </button>
                      </div>
                      <div className="col-sm-3">

                      </div>
                    </div>

                    {filteredShift && filteredShift.length > 0 ? (
                      <DataTable
                        keyField="shifting_id"
                        columns={columns}
                        data={filteredShift}
                        customStyles={{
                          rows: {
                            style: {
                              animation: "fadeIn 0.5s ease-in-out",
                            },
                          },
                        }}
                        pagination
                      />
                    ) :(
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
                          {filteredShift.length > 0 ? (
                            filteredShift.map((row, index) => (
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

      {/* Modal Tambah User */}
      <Modal show={addModalVisible} onHide={() => setAddModalVisible(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Tambah Data Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>Start Date</label>
            <input
              //   type="datetime-local"
              type="date"
              className="form-control"
              value={newShift.start_date}
              onChange={(e) =>
                setNewShift({ ...newShift, start_date: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={newShift.end_date}
              onChange={(e) =>
                setNewShift({ ...newShift, end_date: e.target.value })
              }
            />
          </div>
         
          <div className="form-group">
            <label>Nama Retail</label>
            <Select
              options={retails}
              value={
                newShift.retail_id
                  ? {
                      value: newShift.retail_id,
                      label: retails.find((r) => r.value === newShift.retail_id)
                        ?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedRetail(option);
                setNewShift({
                  ...newShift,
                  retail_id: option ? option.value : "",
                });
              }}
              placeholder="Pilih Retail..."
              isClearable
            />
          </div>
          <div className="form-group">
            <label>Pakai Jadwal Harian?</label>
            <select
              className="form-select"
              value={newShift.uses_jadwal_harian}
              onChange={(e) =>
                setNewShift({ ...newShift, uses_jadwal_harian: e.target.value === "1" ? 1 : 0 })
              }
            >
              <option value="1">Ya</option>
              <option value="0">Tidak</option>
            </select>
          </div>
          <div className="form-group">
            <label>Nama Karyawan (
                <span className="text-secondary text-small">
                  Kosongkan karyawan jika tujuan nya untuk Semua Karyawan
                </span>
                )</label>
            <Select
                options={users}
                isMulti
                value={selectedUser}
                onChange={handleChange}
                placeholder="Pilih Karyawan..."
                isClearable
              />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="btn btn-light"
            onClick={() => setAddModalVisible(false)}
          >
            Close
          </Button>
          <Button
            className="btn btn-gradient-primary me-2"
            onClick={handleAddShift}
          >
            Tambah Shift
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #eceff1" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: 700, color: "#263238" }}>
            <i className="mdi mdi-calendar-edit" style={{ color: "#fb8c00", marginRight: "8px" }}></i>
            Update Shift
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f7f9fb", padding: "20px" }}>
          {/* Ringkasan retail + status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              background: "#fff",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "16px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#e3f2fd",
                  color: "#1976d2",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                <i className="mdi mdi-store"></i>
              </span>
              <div>
                <div style={{ fontWeight: 700, color: "#263238", fontSize: "14px" }}>
                  {selectedShift.retail_name || "Retail belum dipilih"}
                </div>
                <div style={{ fontSize: "12px", color: "#90a4ae" }}>
                  {Array.isArray(selectedUser) && selectedUser.length > 0
                    ? `${selectedUser.length} karyawan`
                    : "Semua karyawan"}
                </div>
              </div>
            </div>
            {isShiftAktif(selectedShift)
              ? pill("#e8f5e9", "#2e7d32", "Aktif")
              : pill("#ffebee", "#c62828", "Berakhir")}
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {/* Periode */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-calendar-start" style={{ marginRight: "4px" }}></i>Tanggal Mulai
                </label>
                <input
                  type="date"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  value={selectedShift.start_date ? format(new Date(selectedShift.start_date), "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    setSelectedShift({ ...selectedShift, start_date: e.target.value })
                  }
                />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-calendar-end" style={{ marginRight: "4px" }}></i>Tanggal Selesai
                </label>
                <input
                  className="form-control"
                  type="date"
                  style={{ borderRadius: "10px" }}
                  value={selectedShift.end_date ? format(new Date(selectedShift.end_date), "yyyy-MM-dd") : ""}
                  onChange={(e) =>
                    setSelectedShift({ ...selectedShift, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Retail */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-store-outline" style={{ marginRight: "4px" }}></i>Retail / Outlet
              </label>
              <Select
                options={retails}
                value={retails.find((r) => r.value === parseInt(selectedShift.retail_id, 10)) || null}
                onChange={handleRetailChange}
                placeholder="Pilih retail..."
                isClearable
                menuPosition="fixed"
              />
            </div>

            {/* Tipe jadwal harian */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "6px", display: "block" }}>
                <i className="mdi mdi-calendar-clock" style={{ marginRight: "4px" }}></i>Tipe Shift
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { val: 0, label: "Reguler", desc: "Shift tetap" },
                  { val: 1, label: "Jadwal Harian", desc: "Sales Toko / Trainee" },
                ].map((opt) => {
                  const active = (selectedShift.uses_jadwal_harian ? 1 : 0) === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() =>
                        setSelectedShift({ ...selectedShift, uses_jadwal_harian: opt.val })
                      }
                      style={{
                        flex: 1,
                        textAlign: "left",
                        border: "1.5px solid",
                        borderColor: active ? "#8e24aa" : "#e0e0e0",
                        background: active ? "#f3e5f5" : "#fff",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "13px", color: active ? "#8e24aa" : "#546e7a" }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "#90a4ae" }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Karyawan */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-account-multiple" style={{ marginRight: "4px" }}></i>Nama Karyawan
              </label>
              <Select
                options={users}
                isMulti
                value={selectedUser}
                onChange={(selected) => setSelectedUser(selected)}
                placeholder="Pilih Karyawan..."
                isClearable
                menuPosition="fixed"
              />
              <small style={{ color: "#b0bec5", fontSize: "11px" }}>
                Kosongkan untuk berlaku ke <b>Semua Karyawan</b>.
              </small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #eceff1" }}>
          <Button className="btn btn-light" onClick={() => setModalVisible(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSaveUpdate}
            style={{ background: "#2471a3", border: "none", fontWeight: 600 }}
          >
            <i className="mdi mdi-content-save" style={{ marginRight: "5px" }}></i>
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Shift;
