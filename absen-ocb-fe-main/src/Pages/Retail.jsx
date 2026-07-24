import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";

const VITE_API_URL = import.meta.env.VITE_API_URL;
const now = new Date();
const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

const Retail = () => {
  const [retails, setRetails] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRetail, setSelectedRetail] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false); // Modal untuk tambah user baru
  const [newRetail, setNewRetail] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: "",
    is_active: 1,
  });

  useEffect(() => {
    const fetchRetails = async () => {
      setLoading(true);
      try {
        
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${VITE_API_URL}/retail`, { headers });
        const fetchedData = response.data.data || [];
        const validData = fetchedData.filter((item) => item && item.name);
        setRetails(validData);
        
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRetails();
  }, []);

  const filteredRetail= retails.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userData = JSON.parse(sessionStorage.getItem("userData"));
      const userId = userData?.id;

      const response = await axios.post(
        `${VITE_API_URL}/retail/create`,
        {
          ...newRetail,
          created_by: userId,
          created_at: DateNow,
        },
        { headers }
      );

      setRetails((prev) => [ response.data.data, ...prev,]);
      Swal.fire("Success!", `${response.data.message}`, "success");
      setAddModalVisible(false);
      setNewRetail({ name: "", latitude: "", longitude: "", radius: "", is_active: 1 });
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    }
  };

  const handleUpdate = (row) => {
    setSelectedRetail(row);
    console.log(selectedRetail);
    setModalVisible(true);
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
          const userData = JSON.parse(sessionStorage.getItem("userData"));
          const userId = userData?.id;
          const headers = { Authorization: `Bearer ${token}` };
          const responseDelete = await axios.post(`${VITE_API_URL}/retail/delete/${row.retail_id}`,
            {
              deleted_by : userId,
              deleted_at: DateNow
            }, { headers });
          Swal.fire("Deleted!", `${responseDelete.data.message}`, "success");
          setRetails((prev) => prev.filter((item) => item.retail_id !== row.retail_id));
        } catch (error) {
          Swal.fire("Error!", error.response?.data?.message || error.message, "error");
        }
      }
    });
  };

  

  const handleSaveUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userData = JSON.parse(sessionStorage.getItem("userData"));
      const userId = userData?.id;
      const responseUpdate = await axios.post(
        `${VITE_API_URL}/retail/update/${selectedRetail.retail_id}`,
        {
          name: selectedRetail.name,
          latitude: selectedRetail.latitude,
          longitude: selectedRetail.longitude,
          radius: selectedRetail.radius,
          is_active: selectedRetail.is_active,
          updated_by : userId,
          updated_at: DateNow

        },
        { headers }
      );
      // setRetails(responseUpdate.data.data);
      Swal.fire("Updated!", `${responseUpdate.data.message}`, "success");
      setRetails((prev) =>
        prev.map((item) =>
          item.retail_id === selectedRetail.retail_id ? selectedRetail : item
        )
      );
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
    { name: "Nama Retail", selector: (row) => row.name },
    { name: "Latitude", selector: (row) => row.latitude },
    { name: "Longitude", selector: (row) => row.longitude },
    { name: "Radius(m)", selector: (row) => row.radius },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`badge ${
            row.is_active ? "badge-success" : "badge-danger"
          }`}
        >
          {row.is_active ? "Active" : "Non Active"}
        </span>
      ),
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
    }
  ];

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Data Retails</h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Retail / Outlet</h4>
              <div className="">
              {loading ? (
                  <p>Loading data...</p>
                ) : error ? (
                  <p className="text-danger">Error: {error}</p>
                ) : (
                  <>
                <div className="row">
                  <div className="col-sm-8">
                  <button className="btn btn-gradient-primary btn-sm"
                          onClick={() => setAddModalVisible(true)}
                        >
                  Tambah Retail
                </button>
                  </div>
                  <div className="col-sm-4">
                        <div className="input-group">
                          <div className="input-group-prepend bg-transparent">
                            <i className="input-group-text border-0 mdi mdi-magnify" style={{margin: "10px",}}></i>
                          </div>
                          <input
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
                          />
                        </div>
                      </div>
                </div>
                  
                    
                    {filteredRetail && filteredRetail.length > 0 ? (
                      <DataTable
                        keyField="retail_id"
                        columns={columns}
                        data={filteredRetail}
                        pagination
                      />
                    ) : (
                      <p>No retail data available.</p>
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
          <Modal.Title>Form Tambah Retail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>Nama Retail</label>
            <input
              type="text"
              className="form-control"
              value={newRetail.name}
              onChange={(e) => setNewRetail({ ...newRetail, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Latitude</label>
            <input
              type="text"
              className="form-control"
              value={newRetail.latitude}
              onChange={(e) => setNewRetail({ ...newRetail, latitude: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Longitude</label>
            <input
              type="text"
              className="form-control"
              value={newRetail.longitude}
              onChange={(e) => setNewRetail({ ...newRetail, longitude: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Radius</label>
            <input
              type="number"
              className="form-control"
              value={newRetail.radius}
              onChange={(e) => setNewRetail({ ...newRetail, radius: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              className="form-select"
              value={newRetail.is_active}
              onChange={(e) =>
                setNewRetail({ ...newRetail, is_active: e.target.value === "1" ? 1 : 0 })
              }
            >
              <option value="1">Active</option>
              <option value="0">Non Active</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn btn-light" onClick={() => setAddModalVisible(false)}>
            Close
          </Button>
          <Button className="btn btn-gradient-primary me-2" onClick={handleAddUser}>
            Tambah Retail
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Form Edit Retail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div className="card">
            <div className="card-body">
             
              <form className="forms-sample">
                <div className="form-group">
                  <label>Nama retail</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedRetail.name || ""}
                    onChange={(e) => 
                      setSelectedRetail({
                        ...selectedRetail,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    className="form-control"
                    type="text"
                    value={selectedRetail.latitude || ""}
                    onChange={(e) =>
                      setSelectedRetail({
                        ...selectedRetail,
                        latitude: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    className="form-control"
                    type="text"
                    value={selectedRetail.longitude || ""}
                    onChange={(e) =>
                      setSelectedRetail({
                        ...selectedRetail,
                        longitude: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label> Radius</label>
                  <input
                    className="form-control"
                    type="text"
                    value={selectedRetail.radius || ""}
                    onChange={(e) =>
                      setSelectedRetail({
                        ...selectedRetail,
                        radius: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-select"
                    value={selectedRetail.is_active ? "1" : "0"}
                    onChange={(e) =>
                      setSelectedRetail({
                        ...selectedRetail,
                        is_active: e.target.value === "1" ? 1 : 0,
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
          <Button className="btn btn-light" onClick={() => setModalVisible(false)}>
            Close
          </Button>
          <Button className="btn btn-gradient-primary me-2" onClick={handleSaveUpdate}>
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Retail;
