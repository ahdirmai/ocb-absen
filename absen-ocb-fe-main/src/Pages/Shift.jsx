import { useState,useRef, useEffect } from "react";
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

const Shift = () => {
  const [Shifts, setShifts] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [retails, setRetails] = useState([]);
  const [selectedRetail, setSelectedRetail] = useState(null);
  const [newShift, setNewShift] = useState({
    start_date: "",
    end_date: "",
    user_id: "",
    retail_id: "",
  });
  const [filterText, setFilterText] = useState({
    start_date: "",
    end_date: "",
    name: "",
    retail_name: "",

  });
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

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);
 


  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Data Shifts</h3>
      </div>
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

      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Data Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
              <form className="forms-sample">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedShift.start_date ? format(new Date(selectedShift.start_date), "yyyy-MM-dd") : ""}
                    onChange={(e) =>
                      setSelectedShift({
                        ...selectedShift,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End_Date</label>
                  <input
                    className="form-control"
                    type="date"
                    value={selectedShift.end_date ? format(new Date(selectedShift.end_date), "yyyy-MM-dd") : ""}
                    onChange={(e) =>
                      setSelectedShift({
                        ...selectedShift,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
               
                <div className="form-group">
                  <label> Retail / Outlet</label>
                  <Select
                    options={retails} // Data karyawan
                    value={retails.find((retails) => retails.value === parseInt(selectedShift.retail_id, 10)) || null} // Nilai yang dipilih
                    onChange={handleRetailChange} // Fungsi ketika berubah
                    placeholder="Pilih retail..."
                    isClearable // Tambahkan tombol untuk menghapus pilihan
                  />
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
                    value={selectedUser} // Nilai yang dipilih
                    onChange={(selected) => setSelectedUser(selected)} // Fungsi ketika berubah
                    placeholder="Pilih Karyawan..."
                    isClearable // Tambahkan tombol untuk menghapus pilihan
                  />
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

export default Shift;
