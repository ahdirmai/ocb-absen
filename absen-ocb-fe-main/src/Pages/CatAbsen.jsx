import { useState, useRef, useEffect } from "react";
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

const CatAbsen = () => {
  const [catabsen, setcatabsen] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
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
        console.log(formattedData);

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
      });
      setSelectedGroup([]);
      setSelectedKatTime(null);
    } catch (error) {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
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

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Data Tipe Absen</h3>
      </div>
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
          >
            Tambah Tipe Absen
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Tipe Absen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label>kategori Absen</label>
                <input
                  type="text"
                  className="form-control"
                  value={selectedCatabsen.name || ""}
                  onChange={(e) =>
                    setSelectedCatabsen({
                      ...selectedCatabsen,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  className="form-control"
                  type="text"
                  value={selectedCatabsen.description || ""}
                  onChange={(e) =>
                    setSelectedCatabsen({
                      ...selectedCatabsen,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Fee</label>
                <input
                  className="form-control"
                  type="number"
                  value={selectedCatabsen.fee || ""}
                  onChange={(e) =>
                    setSelectedCatabsen({
                      ...selectedCatabsen,
                      fee: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={selectedCatabsen.start_time}
                  onChange={(e) =>
                    setSelectedCatabsen({
                      ...selectedCatabsen,
                      start_time: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={selectedCatabsen.end_time}
                  onChange={(e) =>
                    setSelectedCatabsen({
                      ...selectedCatabsen,
                      end_time: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Kategori Time</label>
                <Select
                  options={KatTime}
                  value={selectedKatTime}
                  onChange={(selected) => setSelectedKatTime(selected)}
                  placeholder="Pilih Kategori Time..."
                  isClearable
                />
              </div>

              <div className="form-group">
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
                  onChange={(selected) => setSelectedGroup(selected)}
                  placeholder="Pilih Group Absen..."
                  isClearable
                />
              </div>
              {/*           
          <div className="form-group">
                  <label> Group User/ Category</label>
                  <Select
                    options={groups} // Data karyawan
                    value={selectedGroup} // Nilai yang dipilih
                    onChange={handleGroupChange} // Fungsi ketika berubah
                    placeholder="Pilih group Category..."
                    isClearable // Tambahkan tombol untuk menghapus pilihan
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

export default CatAbsen;
