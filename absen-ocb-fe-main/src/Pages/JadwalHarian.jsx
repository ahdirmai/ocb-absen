import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import {
  format,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import Select from "react-select";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const DAY_INITIAL = ["M", "S", "S", "R", "K", "J", "S"]; // Min..Sab

// Hanya tampilkan OC 1 - OC 40.
const isOcRetail = (name) => {
  const m = String(name).trim().match(/^OC\s*0*(\d{1,2})$/i);
  if (!m) return false;
  const n = Number(m[1]);
  return n >= 1 && n <= 40;
};
const ocNumber = (name) => Number(String(name).trim().match(/^OC\s*0*(\d{1,2})$/i)[1]);

// Warna sel per grup shift (deteksi dari nama shift: PAGI/SORE/SUBUH/MALAM).
const shiftColor = (shiftName) => {
  const k = String(shiftName || "").toLowerCase();
  if (k.includes("pagi")) return "#c8e6c9";
  if (k.includes("sore")) return "#ffe0b2";
  if (k.includes("malam") || k.includes("subuh")) return "#d1c4e9";
  return "#e0e0e0";
};
// Kode ringkas untuk sel matrix: ambil kode shift (S1, S2, T1...) dari nama.
const shiftCode = (shiftName) => {
  const s = String(shiftName || "").trim();
  const m = s.match(/^(S\d+|TRAINEE\s*\d+|T\d+)/i);
  if (m) return m[1].toUpperCase().replace(/\s+/g, "");
  return s.slice(0, 3).toUpperCase();
};

const CELL_BORDER = "1px solid #dee2e6";

const JadwalHarian = () => {
  const [retails, setRetails] = useState([]);
  const [selectedRetail, setSelectedRetail] = useState(null);

  const [employees, setEmployees] = useState([]); // [{value,label}]
  const [kategoriList, setKategoriList] = useState([]);

  const [monthDate, setMonthDate] = useState(new Date());
  const [monthJadwal, setMonthJadwal] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCell, setModalCell] = useState(null); // { user_id, user_name, tanggal, existing }
  const [modalKategori, setModalKategori] = useState(null);
  const [savingModal, setSavingModal] = useState(false);

  const monthStr = format(monthDate, "yyyy-MM");

  // --- Fetch retails sekali (OC 1-40) ---
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const retailRes = await axios.get(`${VITE_API_URL}/retail`, {
          headers: authHeaders(),
        });
        setRetails(
          (retailRes.data.data || [])
            .filter((r) => isOcRetail(r.name))
            .sort((a, b) => ocNumber(a.name) - ocNumber(b.name))
            .map((r) => ({ value: r.retail_id, label: r.name }))
        );
      } catch (error) {
        console.error("Init fetch failed:", error);
      }
    };
    fetchInit();
  }, []);

  // --- Saat OC dipilih: ambil kategori shift + karyawan retail itu ---
  const handleRetailChange = async (option) => {
    setSelectedRetail(option);
    setKategoriList([]);
    setEmployees([]);
    setMonthJadwal([]);
    if (!option) return;
    try {
      const [katRes, empRes] = await Promise.all([
        axios.get(`${VITE_API_URL}/jadwal-harian/kategori`, {
          headers: authHeaders(),
        }),
        axios.get(`${VITE_API_URL}/jadwal-harian/employees/${option.value}`, {
          headers: authHeaders(),
        }),
      ]);
      setKategoriList(katRes.data.data || []);
      setEmployees(
        (empRes.data.data || []).map((u) => ({ value: u.user_id, label: u.name }))
      );
    } catch (error) {
      console.error("Fetch kategori/employees failed:", error);
    }
  };

  const fetchMonthJadwal = async () => {
    if (!selectedRetail) return;
    setLoadingMonth(true);
    try {
      const res = await axios.get(
        `${VITE_API_URL}/jadwal-harian?month=${monthStr}&retail_id=${selectedRetail.value}`,
        { headers: authHeaders() }
      );
      setMonthJadwal(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setLoadingMonth(false);
    }
  };

  useEffect(() => {
    fetchMonthJadwal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRetail, monthStr]);

  // --- Daftar tanggal 1..N bulan berjalan ---
  const days = useMemo(() => {
    const last = endOfMonth(monthDate).getDate();
    const arr = [];
    for (let d = 1; d <= last; d++) {
      const tanggal = format(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), d),
        "yyyy-MM-dd"
      );
      const dow = getDay(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
      arr.push({ d, tanggal, dow });
    }
    return arr;
  }, [monthDate]);

  // --- Lookup jadwal[user_id][tanggal] = row ---
  const jadwalMap = useMemo(() => {
    const map = {};
    for (const row of monthJadwal) {
      if (!map[row.user_id]) map[row.user_id] = {};
      map[row.user_id][row.tanggal] = row;
    }
    return map;
  }, [monthJadwal]);

  // Encode pasangan shift sebagai "masuk_id:keluar_id" untuk dropdown value.
  const encodeShift = (masukId, keluarId) => `${masukId}:${keluarId}`;
  const decodeShift = (val) => {
    if (!val) return { absen_masuk_id: null, absen_keluar_id: null };
    const [m, k] = String(val).split(":");
    return { absen_masuk_id: Number(m), absen_keluar_id: Number(k) };
  };

  // --- Klik sel: buka modal assign 1 orang 1 hari ---
  const openCell = (user, day) => {
    const existing = jadwalMap[user.value]?.[day.tanggal] || null;
    setModalCell({
      user_id: user.value,
      user_name: user.label,
      tanggal: day.tanggal,
      existing,
    });
    if (existing?.absen_masuk_id && existing?.absen_keluar_id) {
      setModalKategori({
        value: encodeShift(existing.absen_masuk_id, existing.absen_keluar_id),
        label: existing.shift_name,
      });
    } else {
      setModalKategori(null);
    }
    setModalVisible(true);
  };

  // kategoriList: [{ shift_name, kategori_absen, absen_masuk_id, absen_keluar_id }].
  const kategoriOptions = kategoriList.map((k) => ({
    value: encodeShift(k.absen_masuk_id, k.absen_keluar_id),
    label: `${k.shift_name} (${k.kategori_absen})`,
  }));

  // --- Simpan 1 sel (assign upsert 1 user 1 tanggal) ---
  const handleSaveCell = async () => {
    if (!modalKategori) {
      Swal.fire("Pilih shift", "Kategori shift wajib dipilih.", "warning");
      return;
    }
    const { absen_masuk_id, absen_keluar_id } = decodeShift(modalKategori.value);
    setSavingModal(true);
    try {
      await axios.post(
        `${VITE_API_URL}/jadwal-harian/assign`,
        {
          user_ids: [modalCell.user_id],
          retail_id: selectedRetail.value,
          absen_masuk_id,
          absen_keluar_id,
          start_date: modalCell.tanggal,
          end_date: modalCell.tanggal,
        },
        { headers: authHeaders() }
      );
      setModalVisible(false);
      fetchMonthJadwal();
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingModal(false);
    }
  };

  // --- Hapus shift 1 sel ---
  const handleClearCell = async () => {
    if (!modalCell?.existing) {
      setModalVisible(false);
      return;
    }
    setSavingModal(true);
    try {
      await axios.post(
        `${VITE_API_URL}/jadwal-harian/delete/${modalCell.existing.id}`,
        {},
        { headers: authHeaders() }
      );
      setModalVisible(false);
      fetchMonthJadwal();
    } catch (error) {
      Swal.fire("Error!", error.response?.data?.message || error.message, "error");
    } finally {
      setSavingModal(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Jadwal Shift Harian (Sales Toko / Trainee)</h4>

              {/* Step 1: Pilih OC */}
              <div className="mb-4" style={{ maxWidth: "360px" }}>
                <label className="form-label">Pilih OC / Retail</label>
                <Select
                  options={retails}
                  value={selectedRetail}
                  onChange={handleRetailChange}
                  placeholder="Pilih OC..."
                  isClearable
                />
              </div>

              {/* Step 2: Matrix karyawan x tanggal */}
              {selectedRetail && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setMonthDate((d) => subMonths(d, 1))}
                    >
                      &laquo; Prev
                    </button>
                    <h5 className="mb-0">{format(monthDate, "MMMM yyyy")}</h5>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setMonthDate((d) => addMonths(d, 1))}
                    >
                      Next &raquo;
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="mb-2" style={{ fontSize: "12px" }}>
                    {kategoriList.map((k) => (
                      <span
                        key={k.shift_name}
                        className="me-3"
                        style={{ display: "inline-flex", alignItems: "center" }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "14px",
                            height: "14px",
                            background: shiftColor(k.shift_name),
                            borderRadius: "3px",
                            marginRight: "4px",
                          }}
                        />
                        {shiftCode(k.shift_name)} = {k.shift_name}
                      </span>
                    ))}
                  </div>

                  {loadingMonth && <p className="text-muted">Memuat jadwal...</p>}

                  {employees.length === 0 ? (
                    <p className="text-muted">
                      Belum ada karyawan terhubung ke OC ini.
                    </p>
                  ) : (
                    <div
                      style={{
                        overflowX: "auto",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                      }}
                    >
                      <table
                        className="table table-bordered mb-0"
                        style={{
                          borderCollapse: "separate",
                          borderSpacing: 0,
                          width: "auto",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                position: "sticky",
                                left: 0,
                                background: "#f8f9fa",
                                zIndex: 2,
                                minWidth: "180px",
                                padding: "8px 10px",
                                verticalAlign: "middle",
                                border: CELL_BORDER,
                              }}
                            >
                              Karyawan
                            </th>
                            {days.map((day) => (
                              <th
                                key={day.tanggal}
                                style={{
                                  textAlign: "center",
                                  padding: "6px 0",
                                  minWidth: "40px",
                                  fontSize: "12px",
                                  lineHeight: 1.25,
                                  border: CELL_BORDER,
                                  background:
                                    day.dow === 0 ? "#ffebee" : "#f8f9fa",
                                }}
                              >
                                <div style={{ fontWeight: 700 }}>{day.d}</div>
                                <div style={{ color: "#999", fontSize: "10px" }}>
                                  {DAY_INITIAL[day.dow]}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map((u) => (
                            <tr key={u.value}>
                              <td
                                style={{
                                  position: "sticky",
                                  left: 0,
                                  background: "#fff",
                                  zIndex: 1,
                                  fontSize: "13px",
                                  padding: "8px 10px",
                                  minWidth: "180px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "220px",
                                  border: CELL_BORDER,
                                }}
                                title={u.label}
                              >
                                {u.label}
                              </td>
                              {days.map((day) => {
                                const row = jadwalMap[u.value]?.[day.tanggal];
                                return (
                                  <td
                                    key={day.tanggal}
                                    onClick={() => openCell(u, day)}
                                    title={
                                      row
                                        ? `${u.label} — ${day.tanggal} — ${row.shift_name}`
                                        : `${u.label} — ${day.tanggal}`
                                    }
                                    style={{
                                      textAlign: "center",
                                      cursor: "pointer",
                                      padding: 0,
                                      height: "40px",
                                      minWidth: "40px",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      border: CELL_BORDER,
                                      background: row
                                        ? shiftColor(row.shift_name)
                                        : day.dow === 0
                                          ? "#fff5f5"
                                          : "#fff",
                                    }}
                                  >
                                    {row ? shiftCode(row.shift_name) : ""}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
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

      {/* Modal assign 1 orang 1 hari */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Set Shift</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalCell && (
            <>
              <p className="mb-1">
                <strong>{modalCell.user_name}</strong>
              </p>
              <p className="text-muted">
                {selectedRetail?.label} — {modalCell.tanggal}
              </p>
              <div className="mb-2">
                <label className="form-label">Shift (Kategori Absen)</label>
                <Select
                  options={kategoriOptions}
                  value={modalKategori}
                  onChange={setModalKategori}
                  placeholder="Pilih shift..."
                  noOptionsMessage={() => "Tidak ada kategori shift"}
                />
              </div>
              <small className="text-muted">
                Satu karyawan hanya boleh 1 shift per hari. Menyimpan akan menimpa
                shift sebelumnya pada tanggal ini.
              </small>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {modalCell?.existing && (
            <Button
              variant="outline-danger"
              onClick={handleClearCell}
              disabled={savingModal}
            >
              Hapus Shift
            </Button>
          )}
          <Button variant="secondary" onClick={() => setModalVisible(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveCell} disabled={savingModal}>
            {savingModal ? "Menyimpan..." : "Simpan"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default JadwalHarian;
