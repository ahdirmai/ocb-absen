import { useState,useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";
const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;
const VITE_API_URL = import.meta.env.VITE_API_URL;
const now = new Date();
const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

const Laporan = () => {
  const [laporan, setlaporan] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedlaporan, setSelectedlaporan] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [newlaporan, setnewlaporan] = useState({
    name_file: "",
    description: "",
    file_url: "",
  });
  const [filterText, setFilterText] = useState({
    name_file: "",
    month: "",
    type_pb: "",
    reason: "",
    laporan: "",

  });
  const [filePreview, setFilePreview] = useState(null);

  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);



  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
  
        // Fetch laporan data
        const laporanResponse = await axios.get(`${VITE_API_URL}/file/`, {
          headers,
        });
        const fetchedData = laporanResponse.data.data|| [];
        // const validlaporanData = laporanData.filter((item) => item && item.name);
        setlaporan(fetchedData);
  
  
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
  const downloadFile = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", url.split('/').pop()); // Menggunakan nama file dari URL
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download gagal:", error);
    }
  };

  // const filteredlaporan = laporan.filter(
  //   (item) =>
  //     item.name?.toLowerCase().includes(search.toLowerCase())
  // );

  const filteredlaporan = laporan.filter((item) =>
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
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedlaporan({ ...selectedlaporan, file_url: file });
  
      // Cek apakah file adalah gambar
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result); // Tampilkan preview jika gambar
        reader.readAsDataURL(file);
      } else {
        setFilePreview(file.name); // Hanya tampilkan nama file
      }
    }
  };

  console.log("Selected laporan:", selectedlaporan);


  

  const handleAddlaporan = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;


      const formData = new FormData();
      formData.append("name_file", newlaporan.name_file);
      formData.append("description", newlaporan.description);
      formData.append("created_by", userId);
      formData.append("created_at", DateNow);

      if (newlaporan.file_url) {
              const file = newlaporan.file_url;
      
              // Validasi ukuran dan tipe file
              if (file.size >  2 * 1024 * 1024 * 1024) {
                Swal.fire("Error", "File size exceeds 2GB!", "error");
                return;
              }
              const allowedTypes = [
                'image/jpeg', 'image/png', 'image/jpg' , // Gambar
                'video/mp4',  // Video  
                'application/pdf',  // File PDF
                'application/msword',  // File Word (.doc)
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // File Word (.docx)
                'application/vnd.ms-excel',  // File Excel (.xls)
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // File Excel (.xlsx)
                'application/zip',  // File ZIP
                'text/plain'  // File teks
              ];
              const isValidType = allowedTypes.some(type => 
                type.endsWith("/") ? file.type.startsWith(type) : file.type === type
              );
          
              if (!isValidType) {
                Swal.fire("Error", "Invalid file type. Only images, videos, PDFs, Word, Excel, ZIP, and TXT are allowed.", "error");
                return;
              }
          
      
              formData.append("file_url", file);
            }

      const response = await axios.post(
        `${VITE_API_URL}/file/upload`,
       formData,
        { 
            headers: {
                ...headers,
                "Content-Type": "multipart/form-data",
              },
        }
      );
      // Ambil data baru dari respons API
      const addedlaporan = response.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setlaporan((prev) => [
        
        {
          ...addedlaporan,
          // name: users.find((u) => u.value === addedAbsen.user_id)?.label || "", // Nama user
        //   type_pb:
        //   typePB.find((r) => r.value === addedlaporan.type_pb)?.label || "",
        //   name: Array.isArray(selecteduser) && selecteduser.length > 0
        //   ? selecteduser.map((g) => g.label).join(", ") 
        //   : "Semua Karyawan",

        },
        ...prev,
      ]);

      // setlaporan((prev) => [...prev, response.data.data]);
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalVisible(false);
      setnewlaporan({ name_file: "", description: "", file_url: ""});
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    }
  };

  const handleUpdate = (row) => {
    setSelectedlaporan(row);
    setModalVisible(true);
  };

 


  const handleDelete = async (row) => {
    Swal.fire({
      title: "Kamu Yakin ?",
      text: `Delete File Laporan ?`,
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
            `${VITE_API_URL}/file/delete-file/${row.id}`,
            {
              deleted_by: userId,
              deleted_at: DateNow,
            },
            { headers }
          );
          Swal.fire("Deleted!", `${responseDelete.data.message}`, "success");
          setlaporan((prev) =>
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


      console.log(selectedlaporan.file_url);

      const formData = new FormData();
        formData.append("name_file", selectedlaporan.name_file);
        formData.append("description", selectedlaporan.description);
        formData.append("updated_by", userId);
        formData.append("updated_at", DateNow);

        if (selectedlaporan.file_url instanceof File) {
                  const file = selectedlaporan.file_url;
        
                  // Validasi ukuran dan tipe file
                  if (file.size > 2 * 1024 * 1024 * 1024) {
                    Swal.fire("Error", "File size exceeds 2GB!", "error");
                    return;
                  }
        
                  const allowedTypes = [
                    'image/jpeg', 'image/png', 'image/jpg' , // Gambar
                    'video/mp4',  // Video  
                    'application/pdf',  // File PDF
                    'application/msword',  // File Word (.doc)
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // File Word (.docx)
                    'application/vnd.ms-excel',  // File Excel (.xls)
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // File Excel (.xlsx)
                    'application/zip',  // File ZIP
                    'text/plain'  // File teks
                  ];
                  const isValidType = allowedTypes.some(type => 
                    type.endsWith("/") ? file.type.startsWith(type) : file.type === type
                  );
              
                  if (!isValidType) {
                    Swal.fire("Error", "Invalid file type. Only images, videos, PDFs, Word, Excel, ZIP, and TXT are allowed.", "error");
                    return;
                  }
        
                  formData.append("file_url", file);
                }
                else {
                  formData.append("file_url", selectedlaporan.file_url);
                }

                const responseUpdate = await axios.post(
                    `${VITE_API_URL}/file/update-file/${selectedlaporan.id}`,
                    formData,
                    {
                      headers: {
                        ...headers,
                        "Content-Type": "multipart/form-data",
                      },
                    }
                  );
                  
                  // Pastikan kita dapat URL yang benar dari response backend
                  const updatedFileUrl = responseUpdate.data.data?.file_url || responseUpdate.data.file_url;
                  const updatedAt = responseUpdate.data.data?.updated_at || responseUpdate.data.updated_at;

                  setlaporan((prevlaporan) =>
                    prevlaporan.map((item) =>
                      item.id === selectedlaporan.id
                        ? { ...item, 
                            file_url: updatedFileUrl,
                            updated_at: updatedAt } // Update hanya file_url
                        : item
                    )
                  );
                  
                  // Pastikan selectedlaporan ikut diperbarui
                  setSelectedlaporan((prev) => ({
                    ...prev,
                    file_url: updatedFileUrl,
                    updated_at: updatedAt,
                  }));
                  
      // setlaporan(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      // setlaporan((prev) =>
      //   prev.map((item) =>
      //     item.absen_id === selectedlaporan.absen_id ? selectedlaporan : item
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
        <span style={{ marginBottom: "6px" }}>Judul</span>
        <input
          type="text"
          value={filterText.name_file}
          className="form-control mt-1 filter-header"
          ref={(el) => (inputRefs.current.name_file = el)}
          onChange={(e) => handleInputChange("name_file", e.target.value)}
          onFocus={() => setActiveInput('name_file')} // Set active input
        />
      </div>
    ), selector: (row) => row.name_file },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Deksripsi File</span>
          <input
            type="text"
            value={filterText.description}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.description = el)}
            onChange={(e) => handleInputChange("description", e.target.value)}
            onFocus={() => setActiveInput('description')} // Set active input
          />
        </div>
      ),
      selector: (row) => row.description,
    },
    {
        name: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ marginBottom: "6px" }}>File</span>
            <input
              type="text"
              disabled
              value={filterText.file_url}
              className="form-control mt-1 filter-header"
              ref={(el) => (inputRefs.current.file_url = el)}
              onChange={(e) => handleInputChange("file_url", e.target.value)}
              onFocus={() => setActiveInput('file_url')} // Set active input
            />
          </div>
        ), 
        selector: (row) => row.file_url,
        cell: (row) => (
            <button type ="button" className="btn btn-sm btn-outline-info btn-icon-text"
    onClick={() => downloadFile(`${VITE_API_IMAGE}${row.file_url}`)}
    
  ><i className="mdi mdi-download btn-icon-prepend"></i>
    Download File
  </button>
        )
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Tanggal Upload</span>
          <input
            type="text"
            value={filterText.created_at}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.created_at = el)}
            onChange={(e) => handleInputChange("created_at", e.target.value)}
            onFocus={() => setActiveInput('created_at')} // Set active input
          />
        </div>
      ), selector: (row) => 
         
        format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ss"),
    },
    // { 
    //   name: (
    //     <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    //       <span style={{ marginBottom: "6px" }}>di Upload Oleh </span>
    //       <input
    //         type="text"
    //         value={filterText.upload_by}
    //         className="form-control mt-1 filter-header"
    //         ref={(el) => (inputRefs.current.upload_by = el)}
    //         onChange={(e) => handleInputChange("upload_by", e.target.value)}
    //         onFocus={() => setActiveInput('upload_by')} // Set active input
    //       />
    //     </div>
    //   ), selector: (row) => row.upload_by },
      { 
        name: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ marginBottom: "6px" }}>Tanggal Edit</span>
            <input
              type="text"
              value={filterText.updated_at}
              className="form-control mt-1 filter-header"
              ref={(el) => (inputRefs.current.updated_at = el)}
              onChange={(e) => handleInputChange("updated_at", e.target.value)}
              onFocus={() => setActiveInput('updated_at')} // Set active input
            />
          </div>
        ), selector: (row) => row.updated_at ?format(new Date(row.updated_at), "yyyy-MM-dd HH:mm:ss") : "-",
            
        },
    //   { 
    //     name: (
    //       <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    //         <span style={{ marginBottom: "6px" }}>di Edit Oleh </span>
    //         <input
    //           type="text"
    //           value={filterText.edit_by}
    //           className="form-control mt-1 filter-header"
    //           ref={(el) => (inputRefs.current.edit_by = el)}
    //           onChange={(e) => handleInputChange("edit_by", e.target.value)}
    //           onFocus={() => setActiveInput('edit_by')} // Set active input
    //         />
    //       </div>
    //     ), selector: (row) => row.edit_by?row.edit_by:"-" },

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
        <h3 className="page-title">Management File Laporan</h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Upload File</h4>
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
                          Upload File
                        </button>
                      </div>
                      <div className="col-sm-4 d-flex align-items-center">
                      <div className="input-group me-2 w-100">
                          <div className="input-group-prepend bg-transparent">
                            <span className="input-group-text border-0 bg-transparent">
                             
                            </span>
                          </div>
                          
                        </div>
                      </div>
                    </div>

                    {filteredlaporan && filteredlaporan.length > 0 ? (
                      <DataTable
                        keyField="laporan-id"
                        columns={columns}
                        data={filteredlaporan}
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
                          {filteredlaporan.length > 0 ? (
                            filteredlaporan.map((row, index) => (
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
          <Modal.Title>Upload File Laporan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div className="form-group">
            <label>Judul File</label>
            <input
              type="text"
              className="form-control"
              value={newlaporan.name_file}
              onChange={(e) =>
                setnewlaporan({ ...newlaporan, name_file: e.target.value })
              }
            />
          </div>
          
          <div className="form-group">
            <label>Deskripsi File </label>
            <input
              type="text"
              className="form-control"
              value={newlaporan.description}
              onChange={(e) =>
                setnewlaporan({ ...newlaporan, description: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>File</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.docx,.zip,.txt,.xls,.xlsx"
              className="form-control"
              value={newlaporan.reason}
              onChange={(e) =>
                setnewlaporan({ ...newlaporan, file_url: e.target.files[0] })
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
            onClick={handleAddlaporan}
          >
            Tambah
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
             

              
              <div className="form-group">
                <label>Judul File</label>
                <input
                  className="form-control"
                  type="text"
                  value={
                    selectedlaporan.name_file||""
                  }
                  onChange={(e) =>
                    setSelectedlaporan({
                      ...selectedlaporan,
                      name_file: e.target.value, // Nilai langsung dari input date
                    })
                  }
                />
              </div>
            
             
             
              <div className="form-group">
                <label>Deskripsi File</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedlaporan.description}
                  onChange={(e) =>
                    setSelectedlaporan({
                      ...selectedlaporan,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
  <label>Upload File</label>

  {/* Preview File - Menampilkan Nama File Existing */}
  {selectedlaporan?.file_url ? (
    <div style={{ marginBottom: "10px" }}>
      {/* Cek apakah selectedlaporan.file_url adalah File Object atau URL */}
      {selectedlaporan.file_url instanceof File ? (
        // Jika file_url adalah objek file, tampilkan nama file
        <p>File Name: {selectedlaporan.file_url.name}</p>
      ) : (
        // Jika file_url adalah URL (string), tampilkan nama file dari URL
        <p>File Name: {selectedlaporan.file_url.split('/').pop()}</p>
      )}
    </div>
  ) : (
    <p>No file selected</p>
  )}

  {/* Input File */}
  <input
    type="file"
    accept=".jpg,.jpeg,.png,.pdf,.docx,.zip,.txt,.xls,.xlsx"
    className="form-control"
    onChange={handleFileChange}
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

export default Laporan;
