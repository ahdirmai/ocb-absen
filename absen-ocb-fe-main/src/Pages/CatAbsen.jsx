/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useMemo } from "react";
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

const KatTime = [
  { value: "pagi", label: "Pagi" },
  { value: "sore", label: "Sore" },
  { value: "malam", label: "Malam" },
];

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

const CatAbsenBaru = ({
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
    { key: "pagi", label: "Pagi" },
    { key: "sore", label: "Sore" },
    { key: "malam", label: "Malam" },
    { key: "cross", label: "Lintas Hari" },
    { key: "unpaired", label: "Tanpa Pasangan" },
  ];

  return (
    <div style={{ padding: "4px 2px" }}>
      {/* Stat ringkasan */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <StatCard label="Total Tipe" value={stats.total} color="#455a64" icon="mdi-tag-multiple" />
        <StatCard label="Pasangan Shift" value={stats.pairs} color="#2e7d32" icon="mdi-swap-horizontal" />
        <StatCard label="Tanpa Pasangan" value={stats.unpaired} color="#c62828" icon="mdi-link-off" />
        <StatCard label="Lintas Hari" value={stats.cross} color="#8e24aa" icon="mdi-calendar-arrow-right" />
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
                placeholder="Code, deskripsi, kategori, grup..."
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
            <i className="mdi mdi-plus"></i> Tambah Tipe Absen
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
            <i className="mdi mdi-tag-off" style={{ fontSize: "36px" }}></i>
            <p style={{ marginTop: "8px" }}>Tidak ada tipe absen.</p>
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

const CatAbsen = () => {
  const [catabsen, setcatabsen] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [selectedCatabsen, setSelectedCatabsen] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [newCatabsen, setnewCatabsen] = useState({
    name: "",
    description: "",
    fee: "",
    group_absen: "",
    retail_id: "",
    start_time: "",
    end_time: "",
    kategori_absen: "",
    is_cross_date: 0,
  });

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [filterText, setFilterText] = useState({
    name: "",
    description: "",
    fee: "",
    group_absen: "",
    retail_name: "",
    kategori_absen: "",
  });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);
  const [selectedKatTime, setSelectedKatTime] = useState(null);

  // UI baru (toggle dalam halaman). Default "baru", persist ke localStorage.
  const [uiMode, setUiMode] = useState(
    () => localStorage.getItem("typeabsen_ui_mode") || "baru"
  );
  const [globalSearch, setGlobalSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("semua"); // semua|pagi|sore|malam|cross

  useEffect(() => {
    localStorage.setItem("typeabsen_ui_mode", uiMode);
  }, [uiMode]);

  const formatAbsenData = (data) => {
    if (!Array.isArray(data)) {
      if (typeof data === "object" && data !== null) {
        data = [data]; // Ubah objek menjadi array tunggal
      } else {
        return []; // Return array kosong jika bukan array atau objek
      }
    }

    return data.map((item) => {
      return {
        id: item.absen_id,
        name: item.name || "Unknown",
        description: item.description || "No description",
        fee: item.fee || 0,
        start_time: item.start_time || "-",
        end_time: item.end_time || "-",
        kategori_absen: item.kategori_absen || "-",
        is_cross_date: Number(item.is_cross_date) === 1 ? 1 : 0,
        category_user: item.groups
          ? item.groups.map((group) => `${group.category_user}`).join(", ")
          : "-",
        group_absen: item.groups
          ? item.groups.map((group) => `${group.id_category}`).join(", ")
          : "-",
      };
    });
  };

  useEffect(() => {
    const fetchcatabsen = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const response = await axios.get(`${VITE_API_URL}/absen-management`, {
          headers,
        });

        const formattedData = formatAbsenData(response.data.data);

        setcatabsen(formattedData);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchcatabsen();
  }, []);

  const filteredCatabsen = catabsen.filter((item) =>
    Object.keys(filterText).every((key) => {
      const itemValue = String(item[key])?.toLowerCase(); // Pastikan item selalu jadi string kecil
      const filterValue = filterText[key].toLowerCase(); // Pastikan filter input menjadi huruf kecil

      // Pastikan bahwa itemValue mengandung filterValue
      return itemValue.includes(filterValue);
    })
  );

  const isCross = (row) => Number(row.is_cross_date) === 1;

  // Normalisasi nama untuk pairing: lowercase, rapatkan spasi, buang trailing.
  // Jaga "Designer " == "Designer", "BM - U4" == "BM -U4".
  const normName = (name) =>
    String(name || "").toLowerCase().replace(/\s+/g, " ").trim();

  // Arah absen dari description (selaras BE absenDirectionOf).
  const dirOf = (row) => {
    const d = String(row.description || "").toLowerCase();
    if (d.includes("keluar") || d.includes("pulang")) return "keluar";
    if (d.includes("masuk")) return "masuk";
    return "";
  };

  // Peta pasangan by nama ternormalisasi: { key: {masuk, keluar} }.
  // Dipakai untuk badge Arah + tandai tipe tanpa pasangan (pairing sesi gagal).
  const pairMap = useMemo(() => {
    const map = {};
    catabsen.forEach((row) => {
      const key = normName(row.name);
      if (!map[key]) map[key] = { masuk: 0, keluar: 0 };
      const dir = dirOf(row);
      if (dir === "masuk") map[key].masuk += 1;
      else if (dir === "keluar") map[key].keluar += 1;
    });
    return map;
  }, [catabsen]);

  // Baris UI BARU: 1 baris per shift (nama), gabung masuk+keluar.
  // Search global (multi-field) + quick filter chip, diurut by nama.
  const mergedRows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    const groups = {};
    catabsen.forEach((row) => {
      const key = normName(row.name);
      if (!groups[key]) {
        groups[key] = { key, id: key, name: row.name, masuk: null, keluar: null };
      }
      const dir = dirOf(row);
      if (dir === "masuk") {
        if (!groups[key].masuk) groups[key].masuk = row;
        groups[key].name = row.name; // prefer nama dari baris masuk
      } else if (dir === "keluar") {
        if (!groups[key].keluar) groups[key].keluar = row;
        if (!groups[key].masuk) groups[key].name = row.name;
      }
    });

    let list = Object.values(groups).map((g) => {
      const ref = g.masuk || g.keluar;
      return {
        ...g,
        kategori_absen: ref?.kategori_absen || "-",
        fee: ref?.fee || 0,
        category_user: ref?.category_user || "-",
        is_cross_date: g.masuk?.is_cross_date || g.keluar?.is_cross_date || 0,
      };
    });

    list = list.filter((g) => {
      if (q) {
        const hay = [
          g.name,
          g.masuk?.description,
          g.keluar?.description,
          g.kategori_absen,
          g.category_user,
        ]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        if (!hay.includes(q)) return false;
      }
      const kat = String(g.kategori_absen || "").toLowerCase();
      switch (quickFilter) {
        case "pagi":
          return kat.includes("pagi");
        case "sore":
          return kat.includes("sore");
        case "malam":
          return kat.includes("malam");
        case "cross":
          return isCross(g);
        case "unpaired":
          return !g.masuk || !g.keluar;
        default:
          return true;
      }
    });

    return list.sort((a, b) => a.key.localeCompare(b.key));
  }, [catabsen, globalSearch, quickFilter]);

  const stats = useMemo(() => {
    const pairs = Object.values(pairMap).filter(
      (p) => p.masuk > 0 && p.keluar > 0
    ).length;
    return {
      total: mergedRows.length,
      cross: mergedRows.filter((r) => isCross(r)).length,
      pairs,
      unpaired: mergedRows.filter((r) => !r.masuk || !r.keluar).length,
    };
  }, [mergedRows, pairMap]);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const response = await axios.get(
          `${VITE_API_URL}/users/category-alluser`,
          {
            headers,
          }
        );

        const groupOptions = response.data.data.map((group) => ({
          value: group.id_category,
          label: group.category_user,
        }));

        setGroups(groupOptions);

        // Update selected group jika ada group_absen di selectedCatabsen
        if (selectedCatabsen?.group_absen) {
          const groupIds = selectedCatabsen.group_absen
            .split(", ")
            .map((id_category) => Number(id_category.trim())); // Konversi ke number

          const initialGroups = groupOptions.filter((group) =>
            groupIds.includes(group.value)
          );

          setSelectedGroup(initialGroups);
        }

        if (selectedCatabsen?.kategori_absen) {
          const initialKatTime = KatTime.find(
            (katTime) => katTime.value === selectedCatabsen.kategori_absen
          );
          setSelectedKatTime(initialKatTime|| null);
        }
      } catch (error) {
        console.error("Failed to fetch group:", error);
      }
    };

    fetchGroup();
  }, [selectedCatabsen?.group_absen, selectedCatabsen?.kategori_absen]);

  const handleAddCatAbsen = async () => {
    if (addLoading) {
      return;
    }

    // Validasi pra-submit: field wajib.
    const name = String(newCatabsen.name || "").trim();
    const description = String(newCatabsen.description || "").trim();
    const feeRaw = String(newCatabsen.fee ?? "").trim();

    if (!name || !description || feeRaw === "") {
      Swal.fire("Validasi", "Nama, deskripsi, dan fee wajib diisi.", "warning");
      return;
    }

    if (name.length < 2) {
      Swal.fire("Validasi", "Nama tipe absen minimal 2 karakter.", "warning");
      return;
    }

    if (Number.isNaN(Number(feeRaw)) || Number(feeRaw) < 0) {
      Swal.fire("Validasi", "Fee harus berupa angka >= 0.", "warning");
      return;
    }

    setAddLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      // Siapkan data untuk dikirim ke backend
      let group_details = [];
      if (selectedGroup?.length > 0) {
        group_details = selectedGroup.map((group) => ({
          id_category: group.value,
        }));
      }

      const payload = {
        ...newCatabsen,
        created_by: userId,
        created_at: DateNow,
        kategori_absen: selectedKatTime?.value || null,
        is_cross_date: newCatabsen.is_cross_date ? 1 : 0,
        group_details,
      };

      // Kirim request untuk menyimpan data tipe absen dan group absen
      const response = await axios.post(
        `${VITE_API_URL}/absen-management/create`,
        payload,
        { headers }
      );

      // Ambil data baru dari respons API
      const addedAbsen = response.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setcatabsen((prev) => [
        {
          ...addedAbsen,
          category_user: Array.isArray(selectedGroup)
            ? selectedGroup.map((g) => g.label).join(", ")
            : "Semua Group", // Set default jika selectedGroup null atau bukan array
          kategori_absen: selectedKatTime?.label || "-", // Menampilkan shift di tabel
        },

        ...prev,
      ]);

      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalVisible(false);
      setnewCatabsen({
        name: "",
        description: "",
        fee: "",
        start_time: "",
        end_time: "",
        group_absen: "",
        is_cross_date: 0,
      });
      setSelectedGroup([]);
      setSelectedKatTime(null);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdate = (row) => {
    setSelectedCatabsen(row);
    setModalVisible(true);
  };

  const handleInputChange = (field, value) => {
    setFilterText((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          const userProfile = sessionStorage.getItem("userProfile");
          const userData = JSON.parse(userProfile); // Parse JSON
          const userId = userData[0]?.user_id;

          const headers = { Authorization: `Bearer ${token}` };
          const responseDelete = await axios.post(
            `${VITE_API_URL}/absen-management/delete/${row.id}`,
            {
              deleted_by: userId,
              deleted_at: DateNow,
            },
            { headers }
          );
          Swal.fire("Deleted!", `${responseDelete.data.message}`, "success");
          setcatabsen((prev) => prev.filter((item) => item.id !== row.id));
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

  const handleChange = (selected) => {
    setSelectedGroup(selected || []);
  };

  const handleSaveUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      // Siapkan group_details untuk dikirim ke backend
      let group_details = [];
      if (selectedGroup?.length > 0) {
        group_details = selectedGroup.map((group) => ({
          id_category: group.value,
        }));
      }

      // Payload untuk request update
      const payload = {
        name: selectedCatabsen.name,
        description: selectedCatabsen.description,
        fee: selectedCatabsen.fee,
        retail_id: selectedCatabsen.retail_id,
        start_time: selectedCatabsen.start_time,
        end_time: selectedCatabsen.end_time,
        kategori_absen: selectedKatTime?.value || null,
        is_cross_date: selectedCatabsen.is_cross_date ? 1 : 0,
        group_details,
        updated_by: userId,
        updated_at: DateNow,
      };

      const responseUpdate = await axios.post(
        `${VITE_API_URL}/absen-management/update/${selectedCatabsen.id}`,
        payload,
        { headers }
      );

      // Perbarui state catabsen dengan data yang diperbarui
      setcatabsen((prevAbsen) =>
        prevAbsen.map((item) =>
          item.id === selectedCatabsen.id
            ? {
                ...selectedCatabsen,
                kategori_absen: selectedKatTime?.label || "-",
                category_user:
                  Array.isArray(selectedGroup) && selectedGroup.length > 0
                    ? selectedGroup.map((g) => g.label).join(", ")
                    : "Semua Group",
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
      name: "#",
      cell: (row, index) => <span>{index + 1}</span>,
      width: "50px",
    },
    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>Code Absen</span>
          <input
            type="text"
            value={filterText.name}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.name = el)}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onFocus={() => setActiveInput("name")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.name,
    },

    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>Deskripsi</span>
          <input
            type="text"
            value={filterText.description}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.description = el)}
            onChange={(e) => handleInputChange("description", e.target.value)}
            onFocus={() => setActiveInput("description")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.description,
    },
    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>Fee</span>
          <input
            type="text"
            value={filterText.fee}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.fee = el)}
            onChange={(e) => handleInputChange("fee", e.target.value)}
            onFocus={() => setActiveInput("fee")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.fee,
    },

    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>Start Time</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            disabled
          />
        </div>
      ),
      selector: (row) => row.start_time,
    },
    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>End Time</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            disabled
          />
        </div>
      ),
      selector: (row) => row.end_time,
    },
    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>Kategori Waktu</span>
          <input
            type="text"
            value={filterText.kategori_absen}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.kategori_absen = el)}
            onChange={(e) =>
              handleInputChange("kategori_absen", e.target.value)
            }
            onFocus={() => setActiveInput("kategori_absen")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.kategori_absen,
    },
    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>Group Absen</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.category_user = el)}
            onChange={(e) => handleInputChange("category_user", e.target.value)}
            onFocus={() => setActiveInput("category_user")} // Set active input
          />
        </div>
      ),
      cell: (row) => {
        // Format teks tooltip: setiap 2 kata setelah koma, masuk ke baris baru
        const formattedText = row.category_user
          .split(",")
          .map((item, index) => (index % 2 === 1 ? item + "\n" : item)) // Tambah newline
          .join(" |");

        return (
          <div>
            <span data-tooltip-id={`tooltip-${row.category_user}`}>
              {row.category_user.length > 30
                ? row.category_user.substring(0, 20) + "..."
                : row.category_user}
            </span>
            <Tooltip
              id={`tooltip-${row.category_user}`}
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
      selector: (row) => row.category_user,
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
    },
  ];

  // Badge pill + tombol ikon untuk UI baru.
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
  const katColor = (kat) => {
    const k = String(kat || "").toLowerCase();
    if (k.includes("pagi")) return { bg: "#e8f5e9", text: "#2e7d32" };
    if (k.includes("sore")) return { bg: "#fff3e0", text: "#e65100" };
    if (k.includes("malam")) return { bg: "#ede7f6", text: "#5e35b1" };
    return { bg: "#eceff1", text: "#607d8b" };
  };

  // Sel arah (masuk/keluar) di baris gabungan: jam + aksi mini.
  const dirCell = (item, dirLabel, tone) => {
    if (!item) {
      return (
        <span style={{ fontSize: "11px", color: "#cfd8dc", fontStyle: "italic" }}>
          <i className="mdi mdi-link-off" style={{ marginRight: "3px", color: "#e57373" }}></i>
          belum ada
        </span>
      );
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 0" }}>
        <span
          style={{
            fontSize: "12px",
            color: "#37474f",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {item.start_time || "-"}
        </span>
        <span style={{ display: "inline-flex", gap: "2px" }}>
          <button
            onClick={() => handleUpdate(item)}
            title={`Edit ${dirLabel}`}
            style={{
              border: "none",
              background: tone,
              color: "#fff",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <i className="mdi mdi-pencil"></i>
          </button>
          <button
            onClick={() => handleDelete(item)}
            title={`Hapus ${dirLabel}`}
            style={{
              border: "none",
              background: "#eceff1",
              color: "#c62828",
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            <i className="mdi mdi-delete"></i>
          </button>
        </span>
      </div>
    );
  };

  // Kolom UI BARU: 1 baris per shift, masuk+keluar berdampingan.
  const columnsV2 = [
    {
      name: "Shift / Code",
      sortable: true,
      selector: (row) => row.key,
      cell: (row) => {
        const unpaired = !row.masuk || !row.keluar;
        return (
          <div style={{ padding: "4px 0" }}>
            <div style={{ fontWeight: 600, color: "#2c3e50", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>
              {row.name}
              {unpaired && (
                <i
                  className="mdi mdi-link-off"
                  title="Pasangan tidak lengkap (masuk/keluar). Pairing sesi bisa gagal."
                  style={{ color: "#c62828", fontSize: "14px" }}
                ></i>
              )}
            </div>
            {row.category_user && row.category_user !== "-" && (
              <div style={{ fontSize: "11px", color: "#90a4ae" }}>{row.category_user}</div>
            )}
          </div>
        );
      },
      grow: 2,
    },
    {
      name: "Masuk",
      cell: (row) => dirCell(row.masuk, "masuk", "#43a047"),
      width: "120px",
    },
    {
      name: "Keluar",
      cell: (row) => dirCell(row.keluar, "keluar", "#e53935"),
      width: "120px",
    },
    {
      name: "Kategori",
      sortable: true,
      selector: (row) => row.kategori_absen || "",
      cell: (row) => {
        const c = katColor(row.kategori_absen);
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            {row.kategori_absen && row.kategori_absen !== "-"
              ? pill(c.bg, c.text, row.kategori_absen)
              : <span style={{ color: "#b0bec5", fontSize: "12px" }}>-</span>}
            {isCross(row) && pill("#f3e5f5", "#8e24aa", "+1 hari")}
          </span>
        );
      },
      width: "150px",
    },
    {
      name: "Fee",
      sortable: true,
      selector: (row) => Number(row.fee) || 0,
      cell: (row) => (
        <span style={{ fontSize: "12px", color: "#455a64", fontWeight: 600 }}>
          {Number(row.fee || 0).toLocaleString("id-ID")}
        </span>
      ),
      width: "100px",
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
        <h3 className="page-title" style={{ margin: 0 }}>Data Tipe Absen</h3>
        {uiToggle}
      </div>

      {uiMode === "baru" ? (
        <CatAbsenBaru
          loading={loading}
          error={error}
          stats={stats}
          rows={mergedRows}
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
              <h4 className="card-title">Table Kategori Absen</h4>
              <div className="">
                {loading ? (
                  <p>Loading data...</p>
                ) : error ? (
                  <p className="text-danger">Error: {error}</p>
                ) : (
                  <>
                    <div className="row">
                      <div className="col-sm-8">
                        <button
                          className="btn btn-gradient-primary btn-sm"
                          onClick={() => setAddModalVisible(true)}
                          style={{ marginBottom: "20px" }}
                        >
                          Tambah Tipe Absen
                        </button>
                      </div>
                      <div className="col-sm-4">
                        <div className="input-group">
                          <div className="input-group-prepend bg-transparent"></div>
                        </div>
                      </div>
                    </div>

                    {filteredCatabsen && filteredCatabsen.length > 0 ? (
                      <DataTable
                        keyField="absen-id"
                        columns={columns}
                        data={filteredCatabsen}
                        pagination
                      />
                    ) : (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              {columns.map((col, index) => (
                                <th key={index} style={{ fontSize: "12px" }}>
                                  {col.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCatabsen.length > 0 ? (
                              filteredCatabsen.map((row, index) => (
                                <tr key={index}>
                                  {columns.map((col, colIndex) => (
                                    <td key={colIndex}>
                                      {col.cell
                                        ? col.cell(row)
                                        : col.selector(row)}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={columns.length}
                                  style={{ textAlign: "center" }}
                                >
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
      <Modal
        show={addModalVisible}
        onHide={() => setAddModalVisible(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Form Tambah Tipe Absen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group row">
            <div className="col">
              <label>Code Absen</label>
              <input
                type="text"
                className="form-control"
                value={newCatabsen.name}
                onChange={(e) =>
                  setnewCatabsen({ ...newCatabsen, name: e.target.value })
                }
              />
            </div>
            <div className="col">
              <label>Description</label>
              <input
                type="text"
                className="form-control"
                value={newCatabsen.description}
                onChange={(e) =>
                  setnewCatabsen({
                    ...newCatabsen,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="col">
              <label>Start Time</label>
              <input
                type="time"
                className="form-control"
                value={newCatabsen.start_time}
                onChange={(e) =>
                  setnewCatabsen({ ...newCatabsen, start_time: e.target.value })
                }
              />
            </div>
            <div className="col">
              <label>End Time</label>
              <input
                type="time"
                className="form-control"
                value={newCatabsen.end_time}
                onChange={(e) =>
                  setnewCatabsen({ ...newCatabsen, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group row">
            <div className="col-4">
              <label>fee</label>
              <input
                type="number"
                className="form-control"
                value={newCatabsen.fee}
                onChange={(e) =>
                  setnewCatabsen({ ...newCatabsen, fee: e.target.value })
                }
              />
            </div>
            <div className="col-8">
              <label>Kategori Time</label>
              <Select
                options={KatTime}
                value={selectedKatTime}
                onChange={(option) => setSelectedKatTime(option)}
                placeholder="Pilih Kategori Time..."
                isClearable
              />
            </div>
          </div>
          <div className="form-group row">
            <div className="col-12">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="add-is-cross-date"
                  checked={!!newCatabsen.is_cross_date}
                  onChange={(e) =>
                    setnewCatabsen({
                      ...newCatabsen,
                      is_cross_date: e.target.checked ? 1 : 0,
                    })
                  }
                />
                <label className="form-check-label" htmlFor="add-is-cross-date">
                  Absen Lintas Hari (keluar besok)?{" "}
                  <span className="text-secondary text-small">
                    Centang untuk shift yang masuk hari ini & keluar dini hari
                    besok (mis. SUBUH, SORE 9 JAM).
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <label>
              Group Absen (
              <span className="text-secondary text-small">
                Kosongkan group Absen jika tujuan nya untuk Semua Group
              </span>
              )
            </label>

            <Select
              options={groups}
              isMulti
              value={selectedGroup}
              onChange={handleChange}
              placeholder="Pilih Group Absen..."
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
            onClick={handleAddCatAbsen}
            disabled={addLoading}
          >
            {addLoading ? "Menyimpan..." : "Tambah Tipe Absen"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #eceff1" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: 700, color: "#263238" }}>
            <i className="mdi mdi-tag-edit" style={{ color: "#fb8c00", marginRight: "8px" }}></i>
            Edit Tipe Absen
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f7f9fb", padding: "20px" }}>
          {/* Ringkasan */}
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
                  background: "#fff3e0",
                  color: "#e65100",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                <i className="mdi mdi-tag"></i>
              </span>
              <div>
                <div style={{ fontWeight: 700, color: "#263238", fontSize: "14px" }}>
                  {selectedCatabsen.name || "Tipe absen"}
                </div>
                <div style={{ fontSize: "12px", color: "#90a4ae" }}>
                  {selectedCatabsen.description || "-"}
                </div>
              </div>
            </div>
            {selectedCatabsen.is_cross_date
              ? pill("#f3e5f5", "#8e24aa", "Lintas Hari")
              : pill("#eceff1", "#607d8b", "Same-day")}
          </div>

          <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {/* Code + Fee */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              <div style={{ flex: "2 1 200px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-barcode" style={{ marginRight: "4px" }}></i>Code Absen
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  value={selectedCatabsen.name || ""}
                  onChange={(e) =>
                    setSelectedCatabsen({ ...selectedCatabsen, name: e.target.value })
                  }
                />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-cash" style={{ marginRight: "4px" }}></i>Fee
                </label>
                <input
                  className="form-control"
                  type="number"
                  style={{ borderRadius: "10px" }}
                  value={selectedCatabsen.fee || ""}
                  onChange={(e) =>
                    setSelectedCatabsen({ ...selectedCatabsen, fee: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-text" style={{ marginRight: "4px" }}></i>Deskripsi
              </label>
              <input
                className="form-control"
                type="text"
                style={{ borderRadius: "10px" }}
                value={selectedCatabsen.description || ""}
                onChange={(e) =>
                  setSelectedCatabsen({ ...selectedCatabsen, description: e.target.value })
                }
              />
            </div>

            {/* Waktu */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-clock-start" style={{ marginRight: "4px" }}></i>Jam Mulai
                </label>
                <input
                  type="time"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  value={selectedCatabsen.start_time || ""}
                  onChange={(e) =>
                    setSelectedCatabsen({ ...selectedCatabsen, start_time: e.target.value })
                  }
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-clock-end" style={{ marginRight: "4px" }}></i>Jam Selesai
                </label>
                <input
                  type="time"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  value={selectedCatabsen.end_time || ""}
                  onChange={(e) =>
                    setSelectedCatabsen({ ...selectedCatabsen, end_time: e.target.value })
                  }
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                  <i className="mdi mdi-white-balance-sunny" style={{ marginRight: "4px" }}></i>Kategori Waktu
                </label>
                <Select
                  options={KatTime}
                  value={selectedKatTime}
                  onChange={(selected) => setSelectedKatTime(selected)}
                  placeholder="Pilih..."
                  isClearable
                  menuPosition="fixed"
                />
              </div>
            </div>

            {/* Cross-date toggle */}
            <div
              onClick={() =>
                setSelectedCatabsen({
                  ...selectedCatabsen,
                  is_cross_date: selectedCatabsen.is_cross_date ? 0 : 1,
                })
              }
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                border: "1.5px solid",
                borderColor: selectedCatabsen.is_cross_date ? "#8e24aa" : "#e0e0e0",
                background: selectedCatabsen.is_cross_date ? "#f3e5f5" : "#fff",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "16px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                className="form-check-input mt-0"
                style={{ marginTop: "2px" }}
                checked={!!selectedCatabsen.is_cross_date}
                onChange={() => {}}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: selectedCatabsen.is_cross_date ? "#8e24aa" : "#546e7a" }}>
                  Absen Lintas Hari (keluar besok)
                </div>
                <div style={{ fontSize: "11px", color: "#90a4ae" }}>
                  Untuk shift masuk hari ini & keluar dini hari besok (mis. SUBUH, SORE 9 JAM).
                </div>
              </div>
            </div>

            {/* Grup */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-account-group" style={{ marginRight: "4px" }}></i>Grup Absen
              </label>
              <Select
                options={groups}
                isMulti
                value={selectedGroup}
                onChange={(selected) => setSelectedGroup(selected)}
                placeholder="Pilih Grup Absen..."
                isClearable
                menuPosition="fixed"
              />
              <small style={{ color: "#b0bec5", fontSize: "11px" }}>
                Kosongkan untuk berlaku ke <b>Semua Grup</b>.
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

export default CatAbsen;
