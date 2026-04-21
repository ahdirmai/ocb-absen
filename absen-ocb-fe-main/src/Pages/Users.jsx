import { useState, useRef, useEffect } from "react";
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
  const handleSaveUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      const formData = new FormData();
      formData.append("name", selectedUser.name);
      formData.append("username", selectedUser.username);
      formData.append("imei", selectedUser.imei);
      formData.append("enabled", selectedUser.enabled);
      // formData.append("role", selectedUser.role_id);
      formData.append("upline", selectedUser.id_upline);
      formData.append("id_category", selectedUser.id_category);
      formData.append("updated_by", userId);
      formData.append("updated_at", DateNow);

      if (selectedUser.photo_url instanceof File) {
        const file = selectedUser.photo_url;

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
        formData.append("photo_url", selectedUser.photo_url);
      }
      //       console.log("Form Data Content:");
      // for (let [key, value] of formData.entries()) {
      //   console.log(`${key}:`, value);
      // }

      const responseUpdate = await axios.post(
        `${VITE_API_URL}/users/update/${selectedUser.user_id}`,
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
          item.user_id === selectedUser.user_id
            ? {
                ...selectedUser,
                category_user:
                  category.find(
                    (category) =>
                      category.value ===
                      (isNaN(selectedUser.id_category)
                        ? null
                        : parseInt(selectedUser.id_category))
                  )?.label || null,
                role:
                  roles.find(
                    (r) =>
                      r.value ===
                      (isNaN(selectedUser.role_id)
                        ? null
                        : parseInt(selectedUser.role_id))
                  )?.label || "",
                upline:
                  uplines.find(
                    (r) =>
                      r.value ===
                      (isNaN(selectedUser.id_upline)
                        ? null
                        : parseInt(selectedUser.id_upline))
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
  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Data Karyawan</h3>
      </div>
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
                  <label>Imei</label>
                  <input
                    className="form-control"
                    type="text"
                    value={selectedUser.imei || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        imei: e.target.value,
                      })
                    }
                  />
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
            onClick={handleSaveUpdate}
          >
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Users;
