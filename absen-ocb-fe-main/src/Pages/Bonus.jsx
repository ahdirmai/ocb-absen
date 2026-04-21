import { useState,useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";
import Select from "react-select";
import { Tooltip } from "react-tooltip";
import DatePicker from "react-multi-date-picker";
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const now = new Date();
const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

const Bonus = () => {
  const [bonus, setbonus] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedbonus, setSelectedbonus] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [newbonus, setnewbonus] = useState({
    user_id: "",
    bonus: "",
    month: [],
    reason : "",
    type_pb: "",
    name: "",
  });
  const [users, setusers] = useState([]);
  const [selecteduser, setSelecteduser] = useState(null);
  const [typePB, settypePB] = useState([]);
  const [selectedTypePB, setSelectedTypePB] = useState(null);
  const [filterText, setFilterText] = useState({
    name: "",
    month: "",
    type_pb: "",
    reason: "",
    bonus: "",

  });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);
  const formatBonusDayData = (data) => {
    if (!Array.isArray(data)) {
      if (typeof data === "object" && data !== null) {
        data = [data]; // Ubah objek menjadi array tunggal
      } else {
        return []; // Return array kosong jika bukan array atau objek
      }
    }

    return data.map((item,) => {
      return {
        id: item.id_bonus,
        month: item.month || "",
        bonus : item.bonus,
        type_pb: item.type_pb || "-",
        reason: item.reason || "-",
        id_type_pb : item.id_type_pb,
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
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
  
        // Fetch bonus data
        const bonusResponse = await axios.get(`${VITE_API_URL}/management/bonus`, {
          headers,
        });
        const formattedData = formatBonusDayData(bonusResponse.data.data);
        // const validBonusData = bonusData.filter((item) => item && item.name);
        setbonus(formattedData);

        
        // Clear errors
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
        console.error("Failed to fetch data:", error);
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
        const typePBResponse = await axios.get(`${VITE_API_URL}/management/type-pb`, { headers });
        const typePBOptions = typePBResponse.data.data.map((typepb) => ({
          value: typepb.id,
          label: typepb.type_pb,
        }));
        settypePB(typePBOptions);
  
        if (selectedbonus.id_type_pb) {
          const initialTypePB = typePBOptions.find(
            (typepb) => typepb.value === selectedbonus.id_type_pb
          );
          setSelectedTypePB(initialTypePB|| null);
        }

         // Fetch user data
         const userResponse = await axios.get(`${VITE_API_URL}/users`, { headers });
         const userOptions = userResponse.data.data.map((user) => ({
           value: user.user_id,
           label: user.name,
         }));
         setusers(userOptions);
   
         // Set selected user if `selectedbonus.user_id` exists
         if (selectedbonus?.employes_id) {
           const groupIds = selectedbonus.employes_id
             .split(", ")
             .map((user_id) => Number(user_id.trim())); // Konversi ke number
           
         
           const initialGroups = userOptions.filter((group) =>
             groupIds.includes(group.value)
           );
         
           setSelecteduser(initialGroups);
         }
  
      } catch (error) {
        console.error("Failed to fetch group:", error);
      }

    };

    fetchSelect();
  }, [selectedbonus?.employes_id, selectedbonus?.id_type_pb]);
  // const filteredbonus = bonus.filter(
  //   (item) =>
  //     item.name?.toLowerCase().includes(search.toLowerCase())
  // );

  const filteredbonus = bonus.filter((item) =>
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
  


 

  console.log("Selected bonus:", selectedbonus);


  

  const handleAddbonus = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;

      //   const userData = JSON.parse(sessionStorage.getItem("userData"));
      //   const userId = userData?.id;
      let employes_bonus = [];
      if (selecteduser?.length > 0) {
        employes_bonus = selecteduser.map((user) => ({
          user_id: user.value,
        }));
      }

      const payload = {
        ...newbonus,
        created_by: userId,
        created_at: DateNow,
        employes_bonus,
      };

      const response = await axios.post(
        `${VITE_API_URL}/management/addbonus`,
       payload,
        { headers }
      );
      // Ambil data baru dari respons API
      const addedbonus = response.data.data;

      const newRows = addedbonus.month.map((tgl, index) => ({
        id: addedbonus.id_bonuss[index], // Ambil ID yang sesuai
        month: tgl,
        bonus : addedbonus.bonus,
        type_pb: typePB.find((r) => r.value === addedbonus.type_pb)?.label || "",
        reason: addedbonus.reason,
        name: selecteduser?.length
            ? selecteduser.map((g) => g.label).join(", ")
            : "Semua Karyawan",
        id_type_pb: addedbonus.type_pb || "",
        employes_id: selecteduser?.length
            ? selecteduser.map((g) => g.value).join(", ")
            : "",
    }));
      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setbonus((prev) => [...newRows, ...prev]);
      // setbonus((prev) => [
        
      //   {
      //     ...addedbonus,
      //     // name: users.find((u) => u.value === addedAbsen.user_id)?.label || "", // Nama user
      //     type_pb:
      //     typePB.find((r) => r.value === addedbonus.type_pb)?.label || "",
      //     name: Array.isArray(selecteduser) && selecteduser.length > 0
      //     ? selecteduser.map((g) => g.label).join(", ") 
      //     : "Semua Karyawan",

      //   },
      //   ...prev,
      // ]);

      // setbonus((prev) => [...prev, response.data.data]);
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalVisible(false);
      setnewbonus({ user_id: "", bonus: "", month: [], type_pb: "", name:"", employes_id: "",});
      setSelecteduser(null);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  const handleUpdate = (row) => {
    setSelectedbonus(row);
    setModalVisible(true);
  };

  const handleTypePBChange = (selectedOption) => {
    setSelectedTypePB(selectedOption);
    setSelectedbonus({
      ...selectedbonus,
      id_type_pb: selectedOption ? selectedOption.value : "",
    });
  };

  const handleuserChange = (selectedOption) => {
    setSelecteduser(selectedOption ||[]);
  };

  const handleDelete = async (row) => {
    Swal.fire({
      title: "Kamu Yakin ?",
      text: `Delete Bonus/Punishment ?`,
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
            `${VITE_API_URL}/management/deletebonus/${row.id}`,
            {
              deleted_by: userId,
              deleted_at: DateNow,
            },
            { headers }
          );
          Swal.fire("Deleted!", `${responseDelete.data.message}`, "success");
          setbonus((prev) =>
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


      let employes_bonus = [];
      if (selecteduser?.length > 0) {
        employes_bonus = selecteduser.map((group) => ({
          user_id: group.value,
        }));
      }

      const payload = {
          month: selectedbonus.month,
          bonus: selectedbonus.bonus,
          type_pb : selectedbonus.id_type_pb,
          reason : selectedbonus.reason,
          employes_bonus,
          updated_by: userId,
          updated_at: DateNow,
      };

      const responseUpdate = await axios.post(
        `${VITE_API_URL}/management/updatebonus/${selectedbonus.id}`,
        payload,
        { headers }
      );
      //const updatedAbsen = responseUpdate.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setbonus((prevbonus) =>
        prevbonus.map((item) =>
          item.id === selectedbonus.id
            ? {
                ...selectedbonus,
                type_pb:
                typePB.find((r) => r.value === selectedbonus.id_type_pb)
                  ?.label || "",
                  name: Array.isArray(selecteduser)&& selecteduser.length > 0
                  ? selecteduser.map((g) => g.label).join(", ")
                  : "Semua Karyawan",
              }
            : item
        )
      );
      // setbonus(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      // setbonus((prev) =>
      //   prev.map((item) =>
      //     item.absen_id === selectedbonus.absen_id ? selectedbonus : item
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
    },selector: (row) => row.name },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Tanggal</span>
          <input
            type="text"
            value={filterText.month}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.month = el)}
            onChange={(e) => handleInputChange("month", e.target.value)}
            onFocus={() => setActiveInput('month')} // Set active input
          />
        </div>
      ),
      selector: (row) => format(new Date(row.month), "yyyy-MM-dd"),
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Type Bonus/Punishment</span>
          <input
            type="text"
            value={filterText.type_pb}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.type_pb = el)}
            onChange={(e) => handleInputChange("type_pb", e.target.value)}
            onFocus={() => setActiveInput('type_pb')} // Set active input
          />
        </div>
      ), selector: (row) => row.type_pb },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Bonus/Punishment</span>
          <input
            type="text"
            value={filterText.bonus}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.bonus = el)}
            onChange={(e) => handleInputChange("bonus", e.target.value)}
            onFocus={() => setActiveInput('bonus')} // Set active input
          />
        </div>
      ), selector: (row) => row.bonus },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Keterangan</span>
          <input
            type="text"
            value={filterText.reason}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.reason = el)}
            onChange={(e) => handleInputChange("reason", e.target.value)}
            onFocus={() => setActiveInput('reason')} // Set active input
          />
        </div>
      ), selector: (row) => row.reason },

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
 
   const exportToExcel = () => {
        const data = filteredbonus.map((row, index) => ({
          "No": index + 1,
          "Nama Karyawan": row.name,
          "Tanggal": row.month,
          "Type Bonus / Punishment": row.type_pb,
          "Jumlah": row.bonus,
          "Keterangan": row.reason,
        }));
    
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Bonus-Punishment Data");
    
        const dateNow = new Date().toISOString().split("T")[0]; // Current date
        XLSX.writeFile(workbook, `Data_Bonus-Punishment_${dateNow}.xlsx`);
      };


  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Management Bonus Karyawan</h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Bonus</h4>
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
                          style={{marginBottom:"20px"}}
                        >
                          Tambah Bonus/Punishment
                        </button>
                      </div>
                      <div className="col-sm-2"></div>
                      <div className="col-sm-2 d-flex align-items-center">
                      <div className="input-group me-2 w-100">
                          <div className="input-group-prepend bg-transparent">
                            <span className="input-group-text border-0 bg-transparent">
                            <button
                          className="btn btn-success btn-sm"
                          onClick={exportToExcel}
                        >
                          Export to Excel
                        </button>
                            </span>
                          </div>
                          
                        </div>
                      </div>
                    </div>

                    {filteredbonus && filteredbonus.length > 0 ? (
                      <DataTable
                        keyField="bonus-id"
                        columns={columns}
                        data={filteredbonus}
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
                          {filteredbonus.length > 0 ? (
                            filteredbonus.map((row, index) => (
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
          <Modal.Title>Tambah Bonus/Punishment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div className="form-group">
            <label>Tanggal</label>
            {/* <input
              type="date"
              className="form-control"
              value={newbonus.month}
              onChange={(e) =>
                setnewbonus({ ...newbonus, month: e.target.value })
              }
            /> */}
             <DatePicker
              className="w-100"
              inputClass="form-control"
              multiple
              value={newbonus.month}
              onChange={(dates) =>
                setnewbonus({
                  ...newbonus,
                  month: dates.map((date) => date.format("YYYY-MM-DD")), // Convert ke format tanggal
                })
              }
              containerStyle={{ width: "100%" }}
            />
          </div>
          <div className="form-group">
            <label> Karyawan  (
                <span className="text-secondary text-small">
                  Kosongkan karyawan jika tujuan nya untuk Semua Karyawan
                </span>
                )</label>
                <Select
                  options={users} 
                  isMulti
                  value={selecteduser} // Nilai yang dipilih
                  onChange={handleuserChange} // Fungsi ketika berubah
                  placeholder="Pilih Karyawan..."
                  isClearable // Tambahkan tombol untuk menghapus pilihan
                />
          </div>
          
          <div className="form-group">
            <label>Kategori Bonus/Punishment</label>
            <Select
              options={typePB}
              value={
                newbonus.type_pb
                  ? {
                      value: newbonus.type_pb,
                      label: typePB.find((r) => r.value === newbonus.type_pb)
                        ?.label,
                    }
                  : null
              }
              onChange={(option) => {
                setSelectedTypePB(option);
                setnewbonus({
                  ...newbonus,
                  type_pb: option ? option.value : "",
                });
              }}
              placeholder="Pilih Kategori Bonus/Punishment"
              isClearable
            />
          </div>

          <div className="form-group">
            <label>Jumlah Bonus/Punishment  (
                <span className="text-secondary text-small">
                  isi menggunakan tanda minus (-) untuk punishment, ex (-10000)
                </span>
                )</label>
            <input
              type="number"
              className="form-control"
              value={newbonus.bonus}
              onChange={(e) =>
                setnewbonus({ ...newbonus, bonus: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Keterangan</label>
            <textarea
              type="text"
              className="form-control"
              value={newbonus.reason}
              onChange={(e) =>
                setnewbonus({ ...newbonus, reason: e.target.value })
              }
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
            onClick={handleAddbonus}
          >
            Tambah
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Bonus/Punishment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
             

              
              <div className="form-group">
                <label>Tanggal</label>
                <input
                  className="form-control"
                  type="date"
                  value={
                    selectedbonus.month
                      ? new Date(selectedbonus.month)
                          .toISOString()
                          .split("T")[0] // Format ke yyyy-MM-dd
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedbonus({
                      ...selectedbonus,
                      month: e.target.value, // Nilai langsung dari input date
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label> Karyawan  (
                <span className="text-secondary text-small">
                  Kosongkan karyawan jika tujuan nya untuk Semua Karyawan
                </span>
                )</label>
                <Select
                  options={users} 
                  isMulti
                  value={selecteduser} // Nilai yang dipilih
                  onChange={(selectedOption) => setSelecteduser(selectedOption)} // Fungsi ketika berubah
                  placeholder="Pilih Karyawan..."
                  isClearable // Tambahkan tombol untuk menghapus pilihan
                />
              </div>
              <div className="form-group">
                <label> Kageori Libur</label>
                <Select
                  options={typePB} // Data karyawan
                  value={selectedTypePB} // Nilai yang dipilih
                  onChange={handleTypePBChange} // Fungsi ketika berubah
                  placeholder="Pilih kategory Bonus/Punishment..."
                  isClearable // Tambahkan tombol untuk menghapus pilihan
                />
              </div>
              <div className="form-group">
                <label>Bonus/Punishment</label>
                <input
                  type="number"
                  className="form-control"
                  value={selectedbonus.bonus}
                  onChange={(e) =>
                    setSelectedbonus({
                      ...selectedbonus,
                      bonus: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Keterangan</label>
                <textarea
                  type="text"
                  className="form-control"
                  value={selectedbonus.reason}
                  onChange={(e) =>
                    setSelectedbonus({
                      ...selectedbonus,
                      reason: e.target.value,
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

export default Bonus;
