/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";
import Select from "react-select";

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

const MenuCategoryBaru = ({
  loading,
  error,
  stats,
  rows,
  columns,
  globalSearch,
  setGlobalSearch,
  onAdd,
}) => {
  return (
    <div style={{ padding: "4px 2px" }}>
      {/* Stat ringkasan */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <StatCard label="Total Config" value={stats.total} color="#455a64" icon="mdi-cog" />
        <StatCard label="Kategori User" value={stats.kategori} color="#2471a3" icon="mdi-account-group" />
        <StatCard label="Menu Unik" value={stats.menu} color="#8e24aa" icon="mdi-menu" />
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
                placeholder="Kategori user, nama menu, parent..."
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
            <i className="mdi mdi-plus"></i> Tambah Config Menu
          </button>
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
            <i className="mdi mdi-cog-off" style={{ fontSize: "36px" }}></i>
            <p style={{ marginTop: "8px" }}>Tidak ada config menu.</p>
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
            defaultSortFieldId={1}
            defaultSortAsc
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

const MenuCategory = () => {
  const [MenuCategory, setMenuCategory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [newMenuCategory, setnewMenuCategory] = useState({
    user_id: "",
    menu_id: "",
    tanggal: "",
    reason: "",
  });
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [menus, setmenus] = useState([]);
  const [selectedmenus, setSelectedmenus] = useState(null);

  const [filterText, setFilterText] = useState({
    category_user: "",
    menu_name: "",
    parent_name: "",
    
    
  

  });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);

  // UI baru (toggle dalam halaman). Default "baru", persist ke localStorage.
  const [uiMode, setUiMode] = useState(
    () => localStorage.getItem("menucategory_ui_mode") || "baru"
  );
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("menucategory_ui_mode", uiMode);
  }, [uiMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
  
      try {
        // Fetch Off Day
        const MenuCategoryResponse = await axios.get(`${VITE_API_URL}/menu/category`, { headers });
        const fetchedMenuCategoryData = MenuCategoryResponse.data.data || [];
      
        setMenuCategory(fetchedMenuCategoryData);

        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSelect = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
      // Fetch Type Off
      const response = await axios.get(`${VITE_API_URL}/users/category-alluser`, { headers });
      const groupOptions = response.data.data.map((group) => ({
        value: group.id_category,
        label: group.category_user,
      }));
      setGroups(groupOptions);

      if (selectedMenuCategory.id_category) {
        const initialGroup = groupOptions.find(
          (group) => group.value === selectedMenuCategory.id_category
        );
        setSelectedGroup(initialGroup || null);
      }

      // Fetch Users
      const menuResponse = await axios.get(`${VITE_API_URL}/menu`, { headers });
      const menuOptions = menuResponse.data.data.map((menu) => ({
        value: menu.menu_id,
        label: menu.name,
      }));
      setmenus(menuOptions);


      if (selectedMenuCategory.menu_id) {
        const initialMenu = menuOptions.find(
          (menu) => menu.value === selectedMenuCategory.menu_id
        );
        setSelectedmenus(initialMenu || null);
      }


    } catch (error) {
      console.error("Failed to fetch group:", error);
    }
  }
    fetchSelect();
  },[selectedMenuCategory.id_category, selectedMenuCategory.menu_id]);
  
  // Filtered MenuCategory
  // const filteredMenuCategory = MenuCategory.filter(
  //   (item) =>
  //     item.name?.toLowerCase().includes(search.toLowerCase()) ||
  //     item.description?.toLowerCase().includes(search.toLowerCase())
  // );

  const filteredMenuCategory = MenuCategory.filter((item) =>
    Object.keys(filterText).every((key) => {
      const itemValue = String(item[key])?.toLowerCase(); // Pastikan item selalu jadi string kecil
      const filterValue = filterText[key].toLowerCase(); // Pastikan filter input menjadi huruf kecil
  
      // Pastikan bahwa itemValue mengandung filterValue
      return itemValue.includes(filterValue);
    })
  );

  const handleInputChange = (field, value) => {
    setFilterText((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Baris UI BARU: search global lintas kolom.
  const displayedRows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return MenuCategory;
    return MenuCategory.filter((row) => {
      const hay = [row.category_user, row.menu_name, row.parent_name]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }, [MenuCategory, globalSearch]);

  const stats = useMemo(() => {
    const kat = new Set(
      displayedRows.map((r) => String(r.category_user || "").trim()).filter(Boolean)
    );
    const menu = new Set(
      displayedRows.map((r) => String(r.menu_name || "").trim()).filter(Boolean)
    );
    return { total: displayedRows.length, kategori: kat.size, menu: menu.size };
  }, [displayedRows]);

  const handleAddMenuCategory = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      //   const userData = JSON.parse(sessionStorage.getItem("userData"));
      //   const userId = userData?.id;

      const response = await axios.post(
        `${VITE_API_URL}/menu/add-config`,
        {
          ...newMenuCategory,
          created_by: userId,
          created_at: DateNow,
        },
        { headers }
      );
      // Ambil data baru dari respons API
      const addedMenuCategory = response.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setMenuCategory((prev) => [
        
        
        {
          ...addedMenuCategory,
          // name: users.find((u) => u.value === addedAbsen.user_id)?.label || "", // Nama user
          category_user:
            groups.find((r) => r.value === addedMenuCategory.id_category)?.label || "", // Nama retail
          menu_name: menus.find((r) => r.value === addedMenuCategory.menu_id)?.label || "",
          
        },
        ...prev,
      ]);

      // setMenuCategory((prev) => [...prev, response.data.data]);
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalVisible(false);
      setnewMenuCategory({ id_category: "", id: "" });
      setSelectedmenus(null);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  const handleUpdate = (row) => {
    setSelectedMenuCategory(row);
    setModalVisible(true);
  };

  // const handleRetailChange = (selectedOption) => {
  //   setSelectedRetail(selectedOption);
  //   setSelectedMenuCategory({
  //     ...selectedMenuCategory,
  //     retail_id: selectedOption ? selectedOption.value : "",
  //   });
  // };

  const handlegroupChange = (selectedOption) => {
    setSelectedGroup(selectedOption);
    setSelectedMenuCategory({
      ...selectedMenuCategory,
      id_category: selectedOption ? selectedOption.value : "",
    });
  };

  const handleMenuChange = (selectedOption) => {
    setSelectedmenus(selectedOption);
    setSelectedMenuCategory({
      ...selectedMenuCategory,
      menu_id: selectedOption ? selectedOption.value : "",
    });
  };

  const handleDelete = async (row) => {
    Swal.fire({
      title: "Kamu Yakin ?",
      text: `Delete Menu Config untuk Katgeori User : ${row.category_user} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;
          const headers = { Authorization: `Bearer ${token}` };
          const responseDelete = await axios.post(
            `${VITE_API_URL}/menu/delete-config/${row.id}`,
            {
              deleted_by: userId,
              deleted_at: DateNow,
            },
            { headers }
          );
          Swal.fire("Deleted!", `${responseDelete.data.message}`, "success");
          setMenuCategory((prev) =>
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
      const responseUpdate = await axios.post(
        `${VITE_API_URL}/menu/update-config/${selectedMenuCategory.id}`,
        {
          id_category: selectedMenuCategory.id_category,
          menu_id: selectedMenuCategory.menu_id,
          updated_by: userId,
          updated_at: DateNow,
        },
        { headers }
      );
      //const updatedAbsen = responseUpdate.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setMenuCategory((prevMenuCategory) =>
        prevMenuCategory.map((item) =>
          item.id === selectedMenuCategory.id
            ? {
                ...selectedMenuCategory,
                category_user: groups.find((u) => u.value === selectedMenuCategory.id_category)?.label || "",
                menu_name: menus.find((u) => u.value === selectedMenuCategory.menu_id)?.label || "",
              }
            : item
        )
      );
      // setMenuCategory(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      // setMenuCategory((prev) =>
      //   prev.map((item) =>
      //     item.absen_id === selectedMenuCategory.absen_id ? selectedMenuCategory : item
      //   )
      // );
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
    { name: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ marginBottom: "6px" }}>category user</span>
        <input
          type="text"
          value={filterText.category_user}
          className="form-control mt-1 filter-header"
          ref={(el) => (inputRefs.current.category_user = el)}
          onChange={(e) => handleInputChange("category_user", e.target.value)}
          onFocus={() => setActiveInput('category_user')} // Set active input
        />
      </div>
    ),
     selector: (row) => row.category_user },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Nama Menu</span>
          <input
            type="text"
            value={filterText.menu_name}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.menu_name = el)}
            onChange={(e) => handleInputChange("menu_name", e.target.value)}
            onFocus={() => setActiveInput('menu_name')} // Set active input
          />
        </div>
      ),
      selector: (row) => row.menu_name 
    },
    { name: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ marginBottom: "6px" }}>Parent Name</span>
        <input
          type="text"
          value={filterText.parent_name}
          className="form-control mt-1 filter-header"
          ref={(el) => (inputRefs.current.parent_name = el)}
          onChange={(e) => handleInputChange("parent_name", e.target.value)}
          onFocus={() => setActiveInput('parent_name')} // Set active input
        />
      </div>
    ),selector: (row) => row.parent_name },
    

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

  // Kolom UI BARU: sortable, badge, aksi ikon.
  const columnsV2 = [
    {
      id: 1,
      name: "Kategori User",
      sortable: true,
      selector: (row) => String(row.category_user || "").toLowerCase(),
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
              fontSize: "15px",
              flexShrink: 0,
            }}
          >
            <i className="mdi mdi-account-group"></i>
          </span>
          <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "13px" }}>
            {row.category_user || "-"}
          </span>
        </div>
      ),
      grow: 1.6,
    },
    {
      name: "Nama Menu",
      sortable: true,
      selector: (row) => String(row.menu_name || "").toLowerCase(),
      cell: (row) =>
        row.menu_name ? (
          pill("#f3e5f5", "#8e24aa", row.menu_name)
        ) : (
          <span style={{ color: "#b0bec5", fontSize: "12px" }}>-</span>
        ),
      grow: 1.6,
    },
    {
      name: "Parent Menu",
      sortable: true,
      selector: (row) => String(row.parent_name || "").toLowerCase(),
      cell: (row) =>
        row.parent_name ? (
          <span style={{ fontSize: "12px", color: "#546e7a" }}>
            <i className="mdi mdi-subdirectory-arrow-right" style={{ color: "#b0bec5" }}></i> {row.parent_name}
          </span>
        ) : (
          <span style={{ color: "#b0bec5", fontSize: "12px" }}>— root —</span>
        ),
      grow: 1.6,
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          {iconBtn("#fb8c00", "Edit config menu", () => handleUpdate(row), "mdi-pencil")}
          {iconBtn("#c62828", "Hapus config menu", () => handleDelete(row), "mdi-delete")}
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
        <h3 className="page-title" style={{ margin: 0 }}>Config Menu User</h3>
        {uiToggle}
      </div>

      {uiMode === "baru" ? (
        <MenuCategoryBaru
          loading={loading}
          error={error}
          stats={stats}
          rows={displayedRows}
          columns={columnsV2}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          onAdd={() => setAddModalVisible(true)}
        />
      ) : (
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Category Menu</h4>
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
                          style={{marginBottom:"30px"}}
                        >
                          Tambah Config Menu
                        </button>
                      </div>
                      <div className="col-sm-4">
                        <div className="input-group">
                          <div className="input-group-prepend bg-transparent">
                            
                          </div>
                          
                        </div>
                      </div>
                    </div>

                    {filteredMenuCategory && filteredMenuCategory.length > 0 ? (
                      <DataTable
                        keyField="MenuCategory-id"
                        columns={columns}
                        data={filteredMenuCategory}
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
                          {filteredMenuCategory.length > 0 ? (
                            filteredMenuCategory.map((row, index) => (
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

      {/* Modal Tambah Config Menu */}
      <Modal show={addModalVisible} onHide={() => setAddModalVisible(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #eceff1" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: 700, color: "#263238" }}>
            <i className="mdi mdi-cog-plus" style={{ color: "#2471a3", marginRight: "8px" }}></i>
            Tambah Config Menu
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f7f9fb", padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-account-group" style={{ marginRight: "4px" }}></i>Kategori User
              </label>
              <Select
                options={groups}
                value={
                  newMenuCategory.id_category
                    ? {
                        value: newMenuCategory.id_category,
                        label: groups.find((r) => r.value === newMenuCategory.id_category)?.label,
                      }
                    : null
                }
                onChange={(option) => {
                  setSelectedGroup(option);
                  setnewMenuCategory({ ...newMenuCategory, id_category: option ? option.value : "" });
                }}
                placeholder="Pilih Kategori user..."
                isClearable
                menuPosition="fixed"
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-menu" style={{ marginRight: "4px" }}></i>Menu
              </label>
              <Select
                options={menus}
                value={
                  newMenuCategory.menu_id
                    ? {
                        value: newMenuCategory.menu_id,
                        label: menus.find((r) => r.value === newMenuCategory.menu_id)?.label,
                      }
                    : null
                }
                onChange={(option) => {
                  setSelectedmenus(option);
                  setnewMenuCategory({ ...newMenuCategory, menu_id: option ? option.value : "" });
                }}
                placeholder="Pilih Menu..."
                isClearable
                menuPosition="fixed"
              />
              <small style={{ color: "#b0bec5", fontSize: "11px" }}>
                Menu yang dipilih akan tampil untuk kategori user ini.
              </small>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #eceff1" }}>
          <Button className="btn btn-light" onClick={() => setAddModalVisible(false)}>
            Batal
          </Button>
          <Button onClick={handleAddMenuCategory} style={{ background: "#2471a3", border: "none", fontWeight: 600 }}>
            <i className="mdi mdi-plus" style={{ marginRight: "5px" }}></i>Tambah
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Edit Config Menu */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #eceff1" }}>
          <Modal.Title style={{ fontSize: "18px", fontWeight: 700, color: "#263238" }}>
            <i className="mdi mdi-cog-outline" style={{ color: "#fb8c00", marginRight: "8px" }}></i>
            Edit Config Menu
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#f7f9fb", padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-account-group" style={{ marginRight: "4px" }}></i>Kategori User
              </label>
              <Select
                options={groups}
                value={selectedGroup}
                onChange={handlegroupChange}
                placeholder="Pilih Kategori user..."
                isClearable
                menuPosition="fixed"
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#607d8b", marginBottom: "4px", display: "block" }}>
                <i className="mdi mdi-menu" style={{ marginRight: "4px" }}></i>Menu
              </label>
              <Select
                options={menus}
                value={selectedmenus}
                onChange={handleMenuChange}
                placeholder="Pilih Menu..."
                isClearable
                menuPosition="fixed"
              />
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

export default MenuCategory;
