import { useState, useEffect } from "react";
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
const currentMonth = format(now, "yyyy-MM");

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const getUserId = () => {
  try {
    const userData = JSON.parse(sessionStorage.getItem("userProfile"));
    return userData?.[0]?.user_id;
  } catch {
    return undefined;
  }
};

const JadwalHarian = () => {
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(currentMonth);

  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [retails, setRetails] = useState([]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRetail, setSelectedRetail] = useState(null);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchJadwal = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${VITE_API_URL}/jadwal-harian?month=${month}`,
        { headers: authHeaders() }
      );
      setJadwal(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [usersRes, retailRes] = await Promise.all([
          axios.get(`${VITE_API_URL}/jadwal-harian/eligible-users`, {
            headers: authHeaders(),
          }),
          axios.get(`${VITE_API_URL}/retail`, { headers: authHeaders() }),
        ]);

        setEligibleUsers(
          (usersRes.data.data || []).map((u) => ({
            value: u.user_id,
            label: u.name,
          }))
        );
        setRetails(
          (retailRes.data.data || []).map((r) => ({
            value: r.retail_id,
            label: r.name,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch selects:", error);
      }
    };
    fetchSelects();
  }, []);

  const handleRetailChange = async (option) => {
    setSelectedRetail(option);
    setSelectedKategori(null);
    setKategoriOptions([]);
    if (!option) return;
    try {
      const res = await axios.get(
        `${VITE_API_URL}/jadwal-harian/kategori/${option.value}`,
        { headers: authHeaders() }
      );
      setKategoriOptions(
        (res.data.data || []).map((k) => ({ value: k, label: k }))
      );
    } catch (error) {
      console.error("Failed to fetch kategori:", error);
    }
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setSelectedRetail(null);
    setSelectedKategori(null);
    setKategoriOptions([]);
    setStartDate("");
    setEndDate("");
  };

  const handleAssign = async () => {
    if (!selectedUsers.length || !selectedRetail || !selectedKategori || !startDate || !endDate) {
      Swal.fire("Lengkapi form", "User, retail, kategori, dan rentang tanggal wajib diisi.", "warning");
      return;
    }

    try {
      const payload = {
        user_ids: selectedUsers.map((u) => u.value),
        retail_id: selectedRetail.value,
        kategori_absen: selectedKategori.value,
        start_date: startDate,
        end_date: endDate,
        created_by: getUserId(),
        created_at: DateNow,
      };

      const res = await axios.post(
        `${VITE_API_URL}/jadwal-harian/assign`,
        payload,
        { headers: authHeaders() }
      );

      Swal.fire("Success!", res.data.message, "success");
      setAddModalVisible(false);
      resetForm();
      fetchJadwal();
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: "Hapus jadwal?",
      text: `${row.user_name} — ${row.tanggal} (${row.kategori_absen})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Ya, hapus",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await axios.post(
          `${VITE_API_URL}/jadwal-harian/delete/${row.id}`,
          { deleted_by: getUserId(), deleted_at: DateNow },
          { headers: authHeaders() }
        );
        Swal.fire("Deleted!", "Jadwal dihapus.", "success");
        setJadwal((prev) => prev.filter((item) => item.id !== row.id));
      } catch (error) {
        Swal.fire("Error!", error.response?.data?.message || error.message, "error");
      }
    });
  };

  const columns = [
    {
      name: "#",
      cell: (_row, index) => <span>{index + 1}</span>,
      width: "50px",
    },
    { name: "Tanggal", selector: (row) => row.tanggal, sortable: true },
    { name: "Karyawan", selector: (row) => row.user_name, sortable: true },
    { name: "Retail", selector: (row) => row.retail_name, sortable: true },
    { name: "Shift (Kategori)", selector: (row) => row.kategori_absen, sortable: true },
    {
      name: "Aksi",
      cell: (row) => (
        <button
          className="btn btn-sm btn-gradient-danger"
          onClick={() => handleDelete(row)}
        >
          Hapus
        </button>
      ),
    },
  ];

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">Jadwal Shift Harian (Sales Toko / Trainee)</h4>
                <button
                  className="btn btn-gradient-primary"
                  onClick={() => setAddModalVisible(true)}
                >
                  + Assign Jadwal
                </button>
              </div>

              <div className="mb-3" style={{ maxWidth: "220px" }}>
                <label className="form-label">Bulan</label>
                <input
                  type="month"
                  className="form-control"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>

              <DataTable
                columns={columns}
                data={jadwal}
                progressPending={loading}
                pagination
                highlightOnHover
                striped
              />
            </div>
          </div>
        </div>
      </div>

      <Modal show={addModalVisible} onHide={() => setAddModalVisible(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign Jadwal Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Karyawan (bisa banyak)</label>
            <Select
              isMulti
              options={eligibleUsers}
              value={selectedUsers}
              onChange={(v) => setSelectedUsers(v || [])}
              placeholder="Pilih karyawan..."
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Retail / OC</label>
            <Select
              options={retails}
              value={selectedRetail}
              onChange={handleRetailChange}
              placeholder="Pilih retail..."
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Shift (Kategori Absen)</label>
            <Select
              options={kategoriOptions}
              value={selectedKategori}
              onChange={setSelectedKategori}
              placeholder="Pilih shift..."
              isDisabled={!selectedRetail}
              noOptionsMessage={() => "Retail ini belum punya kategori absen"}
            />
          </div>
          <div className="row">
            <div className="col-6 mb-3">
              <label className="form-label">Tanggal Mulai</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-6 mb-3">
              <label className="form-label">Tanggal Akhir</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <small className="text-muted">
            Jadwal akan dibuat untuk tiap tanggal dalam rentang. Assign ulang pada
            tanggal yang sama akan menimpa jadwal sebelumnya.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddModalVisible(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleAssign}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default JadwalHarian;
