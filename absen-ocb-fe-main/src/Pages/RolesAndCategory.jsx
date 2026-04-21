import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";
import Select from "react-select";
const now = new Date();
const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

const VITE_API_URL = import.meta.env.VITE_API_URL;

const RolesAndCategory = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setselectedRoles] = useState({});
  const [selectedCategory, setSelectedCategory] = useState({});
  //   const [selectedCategory, setselectedCategory] = useState({});
  const [optionRoles, setOptionRoles] = useState([]);
  const [category, setCategory] = useState([]);
  const [error, setError] = useState(null);
  const [newRoles, setnewRoles] = useState({
    name_role: "",
    
  });

  const [newCategory, setnewCategory] = useState({
    role_id: "",
    category_user : "",

  });
  const [addModalRole, setAddModalRole] = useState(false);
  const [modalUpdateRole, setModalUpdateRole] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState(false);
  const [modalUpdateCategory, setModalUpdateCategory] = useState(false);



  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${VITE_API_URL}/user-management`, {
          headers,
        });
        setRoles(response.data.data);

        const rolesOptions = response.data.data.map((optionroles) => ({
          value: optionroles.role_id,
          label: optionroles.name_role,
        }));
        setOptionRoles(rolesOptions);

        // if (selectedCategory.role_id) {
        //     const initialRole = rolesOptions.find(
        //       (role) => role.value === rolesOptions.role_id
        //     );
        //     setSelectedCategory(initialRole || null);
        //   }


        const responseCategory = await axios.get(
          `${VITE_API_URL}/user-management/category`,
          { headers }
        );
        setCategory(responseCategory.data.data);
        // console.log(response.data)
      } catch (error) {
        setError(error.message);
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  

  const handleAddRole = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      //   const userData = JSON.parse(sessionStorage.getItem("userData"));
      //   const userId = userData?.id;

      const response = await axios.post(
        `${VITE_API_URL}/user-management/addRoles`,
        {
          ...newRoles,
          created_by: userId,
          created_at: DateNow,
        },
        { headers }
      );
      // Ambil data baru dari respons API
      const addedRoles = response.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setRoles((prev) => [
        ...prev,
        {
          ...addedRoles,
        },
      ]);

      // setoffDay((prev) => [...prev, response.data.data]);
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalRole(false);
      setnewRoles({ name_role: "" });
      setselectedRoles(null);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      //   const userData = JSON.parse(sessionStorage.getItem("userData"));
      //   const userId = userData?.id;

      const response = await axios.post(
        `${VITE_API_URL}/user-management/addCategory`,
        {
          ...newCategory,
          created_by: userId,
          created_at: DateNow,
        },
        { headers }
      );
      // Ambil data baru dari respons API
      const addedCategory = response.data.data;
      console.log(addedCategory.role_id);
      const role = optionRoles.find((r) => r.value === addedCategory.role_id);
      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setCategory((prev) => [
        ...prev,
        {
          ...addedCategory,
          name_role: role ? role.label : "Unknown Role",
        },
      ]);

      // setoffDay((prev) => [...prev, response.data.data]);
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalCategory(false);
      setnewCategory({ role_id: "" , category_user:"" });
      setSelectedCategory(null);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  const handleUpdateRole = (role) => {
    setselectedRoles(role);
    setModalUpdateRole(true);
  };

  const handleUpdateCategory = (category) => {
    setSelectedCategory(category);
    setModalUpdateCategory(true);
  };

  const handleSaveUpdateRole = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;
      const responseUpdate = await axios.post(
        `${VITE_API_URL}/user-management/updateRole/${selectedRoles.role_id}`,
        {
          name_role : selectedRoles.name_role,
          updated_by: userId,
          updated_at: DateNow,
        },
        { headers }
      );
      //const updatedAbsen = responseUpdate.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setRoles((prevRole) =>
        prevRole.map((item) =>
          item.role_id === selectedRoles.role_id
            ? {
                ...selectedRoles,
              }
            : item
        )
      );
      // setoffDay(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      // setoffDay((prev) =>
      //   prev.map((item) =>
      //     item.absen_id === selectedoffDay.absen_id ? selectedoffDay : item
      //   )
      // );
      setModalUpdateRole(false);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  const handleSaveUpdateCategory = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;
      const responseUpdate = await axios.post(
        `${VITE_API_URL}/user-management/updateCategory/${selectedCategory.id_category}`,
        {
          role_id : selectedCategory.role_id,
          category_user : selectedCategory.category_user,
          updated_by: userId,
          updated_at: DateNow,
        },
        { headers }
      );
    
      const updatedCategory = responseUpdate.data.data;
      const role = optionRoles.find((r) => r.value === updatedCategory.role_id);
      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setCategory((prevRole) =>
        prevRole.map((item) =>
          item.id_category === selectedCategory.id_category
            ? {
                ...selectedCategory,
                name_role: role ? role.label : "Unknown Role",
              }
            : item
        )
      );
      // setoffDay(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      // setoffDay((prev) =>
      //   prev.map((item) =>
      //     item.absen_id === selectedoffDay.absen_id ? selectedoffDay : item
      //   )
      // );
      setModalUpdateCategory(false);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title"> Data Role dan Kategori User </h3>
      </div>
      <div className="row">
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Role User</h4>
              {/* <p className="card-description"> Add User </p> */}
              <div className="card-description">
                <button
                  className="btn btn-gradient-primary btn-sm"
                  onClick={() => setAddModalRole(true)}
                >
                  Tambah Role
                </button>
              </div>

              <div className="table-responsive">
                {error ? (
                  <p>Terjadi kesalahan: {error}</p>
                ) : (
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th> # </th>
                        <th> Nama Role </th>
                        <th> Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.length > 0 ? (
                        roles.map((role, index) => (
                          <tr key={role.role_id}>
                            <td>{index + 1}</td>
                            <td>{role.name_role}</td>

                            <td
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <button
                                className="btn btn-gradient-warning btn-sm"
                                onClick={() => handleUpdateRole(role)}
                              >
                                Update
                              </button>
                              {/* <button className="btn btn-gradient-danger btn-sm">
                              Delete
                            </button> */}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">Loading users...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Kategori User</h4>
              {/* <p className="card-description"> Add User </p> */}
              <div className="card-description">
                <button className=" btn btn-gradient-primary btn-sm"
                onClick={() => setAddModalCategory(true)}
                >
                  Tambah Kategori
                
                </button>
              </div>

              <div className="table-responsive">
                {error ? (
                  <p>Terjadi kesalahan: {error}</p>
                ) : (
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th> # </th>
                        <th> Role User</th>
                        <th> Category User </th>
                        <th> Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.length > 0 ? (
                        category.map((category, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{category.name_role}</td>
                            <td>{category.category_user}</td>
                            <td
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                               <button
                                className="btn btn-gradient-warning btn-sm"
                                onClick={() => handleUpdateCategory(category)}
                              >

                                Update
                              </button>
                             
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">Loading users...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Role*/}
      <Modal show={addModalRole} onHide={() => setAddModalRole(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Role User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>Nama Role</label>
            <input
              type="text"
              className="form-control"
              value={newRoles.name_role}
              onChange={(e) =>
                setnewRoles({ ...newRoles, name_role: e.target.value })
              }
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="btn btn-light"
            onClick={() => setAddModalRole(false)}
          >
            Close
          </Button>
          <Button
            className="btn btn-gradient-primary me-2"
            onClick={handleAddRole}
          >
            Tambah
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalUpdateRole} onHide={() => setModalUpdateRole(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Role User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label>Nama Role</label>
                <input
                  className="form-control"
                  type="text"
                  value={selectedRoles?.name_role || ""}
                  onChange={(e) =>
                    setselectedRoles({
                      ...selectedRoles,
                      name_role: e.target.value, // Nilai langsung dari input date
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="btn btn-light"
            onClick={() => setModalUpdateRole(false)}
          >
            Close
          </Button>
          <Button
            className="btn btn-gradient-primary me-2"
            onClick={handleSaveUpdateRole}
          >
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>


        {/* Modal Tambah Category*/}
        <Modal show={addModalCategory} onHide={() => setAddModalCategory(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Tambah Category User</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="form-group">
      <label>Role User</label>
      <Select
        options={optionRoles} // roles diambil dari state yang sudah di-set di fetchUsers
        value={
            newCategory.role_id
              ? {
                  value: newCategory.role_id,
                  label: optionRoles.find((r) => r.value === newCategory.role_id)
                    ?.label,
                }
              : null
          }
        onChange={(option) => {
          setSelectedCategory(option);
          setnewCategory({
            ...newCategory,
            role_id: option ? option.value : "",
          });
        }}
        placeholder="Pilih user Role..."
        isClearable
      />
    </div>
    <div className="form-group">
      <label>Kategori User</label>
      <input
        type="text"
        className="form-control"
        value={newCategory.category_user}
        onChange={(e) =>
          setnewCategory({ ...newCategory, category_user: e.target.value })
        }
      />
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button
      className="btn btn-light"
      onClick={() => setAddModalCategory(false)}
    >
      Close
    </Button>
    <Button
      className="btn btn-gradient-primary me-2"
      onClick={handleAddCategory}
    >
      Tambah
    </Button>
  </Modal.Footer>
</Modal>

<Modal show={modalUpdateCategory} onHide={() => setModalUpdateCategory(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Edit Kategori User</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="card">
      <div className="card-body">
        <div className="form-group">
          <label>Nama Role</label>
          <Select
            options={optionRoles}
            value={
              selectedCategory?.role_id
                ? {
                    value: selectedCategory.role_id,
                    label: optionRoles.find(
                      (r) => r.value === selectedCategory.role_id
                    )?.label,
                  }
                : null
            }
            onChange={(option) =>
              setSelectedCategory({
                ...selectedCategory,
                role_id: option ? option.value : "",
              })
            }
            placeholder="Pilih User Role..."
            isClearable
          />
        </div>
        <div className="form-group">
          <label>Kategori User</label>
          <input
            type="text"
            className="form-control"
            value={selectedCategory?.category_user}
            onChange={(e) =>
              setSelectedCategory({
                ...selectedCategory,
                category_user: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button
      className="btn btn-light"
      onClick={() => setModalUpdateCategory(false)}
    >
      Close
    </Button>
    <Button
      className="btn btn-gradient-primary me-2"
      onClick={handleSaveUpdateCategory}
    >
      Simpan Perubahan
    </Button>
  </Modal.Footer>
</Modal>


    </div>
  );
};

export default RolesAndCategory;
