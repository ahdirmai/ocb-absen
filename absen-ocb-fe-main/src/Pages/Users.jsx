/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";
// import userRole from "../data/roles";
import Select from "react-select";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;
const now = new Date();
const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

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

const UsersBaru = ({
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
    { key: "tanpa_imei", label: "Tanpa IMEI" },
  ];

  return (
    <div style={{ padding: "4px 2px" }}>
      {/* Stat ringkasan */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <StatCard label="Total Karyawan" value={stats.total} color="#455a64" icon="mdi-account-group" />
        <StatCard label="Aktif" value={stats.aktif} color="#2e7d32" icon="mdi-account-check" />
        <StatCard label="Non Aktif" value={stats.nonaktif} color="#c62828" icon="mdi-account-off" />
        <StatCard label="Tanpa IMEI" value={stats.tanpaImei} color="#ef6c00" icon="mdi-cellphone-off" />
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
          <div style={{ flex: "3 1 260px" }}>
            <label style={{ fontSize: "12px", color: "#607d8b", fontWeight: 600 }}>Cari</label>
            <div style={{ position: "relative" }}>
              <i
                className="mdi mdi-magnify"
                style={{ position: "absolute", left: "10px", top: "9px", color: "#b0bec5", fontSize: "18px" }}
              ></i>
              <input
                type="text"
                className="form-control"
                placeholder="Nama, username, IMEI, job title, atasan..."
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
            <i className="mdi mdi-account-plus"></i> Tambah Karyawan
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
            <i className="mdi mdi-account-search" style={{ fontSize: "36px" }}></i>
            <p style={{ marginTop: "8px" }}>Tidak ada karyawan yang cocok.</p>
          </div>
        ) : (
          <DataTable
            keyField="user_id"
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

const Users = () => {
  const [Users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    role: "",
    imei: "",
    category_user: "",
    upline: "",
    enabled: 1,
  });
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [category, setCategory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [uplines, setUplines] = useState([]);
  const [selectedUpline, setSelectedUpline] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // Preview gambar
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterText, setFilterText] = useState({
    name: "",
    username: "",
    role: "",
    imei: "",
    category_user: "",
    upline: "",
  });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);
  // UI baru (toggle dalam halaman). Default "baru", persist ke localStorage.
  const [uiMode, setUiMode] = useState(
    () => localStorage.getItem("users_ui_mode") || "baru"
  );
  const [globalSearch, setGlobalSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("semua"); // semua|aktif|nonaktif|tanpa_imei

  useEffect(() => {
    localStorage.setItem("users_ui_mode", uiMode);
  }, [uiMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const UsersResponse = await axios.get(`${VITE_API_URL}/users`, {
          headers,
        });
        const fetchedOffDayData = UsersResponse.data.data || [];
        const validOffDayData = fetchedOffDayData.filter(
          (item) => item && item.name
        );
        setUsers(validOffDayData);

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
        const rolesResponse = await axios.get(`${VITE_API_URL}/users/roles`, {
          headers,
        });
        const roleOptions = rolesResponse.data.data.map((role) => ({
          value: role.role_id,
          label: role.name_role,
        }));
        setRoles(roleOptions);

        if (selectedUser.role_id) {
          const initialTypeOff = roleOptions.find(
            (role) => role.value === selectedUser.role_id
          );
          setSelectedRoleId(initialTypeOff || null);
        }

        const categoryResponse = await axios.get(
          `${VITE_API_URL}/users/category-alluser`,
          { headers }
        );
        const categoryOptions = categoryResponse.data.data.map((category) => ({
          value: category.id_category,
          label: category.category_user,
        }));
        setCategory(categoryOptions);

        if (selectedUser.id_category) {
          const initialTypeOff = categoryOptions.find(
            (category) => category.value == selectedUser.id_category
          );
          setSelectedCategory(initialTypeOff || null);
        }

        // Fetch Users
        const uplineResponse = await axios.get(`${VITE_API_URL}/users`, {
          headers,
        });
        const uplineOptions = uplineResponse.data.data.map((upline) => ({
          value: upline.user_id,
          label: upline.name,
        }));
        setUplines(uplineOptions);

        if (selectedUser.id_upline) {
          const initialUser = uplineOptions.find(
            (upline) => upline.value === selectedUser.id_upline
          );
          setSelectedUpline(initialUser || null);
        }
      } catch (error) {
        console.error("Failed to fetch group:", error);
      }
    };
    fetchSelect();
  }, [selectedUser.role_id, selectedUser.id_upline, selectedUser.id_category]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsModalOpen(false);
  };

  const filteredUser = Users.filter((item) =>
    Object.keys(filterText).every((key) => {
      const itemValue = String(item[key])?.toLowerCase(); // Pastikan item selalu jadi string kecil
      const filterValue = filterText[key].toLowerCase(); // Pastikan filter input menjadi huruf kecil

      // Pastikan bahwa itemValue mengandung filterValue
      return itemValue.includes(filterValue);
    })
  );

  // UI baru: satu kotak cari untuk semua kolom + chip filter cepat.
  const displayedRows = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return Users.filter((row) => {
      if (quickFilter === "aktif" && !row.enabled) return false;
      if (quickFilter === "nonaktif" && row.enabled) return false;
      if (quickFilter === "tanpa_imei" && row.imei) return false;
      if (!q) return true;
      return [
        row.name,
        row.username,
        row.imei,
        row.role,
        row.category_user,
        row.upline,
      ].some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [Users, globalSearch, quickFilter]);

  const stats = useMemo(
    () => ({
      total: Users.length,
      aktif: Users.filter((r) => r.enabled).length,
      nonaktif: Users.filter((r) => !r.enabled).length,
      tanpaImei: Users.filter((r) => !r.imei).length,
    }),
    [Users]
  );

  const handleInputChange = (field, value) => {
    setFilterText((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // const filteredUser = Users.filter((item) =>
  //   item.name?.toLowerCase().includes(search.toLowerCase())
  // );

  console.log("Selected selectedUser:", selectedUser);

  const handleRoleChange = (selectedOption) => {
    setSelectedRoleId(selectedOption);
    setSelectedUser({
      ...selectedUser,
      role_id: selectedOption ? selectedOption.value : null, // Pastikan data upline terupdate
    });
  };

  const handleUserChange = (selectedOption) => {
    setSelectedUpline(selectedOption);
    setSelectedUser({
      ...selectedUser,
      id_upline: selectedOption ? selectedOption.value : null, // Pastikan data upline terupdate
    });
  };

  const handleCategoryChange = (selectedOption) => {
    setSelectedCategory(selectedOption);
    setSelectedUser({
      ...selectedUser,
      id_category: selectedOption ? selectedOption.value : null,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedUser({ ...selectedUser, photo_url: file }); // Update file baru
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result); // Tampilkan preview
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (row) => {
    setSelectedUser(row);
    setModalVisible(true);
  };

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      const formData = new FormData();
      formData.append("name", newUser.name);
      formData.append("username", newUser.username);
      formData.append("enabled", newUser.enabled);
      // formData.append("role", newUser.role_id);
      formData.append("upline", newUser.upline);
      formData.append("id_category", newUser.id_category);
      formData.append("created_by", userId);
      formData.append("created_at", DateNow);
      // formData.append("upline", selectedUpline ? selectedUpline.value : 0);

      if (newUser.photo_url) {
        const file = newUser.photo_url;

        // Validasi ukuran dan tipe file
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire("Error", "File size exceeds 5MB!", "error");
          return;
        }
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
          Swal.fire(
            "Error",
            "Invalid file type. Please upload an image.",
            "error"
          );
          return;
        }

        formData.append("photo_url", file);
      } else {
        formData.append("photo_url", null);
      }

      const response = await axios.post(
        `${VITE_API_URL}/users/create`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const addedUsers = response.data.data;
      console.log(addedUsers);
      setUsers((prev) => [
        {
          ...addedUsers,
          category_user:
            category.find(
              (category) =>
                category.value ===
                (isNaN(addedUsers.id_category)
                  ? null
                  : parseInt(addedUsers.id_category))
            )?.label || null,
          role:
            roles.find(
              (r) =>
                r.value ===
                (isNaN(addedUsers.role) ? null : parseInt(addedUsers.role))
            )?.label || "",
          upline:
            uplines.find(
              (r) =>
                r.value ===
                (isNaN(addedUsers.upline) ? null : parseInt(addedUsers.upline))
            )?.label || "",
        },
        ...prev,
      ]);

      Swal.fire({
        title: "Success!",
        text: `${response.data.message}`,
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        // window.location.reload();
      });
      setAddModalVisible(false);
      setNewUser({
        name: "",
        username: "",
        role: "",
        upline: "",
        category_user: "",
        enabled: 1,
      });
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  // const handleAddUser = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const userData = JSON.parse(sessionStorage.getItem("userData"));
  //     const userId = userData?.id;

  //     const response = await axios.post(
  //       `${VITE_API_URL}/users/create`,
  //       {
  //         ...newUser,
  //         category_user :selectedCategoryId,
  //         role : selectedRoleId,
  //         created_by: userId,
  //         created_at: DateNow,
  //         upline: selectedUpline ? selectedUpline.value : null,
  //       },
  //       { headers }
  //     );
  //     const newUserWithLabel = {
  //       ...response.data.data,
  //       // category_user:
  //       //   categories.find((cat) => cat.id_category === response.data.data.category_user)?.category_user || null,
  //       role:
  //         roles.find((role) => role.value === response.data.data.role_id)?.label || null,
  //       upline:
  //         uplines.find((upline) => upline.value === response.data.data.id_upline)?.label || null,
  //     };

  //     setUsers((prev) => [...prev, newUserWithLabel]);
  //     Swal.fire({
  //       title: "Success!",
  //       text: `${response.data.message}`,
  //       icon: "success",
  //       confirmButtonText: "OK",
  //     }).then(() => {
  //       // Reload halaman setelah tombol OK ditekan
  //       window.location.reload(); // Memuat ulang halaman
  //     });
  //     setAddModalVisible(false);
  //     setNewUser({ name: "", username: "", role: "", upline:"", user_category:"", enabled: 1 });
  //     // window.location.reload();
  //   } catch (error) {
  //     Swal.fire("Error!", error.response?.data?.message || error.message, "error");
  //   }

  // };

  const handleDelete = async (row) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete User : ${row.name} ?`,
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
            `${VITE_API_URL}/users/delete/${row.user_id}`,
            {
              deleted_by: userId,
              deleted_at: DateNow,
            },
            { headers }
          );
          Swal.fire("Deleted!", `${responseDelete.data.message}`, "success");
          setUsers((prev) =>
            prev.filter((item) => item.user_id !== row.user_id)
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

  //fungsi update old
  // const handleSaveUpdate = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const userProfile = sessionStorage.getItem("userProfile");
  //     const userData = JSON.parse(userProfile);
  //     const userId = userData[0]?.user_id;

  //     const responseUpdate = await axios.post(
  //       `${VITE_API_URL}/users/update/${selectedUser.user_id}`,
  //       {
  //         name: selectedUser.name,
  //         role: selectedUser.role_id,
  //         category_user: selectedUser.id_category,
  //         upline: selectedUser.id_upline,
  //         enabled: selectedUser.enabled,
  //         updated_by: userId,
  //         updated_at: DateNow,
  //       },
  //       { headers }
  //     );

  //     // console.log("Form Data Content:");
  //     // for (let [key, value] of formData.entries()) {
  //     //   console.log(`${key}:`, value);
  //     // }

  //     Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
  //     setUsers((prevUsers) =>
  //       prevUsers.map((item) =>
  //         item.user_id === selectedUser.user_id ? selectedUser : item
  //       )
  //     );
  //     setModalVisible(false);
  //   } catch (error) {
  //     Swal.fire(
  //       "Error!",
  //       error.response?.data?.message || error.message,
  //       "error"
  //     );
  //   }
  // };

  // console.log(selectedUser.photo_url)
  const handleSaveUpdate = async (overrides = {}) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      const payloadUser = { ...selectedUser, ...overrides };

      const formData = new FormData();
      formData.append("name", payloadUser.name);
      formData.append("username", payloadUser.username);
      // FormData mengubah null/undefined jadi string "null"/"undefined" yang
      // dianggap nilai sah oleh BE (body.imei || null) → kirim string kosong
      // supaya kolom imei benar-benar jadi NULL.
      formData.append("imei", payloadUser.imei ?? "");
      formData.append("enabled", payloadUser.enabled);
      // formData.append("role", selectedUser.role_id);
      formData.append("upline", payloadUser.id_upline);
      formData.append("id_category", payloadUser.id_category);
      formData.append("updated_by", userId);
      formData.append("updated_at", DateNow);

      if (payloadUser.photo_url instanceof File) {
        const file = payloadUser.photo_url;

        // Validasi ukuran dan tipe file
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire("Error", "File size exceeds 5MB!", "error");
          return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
          Swal.fire(
            "Error",
            "Invalid file type. Please upload an image.",
            "error"
          );
          return;
        }

        formData.append("photo_url", file);
      } else {
        formData.append("photo_url", payloadUser.photo_url);
      }
      //       console.log("Form Data Content:");
      // for (let [key, value] of formData.entries()) {
      //   console.log(`${key}:`, value);
      // }

      const responseUpdate = await axios.post(
        `${VITE_API_URL}/users/update/${payloadUser.user_id}`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("ini hasil photo url");
      console.log(responseUpdate.data.data.photo_url);
      // const addedUsers = response.data.data;
      // console.log( addedUsers)

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.user_id === payloadUser.user_id
            ? {
                ...payloadUser,
                category_user:
                  category.find(
                    (category) =>
                      category.value ===
                      (isNaN(payloadUser.id_category)
                        ? null
                        : parseInt(payloadUser.id_category))
                  )?.label || null,
                role:
                  roles.find(
                    (r) =>
                      r.value ===
                      (isNaN(payloadUser.role_id)
                        ? null
                        : parseInt(payloadUser.role_id))
                  )?.label || "",
                upline:
                  uplines.find(
                    (r) =>
                      r.value ===
                      (isNaN(payloadUser.id_upline)
                        ? null
                        : parseInt(payloadUser.id_upline))
                  )?.label || "",
                photo_url: responseUpdate.data.data.photo_url || null,
              }
            : item
        )
      );
      console.log("ini euy");
      console.log(selectedUser.photo_url);

      // setUsers(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      // setUsers((prev) =>
      //   prev.map((item) =>
      //     item.user_id === selectedUser.user_id ? selectedUser : item
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

  // Reset IMEI: kosongkan kolom imei (jadi NULL) supaya karyawan bisa login
  // dari HP baru — BE auto-daftarkan device saat login berikutnya.
  const handleResetImei = async () => {
    const confirm = await Swal.fire({
      title: "Reset IMEI?",
      html: `Perangkat terdaftar untuk <b>${selectedUser.name || "karyawan ini"}</b> akan dilepas.<br/>Karyawan bisa login dari HP baru, dan HP itu otomatis terdaftar.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, reset",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;

    setSelectedUser({ ...selectedUser, imei: "" });
    await handleSaveUpdate({ imei: "" });
  };

  const columns = [
    {
      name: <span style={{ marginBottom: "45px" }}>#</span>,
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
          <span style={{ marginBottom: "6px" }}>Nama Karyawan</span>
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
      minWidth: "200px", // Set minimum lebar kolom
      wrap: true,
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
          <span style={{ marginBottom: "6px" }}>Username</span>
          <input
            type="text"
            value={filterText.username}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.username = el)}
            onChange={(e) => handleInputChange("username", e.target.value)}
            onFocus={() => setActiveInput("username")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.username,
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
          <span style={{ marginBottom: "6px" }}>Imei</span>
          <input
            type="text"
            value={filterText.imei}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.imei = el)}
            onChange={(e) => handleInputChange("imei", e.target.value)}
            onFocus={() => setActiveInput("imei")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.imei,
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
          <span style={{ marginBottom: "6px" }}>Role</span>
          <input
            type="text"
            value={filterText.role}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.role = el)}
            onChange={(e) => handleInputChange("role", e.target.value)}
            onFocus={() => setActiveInput("role")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.role,
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
          <span style={{ marginBottom: "6px" }}>Job Title</span>
          <input
            type="text"
            value={filterText.category_user}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.category_user = el)}
            onChange={(e) => handleInputChange("category_user", e.target.value)}
            onFocus={() => setActiveInput("category_user")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.category_user,
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
          <span style={{ marginBottom: "6px" }}>Atasan</span>
          <input
            type="text"
            value={filterText.upline}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.upline = el)}
            onChange={(e) => handleInputChange("upline", e.target.value)}
            onFocus={() => setActiveInput("upline")} // Set active input
          />
        </div>
      ),
      selector: (row) => row.upline,
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
          <span style={{ marginBottom: "6px" }}>Photo</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            disabled
          />
        </div>
      ),
      cell: (row) => (
        <div>
          <img
            src={
              row?.photo_url
                ? `${VITE_API_IMAGE}${row.photo_url}`
                : "/user-icon.jpg"
            }
            alt="Profile"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10%",
              cursor: "pointer",
            }}
            onClick={() =>
              handleImageClick(
                row?.photo_url
                  ? `${VITE_API_IMAGE}${row.photo_url}`
                  : "/user-icon.jpg"
              )
            }
          />
        </div>
      ),
    },

    // { name: "Status", selector: (row) => row.enabled },
    {
      name: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ marginBottom: "6px" }}>Status</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            disabled
          />
        </div>
      ),
      cell: (row) => (
        <span
          className={`badge ${row.enabled ? "badge-success" : "badge-danger"}`}
        >
          {row.enabled ? "Active" : "Non Active"}
        </span>
      ),
    },
    {
      name: <span style={{ marginBottom: "45px" }}>Action</span>,
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
  // Kolom UI baru: tanpa input filter di header (search global di toolbar).
  const columnsV2 = [
    {
      id: 1,
      name: "Karyawan",
      minWidth: "240px",
      wrap: true,
      sortable: true,
      selector: (row) => String(row.name || "").toLowerCase(),
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={row?.photo_url ? `${VITE_API_IMAGE}${row.photo_url}` : "/user-icon.jpg"}
            alt={row.name}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              objectFit: "cover",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onClick={() =>
              handleImageClick(
                row?.photo_url ? `${VITE_API_IMAGE}${row.photo_url}` : "/user-icon.jpg"
              )
            }
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "#263238" }}>{row.name}</div>
            <div style={{ fontSize: "12px", color: "#90a4ae" }}>@{row.username}</div>
          </div>
        </div>
      ),
    },
    {
      name: "Perangkat",
      minWidth: "180px",
      cell: (row) =>
        row.imei ? (
          <span
            title={row.imei}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              maxWidth: "100%",
              background: "#e8f5e9",
              color: "#2e7d32",
              borderRadius: "999px",
              padding: "3px 10px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <i className="mdi mdi-cellphone-check"></i>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.imei}
            </span>
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#fff3e0",
              color: "#ef6c00",
              borderRadius: "999px",
              padding: "3px 10px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <i className="mdi mdi-cellphone-off"></i> Belum terdaftar
          </span>
        ),
    },
    {
      name: "Job Title",
      selector: (row) => row.category_user || "-",
      wrap: true,
    },
    {
      name: "Atasan",
      selector: (row) => row.upline || "-",
      wrap: true,
    },
    {
      name: "Status",
      width: "120px",
      cell: (row) => (
        <span
          style={{
            background: row.enabled ? "#e8f5e9" : "#ffebee",
            color: row.enabled ? "#2e7d32" : "#c62828",
            borderRadius: "999px",
            padding: "3px 12px",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {row.enabled ? "Active" : "Non Active"}
        </span>
      ),
    },
    {
      name: "Aksi",
      width: "170px",
      cell: (row) => (
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className="btn btn-sm"
            title="Edit karyawan"
            onClick={() => handleUpdate(row)}
            style={{
              background: "#fff8e1",
              color: "#ef6c00",
              border: "1px solid #ffe0b2",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            <i className="mdi mdi-pencil"></i>
          </button>
          <button
            className="btn btn-sm"
            title="Hapus karyawan"
            onClick={() => handleDelete(row)}
            style={{
              background: "#ffebee",
              color: "#c62828",
              border: "1px solid #ffcdd2",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            <i className="mdi mdi-delete"></i>
          </button>
        </div>
      ),
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
        <h3 className="page-title" style={{ margin: 0 }}>Data Karyawan</h3>
        {uiToggle}
      </div>
      {uiMode === "baru" ? (
        <UsersBaru
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
              <h4 className="card-title">Table List Karyawan</h4>
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
                          Tambah Karyawan
                        </button>
                      </div>
                      <div className="col-sm-4">
                        <div className="input-group">
                          <div className="input-group-prepend bg-transparent">
                            {/* <i
                              className="input-group-text border-0 mdi mdi-magnify"
                              style={{ margin: "10px" }}
                            ></i> */}
                          </div>
                          {/* <input
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
                          /> */}
                        </div>
                      </div>
                    </div>

                    {filteredUser && filteredUser.length > 0 ? (
                      <DataTable
                        keyField="mydatatable"
                        columns={columns}
                        data={filteredUser}
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
                            {filteredUser.length > 0 ? (
                              filteredUser.map((row, index) => (
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
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <img
            src={selectedImage}
            alt="Preview"
            style={{ maxWidth: "60%", maxHeight: "60%", borderRadius: "10px" }}
          />
        </div>
      )}

      {/* Modal Tambah User */}
      <Modal show={addModalVisible} onHide={() => setAddModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Karyawan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>Nama Karyawan</label>
            <input
              type="text"
              className="form-control"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
            />
          </div>
          {/* <div className="form-group">
            <label>User Role</label>
            <Select
              options={roles}
              value={
                newUser.role_id
                  ? {
                      value: newUser.role_id,
                      label: roles.find((r) => r.value === newUser.role_id)
                        ?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedRoleId(option);
                setNewUser({
                  ...newUser,
                  role_id: option ? option.value : "",
                });
              }}
              placeholder="Pilih Role User..."
              isClearable
            />
          </div> */}
          <div className="form-group">
            <label>Job Title</label>
            <Select
              options={category}
              value={
                newUser.id_category
                  ? {
                      value: newUser.id_category,
                      label: category.find(
                        (r) => r.value === newUser.id_category
                      )?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedCategory(option);
                setNewUser({
                  ...newUser,
                  id_category: option ? option.value : "",
                });
              }}
              placeholder="Pilih Job Tittle sesuai Role..."
              isClearable
            />
          </div>

          <div className="form-group">
            <label>Nama Atasan</label>
            <Select
              options={uplines}
              value={
                newUser.upline
                  ? {
                      value: newUser.upline,
                      label: uplines.find((r) => r.value === newUser.upline)
                        ?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedUpline(option);
                setNewUser({
                  ...newUser,
                  upline: option ? option.value : "",
                });
              }}
              placeholder="Pilih Atasan..."
              isClearable
            />
            {/* <Select
              options={uplines} // Data Atasan
              value={selectedUpline} // Nilai yang dipilih
              onChange={handleUserChange} // Fungsi ketika berubah
              placeholder="Pilih Atasan..."
              isClearable // Tambahkan tombol untuk menghapus pilihan
            /> */}
          </div>
          <div className="form-group">
            <label>Photo User</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) =>
                setNewUser({ ...newUser, photo_url: e.target.files[0] })
              }
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              className="form-select"
              value={newUser.enabled}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  enabled: e.target.value === "1" ? 1 : 0,
                })
              }
            >
              <option value="1">Active</option>
              <option value="0">Non Active</option>
            </select>
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
            onClick={handleAddUser}
          >
            Tambah Karyawan
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Data Karyawan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
              <form className="forms-sample">
                <div className="form-group">
                  <label>Nama Karyawan</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedUser.name || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    className="form-control"
                    type="text"
                    value={selectedUser.username || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        username: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>IMEI / Perangkat Terdaftar</label>
                  <div className="d-flex gap-2">
                    <input
                      className="form-control"
                      type="text"
                      value={selectedUser.imei || ""}
                      placeholder="Belum terdaftar"
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          imei: e.target.value,
                        })
                      }
                    />
                    <Button
                      className="btn btn-outline-danger"
                      style={{ whiteSpace: "nowrap" }}
                      disabled={!selectedUser.imei}
                      onClick={handleResetImei}
                    >
                      Reset
                    </Button>
                  </div>
                  <small className="text-muted">
                    Reset bila karyawan ganti HP. Perangkat baru otomatis
                    terdaftar saat login berikutnya.
                  </small>
                </div>

                {/* <div className="form-group">
                  <label>User Role</label>
                  <Select
                    options={roles} // Data karyawan
                    value={selectedRoleId} // Nilai yang dipilih
                    onChange={handleRoleChange} // Fungsi ketika berubah
                    placeholder="Pilih Role User..."
                    isClearable // Tambahkan tombol untuk menghapus pilihan
                  />
                </div> */}
                <div className="form-group">
                  <label>Job Title</label>
                  <Select
                    options={category} // Data karyawan
                    value={selectedCategory} // Nilai yang dipilih
                    onChange={handleCategoryChange} // Fungsi ketika berubah
                    placeholder="Pilih Job Title Sesuai dengan Role..."
                    isClearable // Tambahkan tombol untuk menghapus pilihan
                  />
                </div>

                <div className="form-group">
                  <label>Nama Atasan</label>
                  <Select
                    options={uplines} // Data karyawan
                    value={selectedUpline} // Nilai yang dipilih
                    onChange={handleUserChange} // Fungsi ketika berubah
                    placeholder="Pilih Atasan..."
                    isClearable // Tambahkan tombol untuk menghapus pilihan
                  />
                </div>
                <div className="form-group">
                  <label>Photo User</label>
                  {imagePreview || selectedUser?.photo_url ? (
                    <div style={{ marginBottom: "10px" }}>
                      <img
                        src={
                          imagePreview ||
                          `${VITE_API_IMAGE}${selectedUser.photo_url}`
                        }
                        alt="Preview"
                        style={{
                          width: "200px",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "5px",
                        }}
                      />
                    </div>
                  ) : (
                    <p>No image selected</p>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-select"
                    value={selectedUser.enabled ? "1" : "0"}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        enabled: e.target.value === "1" ? 1 : 0,
                      })
                    }
                  >
                    <option value="1">Active</option>
                    <option value="0">Non Active</option>
                  </select>
                </div>
              </form>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="btn btn-light"
            onClick={() => setModalVisible(false)}
          >
            Close
          </Button>
          <Button
            className="btn btn-gradient-primary me-2"
            onClick={() => handleSaveUpdate()}
          >
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Users;
