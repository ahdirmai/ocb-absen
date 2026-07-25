import { useState,useRef, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
const VITE_API_URL = import.meta.env.VITE_API_URL;
const VITE_API_IMAGE = import.meta.env.VITE_API_IMAGE;
import Swal from "sweetalert2";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Tooltip } from "react-tooltip";
// const now = new Date();
// const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

const Absensi = () => {
  const [Absensies, setAbsensies] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImageAbsensi, setSelectedImageAbsensi] = useState(null);
  const [isModalOpenAbsensi, setIsModalOpenAbsensi] = useState(false);
  const [selectedKoreksi, setSelectedKoreksi] = useState(null);
  const [koreksiModalVisible, setKoreksiModalVisible] = useState(false);
  const [savingKoreksi, setSavingKoreksi] = useState(false);
  const [startDate, setStartDate] = useState(""); // Tanggal mulai
  const [endDate, setEndDate] = useState(""); // Tanggal akhir
  const [filterText, setFilterText] = useState({
    nama_karyawan: "",
    retail_name: "",
    category_absen: "",
    description: "",
    absen_time: "",
    fee: "",
    reason:""
  

  });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);
  

  

  const fetchAbsensies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);


      const response = await axios.get(`${VITE_API_URL}/absensi/history?${params.toString()}`, {
        headers,
      });
      const fetchedData = response.data.data || [];

      setAbsensies(fetchedData);

      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsensies();
  }, []);


  const handleFilter = () => {
    fetchAbsensies();
  };


  const filteredAbsensi = Absensies.filter((item) =>
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
  

  const handleImageAbsensiClick = (imageUrl) => {
    setSelectedImageAbsensi(imageUrl);
    setIsModalOpenAbsensi(true);
  };

  const closeAbsensiModal = () => {
    setSelectedImageAbsensi(null);
    setIsModalOpenAbsensi(false);
  };

  const handleValidasi = async (row) => {
    let is_valid = "";
    let text = "";
    if (row.is_valid === 1) {
      is_valid = 0;
      text = "Invalidkan Absensi Ini ?";
    } else {
      is_valid = 1;
      text = "validasi Absensi Ini ?";
    }
    Swal.fire({
      title: "Are you sure?",
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes!!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const responseValidasi = await axios.post(
            `${VITE_API_URL}/absensi/validasi/${row.absensi_id}`,
            {
              is_valid: is_valid,
            },
            { headers }
          );
          Swal.fire("Updated!", `${responseValidasi.data.message}`, "success");
          setAbsensies((prev) =>
            prev.map((item) =>
              item.absensi_id === row.absensi_id ? { ...item, is_valid } : item
            )
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

  const handleIgnore = async (row) => {
    Swal.fire({
      title: "Ignore absen ini?",
      text: `Absen ${row.nama_karyawan} akan diabaikan (ditolak) dan karyawan bisa absen ulang.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, ignore",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.post(
          `${VITE_API_URL}/absensi/reject-absensi/${row.absensi_id}`,
          {},
          { headers }
        );
        Swal.fire("Diabaikan!", `${res.data.message}`, "success");
        setAbsensies((prev) =>
          prev.map((item) =>
            item.absensi_id === row.absensi_id
              ? { ...item, is_valid: 0, status_approval: "rejected" }
              : item
          )
        );
      } catch (error) {
        Swal.fire("Error!", error.response?.data?.message || error.message, "error");
      }
    });
  };

  // Buka modal koreksi: prefill jam (datetime-local), status, catatan.
  const handleKoreksi = (row) => {
    setSelectedKoreksi({
      absensi_id: row.absensi_id,
      nama_karyawan: row.nama_karyawan,
      category_absen: row.category_absen,
      // datetime-local butuh "yyyy-MM-dd'T'HH:mm".
      absen_time_local: row.absen_time
        ? format(new Date(row.absen_time), "yyyy-MM-dd'T'HH:mm")
        : "",
      status_absen: String(row.status_absen ?? ""),
      reason: row.reason || "",
    });
    setKoreksiModalVisible(true);
  };

  const handleSaveKoreksi = async () => {
    if (!selectedKoreksi?.absen_time_local) {
      Swal.fire("Error", "Waktu absen wajib diisi.", "error");
      return;
    }
    setSavingKoreksi(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      // datetime-local "yyyy-MM-ddTHH:mm" → "yyyy-MM-dd HH:mm:ss" untuk BE.
      const absen_time = format(
        new Date(selectedKoreksi.absen_time_local),
        "yyyy-MM-dd HH:mm:ss"
      );
      const payload = {
        absen_time,
        reason: selectedKoreksi.reason,
      };
      // status_absen opsional: kirim hanya bila admin set eksplisit (1/2).
      if (selectedKoreksi.status_absen === "1" || selectedKoreksi.status_absen === "2") {
        payload.status_absen = Number(selectedKoreksi.status_absen);
      }

      const res = await axios.post(
        `${VITE_API_URL}/absensi/koreksi/${selectedKoreksi.absensi_id}`,
        payload,
        { headers }
      );

      const updated = res.data.data;
      setAbsensies((prev) =>
        prev.map((item) =>
          item.absensi_id === selectedKoreksi.absensi_id
            ? {
                ...item,
                absen_time: updated.absen_time,
                status_absen: updated.status_absen,
                reason: updated.reason,
              }
            : item
        )
      );
      Swal.fire("Berhasil!", res.data.message || "Koreksi tersimpan.", "success");
      setKoreksiModalVisible(false);
      setSelectedKoreksi(null);
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingKoreksi(false);
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
     
      selector: (row) => row.nama_karyawan,
      cell: (row) => row.nama_karyawan,
      // Header dengan input filter
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Nama Karyawan</span>
          <input
            type="text"
            value={filterText.nama_karyawan}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.nama_karyawan = el)}
            onChange={(e) => handleInputChange("nama_karyawan", e.target.value)}
            onFocus={() => setActiveInput('nama_karyawan')} // Set active input
          />
        </div>
      ),
    },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Retail/Outlet</span>
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
      selector: (row) => row.retail_name,
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Code Absen</span>
          <input
            type="text"
            value={filterText.category_absen}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.category_absen = el)}
            onChange={(e) => handleInputChange("category_absen", e.target.value)}
            onFocus={() => setActiveInput('category_absen')} // Set active input
          />
        </div>
      ),
      selector: (row) => row.category_absen },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Waktu Absen</span>
          <input
            type="text"
            value={filterText.absen_time}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.absen_time = el)}
            onChange={(e) => handleInputChange("absen_time", e.target.value)}
            onFocus={() => setActiveInput('absen_time')} // Set active input
          />
        </div>
      ),
      selector: (row) =>
        format(new Date(row.absen_time), "yyyy-MM-dd HH:mm:ss"),
      wrap: true,
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Deskripsi</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            value={filterText.description}
            ref={(el) => (inputRefs.current.description = el)}
            onChange={(e) => handleInputChange("description", e.target.value)}
            onFocus={() => setActiveInput('description')} // Set active input
          />
        </div>
      ),
      
      
      selector: (row) => row.description,
      cell: (row) => (
        <span>
          {row.description || "-"}
          {(row.is_lembur === 1 || row.is_lembur === "1") && (
            <span className="badge bg-warning text-dark" style={{ marginLeft: "6px", fontSize: "10px" }}>
              Lembur
            </span>
          )}
        </span>
      ),
    },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Fee</span>
          <input
            type="text"
            value={filterText.fee}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.fee = el)}
            onChange={(e) => handleInputChange("fee", e.target.value)}
            onFocus={() => setActiveInput('fee')} // Set active input
           
          />
        </div>
      ),
      selector: (row) => row.fee },

      { name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Catatan Karyawan</span>
          <input
            type="text"
            value={filterText.reason}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.reason = el)}
            onChange={(e) => handleInputChange("reason", e.target.value)}
            onFocus={() => setActiveInput('reason')} // Set active input
          />
        </div>
      ), 
      cell: (row) => {
        // Format teks tooltip: setiap 2 kata setelah koma, masuk ke baris baru
        const formattedText = row.reason;
  
        return (
          <div>
            <span data-tooltip-id={`tooltip-${row.reason}`}>
              {row.reason.length > 30
                ? row.reason.substring(0, 25) + "..."
                : row.reason}
            </span>
            <Tooltip
              id={`tooltip-${row.reason}`}
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
      },selector: (row) => row.reason },
    {
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",  }}>
          <span style={{ marginBottom: "6px" }}>Photo/Video</span>
          <input
            type="text"
            className="form-control mt-1 filter-header"
            disabled
          />
        </div>
      ),
      cell: (row) => (
        <div >
          {row?.photo_url &&
          (row.photo_url.endsWith(".mp4") ||
            row.photo_url.endsWith(".webm")) ? (
            <video
              src={`${VITE_API_IMAGE}${row.photo_url}`}
              alt="Video Preview"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "10%",
                cursor: "pointer",
                objectFit: "cover",
              }}
              onClick={() =>
                handleImageAbsensiClick(`${VITE_API_IMAGE}${row.photo_url}`)
              }
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={
                row?.photo_url
                  ? `${VITE_API_IMAGE}${row.photo_url}`
                  : "/absen.jpg"
              }
              alt="Profile"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "10%",
                cursor: "pointer",
                objectFit: "cover",
              }}
              onClick={() =>
                handleImageAbsensiClick(
                  row?.photo_url
                    ? `${VITE_API_IMAGE}${row.photo_url}`
                    : "/absen.jpg"
                )
              }
            />
          )}
        </div>
      ),
    },
    {
      name: (
        <span style={{ marginBottom: "45px" }}>Status</span>
      ),
      cell: (row) => (
        <button
          className={`btn btn-sm ${
            row.is_valid ? "btn-gradient-success" : "btn-gradient-danger"
          }`}
          onClick={() => {
            handleValidasi(row);
          }}
        >
          {row.is_valid ? "Valid" : "Invalid"}
        </button>
      ),
    },
    {
      name: (
        <span style={{ marginBottom: "45px" }}>Ignore</span>
      ),
      cell: (row) =>
        String(row.status_approval).toLowerCase().includes("tolak") ||
        String(row.status_approval).toLowerCase().includes("reject") ||
        String(row.status_approval) === "3" ? (
          <span className="badge bg-secondary">Diabaikan</span>
        ) : (
          <button
            className="btn btn-sm btn-gradient-warning"
            onClick={() => handleIgnore(row)}
            title="Abaikan absen, karyawan bisa absen ulang"
          >
            Ignore
          </button>
        ),
    },
    {
      name: (
        <span style={{ marginBottom: "45px" }}>Koreksi</span>
      ),
      cell: (row) => (
        <button
          className="btn btn-sm btn-gradient-info"
          onClick={() => handleKoreksi(row)}
          title="Koreksi jam / status / catatan absen"
        >
          Koreksi
        </button>
      ),
    },
  ];

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

    const exportToExcel = () => {
      const data = filteredAbsensi.map((row, index) => ({
        "No": index + 1,
        "Nama Karyawan": row.nama_karyawan,
        "Retail / Outlet": row.retail_name,
        "Code Absen": row.category_absen,
        "Waktu Absen": format(new Date(row.absen_time), "yyyy-MM-dd HH:mm:ss"),
        "Deskripsi Absen": row.description,
        "Fee": row.fee,
        "Status": row.is_valid ? "Valid" : "Invalid",
        "Lembur": (row.is_lembur === 1 || row.is_lembur === "1") ? "Ya" : "Tidak",
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi Data");
  
      const dateNow = new Date().toISOString().split("T")[0]; // Current date
      XLSX.writeFile(workbook, `Absensi_Data_${dateNow}.xlsx`);
    };
  
 

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Data Absensi</h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Absensi</h4>
              <div className="">
                {loading ? (
                  <p>Loading data...</p>
                ) : error ? (
                  <p className="text-danger">Error: {error}</p>
                ) : (
                  <>
                    {/* <div className="row"> */}
                    <div className="row mb-5">
                      <div className="col-md-3 d-flex align-items-end">
                        <div className="me-2 w-100">
                          <label htmlFor="startDate">Start Date:</label>
                          <input
                            id="startDate"
                            type="date"
                            className="form-control filter-header"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3 d-flex align-items-end">
                        <div className="me-2 w-100">
                          <label htmlFor="endDate">End Date:</label>
                          <input
                            id="endDate"
                            type="date"
                            className="form-control filter-header"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                        <button
                          className="btn btn-sm btn-gradient-info mb-2"
                          onClick={handleFilter}
                        >
                          Filter
                        </button>
                      </div>

                      <div className="col-sm-4 d-flex align-items-center"></div>
                      <div className="col-sm-4 d-flex align-items-center">
                        {/* <div className="input-group me-2 w-100">
                          <div className="input-group-prepend bg-transparent">
                            <span className="input-group-text border-0 bg-transparent">
                              <i className="mdi mdi-magnify"></i>
                            </span>
                          </div>
                          <input
                            className="form-control bg-transparent border-0"
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </div> */}
                         <button
                          className="btn btn-success btn-sm"
                          onClick={exportToExcel}
                        >
                          Export to Excel
                        </button>
                      </div>
                    </div>

                    {filteredAbsensi && filteredAbsensi.length > 0 ? (
                      <DataTable
                        keyField="Absensi_id"
                        columns={columns}
                        data={filteredAbsensi}
                        customStyles={{
                          rows: {
                            style: {
                              animation: "fadeIn 0.5s ease-in-out",
                            },
                          },
                        }}
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
                          {filteredAbsensi.length > 0 ? (
                            filteredAbsensi.map((row, index) => (
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
      {isModalOpenAbsensi && (
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
          onClick={closeAbsensiModal}
        >
          {selectedImageAbsensi && selectedImageAbsensi.endsWith(".mp4") ? (
            <video
              controls
              style={{
                maxWidth: "60%",
                maxHeight: "60%",
                borderRadius: "10px",
              }}
              onClick={(e) => e.stopPropagation()} // Prevent close on video click
            >
              <source src={selectedImageAbsensi} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={selectedImageAbsensi}
              alt="Preview"
              style={{
                maxWidth: "60%",
                maxHeight: "60%",
                borderRadius: "10px",
              }}
              onClick={(e) => e.stopPropagation()} // Prevent close on image click
            />
          )}
        </div>
      )}

      {koreksiModalVisible && selectedKoreksi && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setKoreksiModalVisible(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "20px",
              width: "420px",
              maxWidth: "92%",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 style={{ marginTop: 0, marginBottom: "4px" }}>Koreksi Absen</h5>
            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#666" }}>
              {selectedKoreksi.nama_karyawan} — {selectedKoreksi.category_absen}
            </p>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>Waktu Absen</label>
              <input
                type="datetime-local"
                className="form-control"
                value={selectedKoreksi.absen_time_local}
                onChange={(e) =>
                  setSelectedKoreksi({
                    ...selectedKoreksi,
                    absen_time_local: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group" style={{ marginBottom: "12px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>
                Status{" "}
                <span style={{ fontWeight: 400, color: "#888" }}>
                  (kosongkan = hitung otomatis dari jam)
                </span>
              </label>
              <select
                className="form-control"
                value={selectedKoreksi.status_absen}
                onChange={(e) =>
                  setSelectedKoreksi({
                    ...selectedKoreksi,
                    status_absen: e.target.value,
                  })
                }
              >
                <option value="">Otomatis (dari jam)</option>
                <option value="1">Ontime</option>
                <option value="2">Telat</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: 600, fontSize: "13px" }}>Catatan</label>
              <textarea
                className="form-control"
                rows={3}
                value={selectedKoreksi.reason}
                onChange={(e) =>
                  setSelectedKoreksi({
                    ...selectedKoreksi,
                    reason: e.target.value,
                  })
                }
                placeholder="Catatan koreksi..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                className="btn btn-light"
                onClick={() => setKoreksiModalVisible(false)}
                disabled={savingKoreksi}
              >
                Batal
              </button>
              <button
                className="btn btn-gradient-primary"
                onClick={handleSaveKoreksi}
                disabled={savingKoreksi}
              >
                {savingKoreksi ? "Menyimpan..." : "Simpan Koreksi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Absensi;
