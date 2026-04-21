import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { format } from "date-fns";

const now = new Date();
const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");

const VITE_API_URL = import.meta.env.VITE_API_URL;

const Potongan = () => {
  const [potongans, setpotongans] = useState([]);
  const [selectedpotongans, setselectedpotongans] = useState({});
  const [error, setError] = useState(null);
  
  const [modalUpdatepotongan, setModalUpdatepotongan] = useState(false);
 



  useEffect(() => {
    const fetchPotongan = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${VITE_API_URL}/management/potongan`, {
          headers,
        });
        setpotongans(response.data.data);

       
      } catch (error) {
        setError(error.message);
        console.error("Error fetching users:", error);
      }
    };

    fetchPotongan();
  }, []);

  const handleUpdatepotongan = (potongan) => {
    setselectedpotongans(potongan);
    setModalUpdatepotongan(true);
  };

  const handleSaveUpdatepotongan = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const userProfile = sessionStorage.getItem("userProfile");
      const userData = JSON.parse(userProfile); // Parse JSON
      const userId = userData[0]?.user_id;
      const responseUpdate = await axios.post(
        `${VITE_API_URL}/management/update-potongan/${selectedpotongans.id}`,
        {
          value : selectedpotongans.value,
          updated_by: userId,
          updated_at: DateNow,
        },
        { headers }
      );
      //const updatedAbsen = responseUpdate.data.data;

      // Tambahkan data baru ke state dengan format yang sesuai tabel
      setpotongans((prevpotongan) =>
        prevpotongan.map((item) =>
          item.id === selectedpotongans.id
            ? {
                ...selectedpotongans,
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
      setModalUpdatepotongan(false);
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
        <h3 className="page-title"> Data Potongan </h3>
      </div>
      <div className="row">
        <div className="col-lg-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Potongan</h4>
              {/* <p className="card-description"> Add User </p> */}
              <div className="card-description">
                
              </div>

              <div className="table-responsive">
                {error ? (
                  <p>Terjadi kesalahan: {error}</p>
                ) : (
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th> # </th>
                        <th> Katgori Potongan </th>
                        <th> Jumlah Potongan </th>
                        <th> Keterangan </th>
                        <th> Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {potongans.length > 0 ? (
                        potongans.map((potongan, index) => (
                          <tr key={potongan.potongan_id}>
                            <td>{index + 1}</td>
                            <td>{potongan.category}</td>
                            <td>{potongan.value}</td>
                            <td>{potongan.keterangan}</td>
                            <td
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <button
                                className="btn btn-gradient-warning btn-sm"
                                onClick={() => handleUpdatepotongan(potongan)}
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

      
      </div>
      <Modal show={modalUpdatepotongan} onHide={() => setModalUpdatepotongan(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Potongan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label>Kategori Potongan </label>
                <input
                  className="form-control"
                  type="text"
                  disabled
                  value={selectedpotongans.category}
                  onChange={(e) =>
                    setselectedpotongans({
                      ...selectedpotongans,
                      category: e.target.value, // Nilai langsung dari input date
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Jumlah Potongan </label>
                <input
                  className="form-control"
                  type="text"
                  value={selectedpotongans.value}
                  onChange={(e) =>
                    setselectedpotongans({
                      ...selectedpotongans,
                      value: e.target.value, // Nilai langsung dari input date
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
            onClick={() => setModalUpdatepotongan(false)}
          >
            Close
          </Button>
          <Button
            className="btn btn-gradient-primary me-2"
            onClick={handleSaveUpdatepotongan}
          >
            Simpan Perubahan
          </Button>
        </Modal.Footer>
      </Modal>






    </div>
  );
};

export default Potongan;
