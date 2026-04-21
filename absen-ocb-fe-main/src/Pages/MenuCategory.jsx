import { useState, useRef, useEffect } from "react";
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

const MenuCategory = () => {
  const [MenuCategory, setMenuCategory] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
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
  
  
  console.log("MenuCategory:", MenuCategory);
  console.log("Selected group:", selectedMenuCategory);
 

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

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Config Menu User</h3>
      </div>
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

      {/* Modal Tambah User */}
      <Modal show={addModalVisible} onHide={() => setAddModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Config Menu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>category user</label>
            <Select
              options={groups}
              value={
                newMenuCategory.id_category
                  ? {
                      value: newMenuCategory.id_category,
                      label: groups.find((r) => r.value === newMenuCategory.id_category)
                        ?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedGroup(option);
                setnewMenuCategory({
                  ...newMenuCategory,
                  id_category: option ? option.value : "",
                  
                });
              }}
              placeholder="Pilih Kategory user..."
              isClearable
            />
          </div>

         
          <div className="form-group">
            <label>Menu</label>
            <Select
              options={menus}
              value={
                newMenuCategory.menu_id
                  ? {
                      value: newMenuCategory.menu_id,
                      label: menus.find((r) => r.value === newMenuCategory.menu_id)
                        ?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedmenus(option);
                setnewMenuCategory({
                  ...newMenuCategory,
                  menu_id: option ? option.value : "",
                });
              }}
              placeholder="Pilih Menu..."
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
            onClick={handleAddMenuCategory}
          >
            Tambah
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Config Menu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label> Kategory User</label>
                <Select
                  options={groups} // Data karyawan
                  value={selectedGroup} // Nilai yang dipilih
                  onChange={handlegroupChange} // Fungsi ketika berubah
                  placeholder="Pilih Kategori user..."
                  isClearable // Tambahkan tombol untuk menghapus pilihan
                />
              </div>
            
              
              <div className="form-group">
                <label> Menu</label>
                <Select
                  options={menus} // Data karyawan
                  value={selectedmenus} // Nilai yang dipilih
                  onChange={handleMenuChange} // Fungsi ketika berubah
                  placeholder="Pilih Menu..."
                  isClearable // Tambahkan tombol untuk menghapus pilihan
                />
              </div>
             
              {/* <div className="form-group">
                  <label> Retail / Outlet</label>
                  <Select
                    options={retails} // Data karyawan
                    value={selectedRetail} // Nilai yang dipilih
                    onChange={handleRetailChange} // Fungsi ketika berubah
                    placeholder="Pilih retail..."
                    isClearable // Tambahkan tombol untuk menghapus pilihan
                  />
                </div> */}
              {/* <div className="form-group">
            <label>user Absen</label>
            <Select
              options={users}
              value={
                selectedMenuCategory.user_absen
                  ? {
                      value: selectedMenuCategory.user_absen,
                      label: users.find(
                        (r) => r.value === selectedMenuCategory.user_absen
                      )?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelecteduser(option);
                setSelectedMenuCategory({
                  ...selectedMenuCategory,
                  user_absen: option ? option.value : "",
                });
              }}
              placeholder="Pilih user Absen..."
              isClearable
            />
            
          </div> */}
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

export default MenuCategory;
