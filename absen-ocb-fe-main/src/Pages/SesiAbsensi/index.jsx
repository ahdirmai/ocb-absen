import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import Swal from "sweetalert2";
import { format } from "date-fns";
import { toYMD, deriveRange, authHeaders } from "./helpers";
import { buildColumns } from "./columns";
import { MatchModal, StatusModal, AddAbsenModal, CreateSesiModal, LemburModal } from "./modals";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const showErr = (error) =>
  Swal.fire("Error", error.response?.data?.message || error.message, "error");

const SesiAbsensi = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);

  // Filter
  const [status, setStatus] = useState("incomplete");
  const [rangeMode, setRangeMode] = useState("hari"); // hari|minggu|bulan
  const [anchorDate, setAnchorDate] = useState(toYMD(new Date()));
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // Modal state
  const [matchModal, setMatchModal] = useState(null); // { sesi, needDir, candidates, selected }
  const [loadingCand, setLoadingCand] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // { sesi_id, status }
  const [addModal, setAddModal] = useState(null); // { sesi, direction, absen_time_local, status_absen, reason }
  const [createModal, setCreateModal] = useState(null); // { user_id, retail_id, absen_type_id, ... }
  const [lemburModal, setLemburModal] = useState(null); // { sesi, is_lembur, masuk/keluar_absen_type_id, masukOpts, keluarOpts }
  const [loadingLemburTipe, setLoadingLemburTipe] = useState(false);

  // Picker data (modal buat sesi)
  const [userOptions, setUserOptions] = useState([]);
  const [retailOptions, setRetailOptions] = useState([]);
  const [masukTipeOptions, setMasukTipeOptions] = useState([]);
  const [loadingPickers, setLoadingPickers] = useState(false);
  const [loadingUserShift, setLoadingUserShift] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSesi = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = deriveRange(rangeMode, anchorDate);
      const params = new URLSearchParams({
        start_date: start,
        end_date: end,
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await axios.get(`${VITE_API_URL}/absensi/sesi?${params.toString()}`, {
        headers: authHeaders(),
      });
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total) || 0);
    } catch (error) {
      showErr(error);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, rangeMode, anchorDate, searchDebounced, page, limit]);

  useEffect(() => {
    fetchSesi();
  }, [fetchSesi]);

  // Reset ke page 1 saat filter berubah.
  useEffect(() => {
    setPage(1);
  }, [status, rangeMode, anchorDate, searchDebounced]);

  // ── Match ──
  const openMatchModal = async (row) => {
    setMatchModal({ sesi: row, needDir: null, candidates: [], selected: "" });
    setLoadingCand(true);
    try {
      const res = await axios.get(`${VITE_API_URL}/absensi/sesi/${row.sesi_id}/candidates`, {
        headers: authHeaders(),
      });
      setMatchModal({
        sesi: row,
        needDir: res.data?.need_direction || null,
        candidates: Array.isArray(res.data?.data) ? res.data.data : [],
        selected: "",
      });
    } catch (error) {
      showErr(error);
      setMatchModal(null);
    } finally {
      setLoadingCand(false);
    }
  };

  const submitMatch = async () => {
    if (!matchModal?.selected) {
      Swal.fire("Error", "Pilih sesi pasangan dulu.", "error");
      return;
    }
    // Sesi ini keluar-only → butuh masuk; else masuk-only → butuh keluar.
    const isKeluarOrphan = matchModal.sesi.masuk_absensi_id == null;
    const payload = isKeluarOrphan
      ? { masuk_sesi_id: Number(matchModal.selected), keluar_sesi_id: matchModal.sesi.sesi_id }
      : { masuk_sesi_id: matchModal.sesi.sesi_id, keluar_sesi_id: Number(matchModal.selected) };
    setSavingAction(true);
    try {
      const res = await axios.post(`${VITE_API_URL}/absensi/sesi/match`, payload, {
        headers: authHeaders(),
      });
      Swal.fire("Berhasil!", res.data?.message || "Sesi dipasangkan.", "success");
      setMatchModal(null);
      fetchSesi();
    } catch (error) {
      showErr(error);
    } finally {
      setSavingAction(false);
    }
  };

  const handleUnmatch = async (row) => {
    const ok = await Swal.fire({
      title: "Pisah sesi?",
      text: "Sesi closed ini dipisah jadi 2 incomplete (masuk & keluar terpisah).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, pisah",
      cancelButtonText: "Batal",
    });
    if (!ok.isConfirmed) return;
    try {
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${row.sesi_id}/unmatch`,
        {},
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Sesi dipisah.", "success");
      fetchSesi();
    } catch (error) {
      showErr(error);
    }
  };

  // ── Status ──
  const submitStatus = async () => {
    if (!statusModal?.status) return;
    setSavingAction(true);
    try {
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${statusModal.sesi_id}/status`,
        { status: statusModal.status },
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Status diperbarui.", "success");
      setStatusModal(null);
      fetchSesi();
    } catch (error) {
      showErr(error);
    } finally {
      setSavingAction(false);
    }
  };

  // ── Konversi Regular <-> Lembur ──
  // Ambil daftar tipe (masuk+keluar) sesuai target is_lembur untuk dropdown ganti shift.
  const fetchTipeByDir = async (userId, isLembur) => {
    if (!userId) return { masuk: [], keluar: [] };
    const res = isLembur
      ? await axios.get(`${VITE_API_URL}/absen-management/lembur-types/${userId}`, {
          headers: authHeaders(),
        })
      : await axios.post(
          `${VITE_API_URL}/absen-management/shift-user/${userId}`,
          {},
          { headers: authHeaders() }
        );
    const all = Array.isArray(res.data?.data) ? res.data.data : [];
    const pick = (dirWord) => {
      const seen = new Set();
      return all.filter((t) => {
        const d = String(t.description || "").toLowerCase();
        const isDir = dirWord === "keluar"
          ? d.includes("keluar") || d.includes("pulang")
          : d.includes("masuk");
        if (!isDir || seen.has(t.absen_id)) return false;
        seen.add(t.absen_id);
        return true;
      });
    };
    return { masuk: pick("masuk"), keluar: pick("keluar") };
  };

  const openLemburModal = async (row) => {
    const target = row.is_lembur === 1 ? 0 : 1; // default: kebalikan status sekarang
    setLemburModal({
      sesi: row,
      is_lembur: target,
      masuk_absen_type_id: "",
      keluar_absen_type_id: "",
      masukOpts: [],
      keluarOpts: [],
    });
    setLoadingLemburTipe(true);
    try {
      const { masuk, keluar } = await fetchTipeByDir(row.user_id, target === 1);
      setLemburModal((prev) => (prev ? { ...prev, masukOpts: masuk, keluarOpts: keluar } : prev));
    } catch (error) {
      showErr(error);
    } finally {
      setLoadingLemburTipe(false);
    }
  };

  // Ganti target regular/lembur → refresh daftar tipe + reset pilihan tipe.
  const onLemburToggle = async (isLembur) => {
    setLemburModal((prev) =>
      prev ? { ...prev, is_lembur: isLembur, masuk_absen_type_id: "", keluar_absen_type_id: "", masukOpts: [], keluarOpts: [] } : prev
    );
    setLoadingLemburTipe(true);
    try {
      const uid = lemburModal?.sesi?.user_id;
      const { masuk, keluar } = await fetchTipeByDir(uid, isLembur === 1);
      setLemburModal((prev) => (prev ? { ...prev, masukOpts: masuk, keluarOpts: keluar } : prev));
    } catch (error) {
      showErr(error);
    } finally {
      setLoadingLemburTipe(false);
    }
  };

  const submitLembur = async () => {
    if (!lemburModal) return;
    setSavingAction(true);
    try {
      const payload = { is_lembur: lemburModal.is_lembur };
      if (lemburModal.masuk_absen_type_id) payload.masuk_absen_type_id = Number(lemburModal.masuk_absen_type_id);
      if (lemburModal.keluar_absen_type_id) payload.keluar_absen_type_id = Number(lemburModal.keluar_absen_type_id);
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${lemburModal.sesi.sesi_id}/lembur`,
        payload,
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Sesi dikonversi.", "success");
      setLemburModal(null);
      fetchSesi();
    } catch (error) {
      showErr(error);
    } finally {
      setSavingAction(false);
    }
  };

  // ── Tambah absen bagian hilang ──
  const openAddModal = (row) => {
    const direction = row.masuk_absensi_id == null ? "masuk" : "keluar";
    const base = row.tanggal ? new Date(row.tanggal) : new Date();
    setAddModal({
      sesi: row,
      direction,
      absen_time_local: format(base, "yyyy-MM-dd'T'HH:mm"),
      status_absen: "",
      reason: "",
    });
  };

  const submitAdd = async () => {
    if (!addModal?.absen_time_local) {
      Swal.fire("Error", "Waktu absen wajib diisi.", "error");
      return;
    }
    setSavingAction(true);
    try {
      const absen_time = format(new Date(addModal.absen_time_local), "yyyy-MM-dd HH:mm:ss");
      const fd = new FormData();
      fd.append("absen_time", absen_time);
      fd.append("reason", addModal.reason || "");
      if (addModal.status_absen === "1" || addModal.status_absen === "2") {
        fd.append("status_absen", addModal.status_absen);
      }
      if (addModal.photo) fd.append("photo_url", addModal.photo);
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${addModal.sesi.sesi_id}/add-absen`,
        fd,
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Absen ditambahkan.", "success");
      setAddModal(null);
      fetchSesi();
    } catch (error) {
      showErr(error);
    } finally {
      setSavingAction(false);
    }
  };

  // ── Buat sesi baru ──
  const openCreateModal = async () => {
    setCreateModal({
      user_id: "",
      retail_id: "",
      absen_type_id: "",
      absen_time_local: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      status_absen: "",
      reason: "",
      is_lembur: 0,
    });
    setMasukTipeOptions([]);
    setLoadingPickers(true);
    try {
      const headers = authHeaders();
      const [uRes, rRes] = await Promise.all([
        axios.get(`${VITE_API_URL}/users`, { headers }),
        axios.get(`${VITE_API_URL}/retail`, { headers }),
      ]);
      const uData = uRes.data?.data ?? uRes.data;
      const rData = rRes.data?.data ?? rRes.data;
      setUserOptions(Array.isArray(uData) ? uData : []);
      setRetailOptions(Array.isArray(rData) ? rData : []);
    } catch (error) {
      showErr(error);
    } finally {
      setLoadingPickers(false);
    }
  };

  // Ambil tipe MASUK sesuai mode: regular (shift-user) atau lembur (lembur-types).
  const fetchMasukTipe = async (userId, isLembur) => {
    setMasukTipeOptions([]);
    if (!userId) return;
    setLoadingUserShift(true);
    try {
      const res = isLembur
        ? await axios.get(`${VITE_API_URL}/absen-management/lembur-types/${userId}`, {
            headers: authHeaders(),
          })
        : await axios.post(
            `${VITE_API_URL}/absen-management/shift-user/${userId}`,
            {},
            { headers: authHeaders() }
          );
      const all = Array.isArray(res.data?.data) ? res.data.data : [];
      // Filter arah masuk (dedup by absen_id).
      const seen = new Set();
      const uniq = all.filter((t) => {
        const d = String(t.description || "").toLowerCase();
        if (!d.includes("masuk") || seen.has(t.absen_id)) return false;
        seen.add(t.absen_id);
        return true;
      });
      setMasukTipeOptions(uniq);
    } catch (error) {
      showErr(error);
      setMasukTipeOptions([]);
    } finally {
      setLoadingUserShift(false);
    }
  };

  const onCreateUserChange = async (userId) => {
    setCreateModal((prev) => ({ ...prev, user_id: userId, absen_type_id: "" }));
    await fetchMasukTipe(userId, createModal?.is_lembur === 1);
  };

  const onCreateLemburChange = async (isLembur) => {
    setCreateModal((prev) => ({ ...prev, is_lembur: isLembur ? 1 : 0, absen_type_id: "" }));
    await fetchMasukTipe(createModal?.user_id, isLembur);
  };

  const submitCreate = async () => {
    if (!createModal?.user_id || !createModal?.retail_id || !createModal?.absen_type_id || !createModal?.absen_time_local) {
      Swal.fire("Error", "User, retail, shift, dan waktu wajib diisi.", "error");
      return;
    }
    setSavingAction(true);
    try {
      const absen_time = format(new Date(createModal.absen_time_local), "yyyy-MM-dd HH:mm:ss");
      const fd = new FormData();
      fd.append("user_id", String(createModal.user_id));
      fd.append("retail_id", String(createModal.retail_id));
      fd.append("absen_type_id", String(createModal.absen_type_id));
      fd.append("absen_time", absen_time);
      fd.append("is_lembur", String(createModal.is_lembur === 1 ? 1 : 0));
      fd.append("reason", createModal.reason || "");
      if (createModal.status_absen === "1" || createModal.status_absen === "2") {
        fd.append("status_absen", createModal.status_absen);
      }
      if (createModal.photo) fd.append("photo_url", createModal.photo);
      const res = await axios.post(`${VITE_API_URL}/absensi/sesi/create`, fd, {
        headers: authHeaders(),
      });
      Swal.fire("Berhasil!", res.data?.message || "Sesi dibuat.", "success");
      setCreateModal(null);
      fetchSesi();
    } catch (error) {
      showErr(error);
    } finally {
      setSavingAction(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await Swal.fire({
      title: "Hapus sesi?",
      text: `Sesi #${row.sesi_id} akan dihapus permanen (baris absensi tidak terhapus).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#c62828",
    });
    if (!ok.isConfirmed) return;
    try {
      const res = await axios.post(
        `${VITE_API_URL}/absensi/sesi/${row.sesi_id}/delete`,
        {},
        { headers: authHeaders() }
      );
      Swal.fire("Berhasil!", res.data?.message || "Sesi dihapus.", "success");
      fetchSesi();
    } catch (error) {
      showErr(error);
    }
  };

  const columns = buildColumns({
    onMatch: openMatchModal,
    onAdd: openAddModal,
    onUnmatch: handleUnmatch,
    onEditStatus: (row) => setStatusModal({ sesi_id: row.sesi_id, status: row.status }),
    onEditLembur: openLemburModal,
    onDelete: handleDelete,
  });

  const { start, end } = deriveRange(rangeMode, anchorDate);

  return (
    <div className="content-wrapper" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0 }}>Kelola Sesi Absensi</h4>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#78909c" }}>
            Pasangkan absen masuk & keluar, kelola sesi incomplete/closed. Rentang: {start} s/d {end}
          </p>
        </div>
        <button className="btn btn-gradient-primary" onClick={openCreateModal}>
          <i className="mdi mdi-plus"></i> Buat Sesi Baru
        </button>
      </div>

      {/* Toolbar filter */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-end",
          background: "#fff",
          padding: 14,
          borderRadius: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>
            <option value="incomplete">Incomplete</option>
            <option value="closed">Closed</option>
            <option value="open">Open</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Rentang</label>
          <select className="form-control" value={rangeMode} onChange={(e) => setRangeMode(e.target.value)}>
            <option value="hari">Per Hari</option>
            <option value="minggu">Per Minggu</option>
            <option value="bulan">Per Bulan</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tanggal</label>
          <input
            type="date"
            className="form-control"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Cari Karyawan</label>
          <input
            type="text"
            className="form-control"
            placeholder="Nama / username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-light" onClick={fetchSesi} disabled={loading}>
          <i className="mdi mdi-refresh"></i> Refresh
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 10, padding: 8 }}>
        <DataTable
          columns={columns}
          data={rows}
          progressPending={loading}
          pagination
          paginationServer
          paginationTotalRows={total}
          paginationDefaultPage={page}
          paginationPerPage={limit}
          paginationRowsPerPageOptions={[25, 50, 100, 200]}
          onChangePage={(p) => setPage(p)}
          onChangeRowsPerPage={(newLimit, p) => {
            setLimit(newLimit);
            setPage(p);
          }}
          highlightOnHover
          dense
          noDataComponent={<div style={{ padding: 24, color: "#90a4ae" }}>Tidak ada sesi.</div>}
        />
      </div>

      {matchModal && (
        <MatchModal
          match={matchModal}
          setMatch={setMatchModal}
          loadingCand={loadingCand}
          saving={savingAction}
          onClose={() => setMatchModal(null)}
          onSubmit={submitMatch}
        />
      )}

      {statusModal && (
        <StatusModal
          statusModal={statusModal}
          setStatusModal={setStatusModal}
          saving={savingAction}
          onClose={() => setStatusModal(null)}
          onSubmit={submitStatus}
        />
      )}

      {addModal && (
        <AddAbsenModal
          add={addModal}
          setAdd={setAddModal}
          saving={savingAction}
          onClose={() => setAddModal(null)}
          onSubmit={submitAdd}
        />
      )}

      {lemburModal && (
        <LemburModal
          lembur={lemburModal}
          setLembur={setLemburModal}
          loadingTipe={loadingLemburTipe}
          saving={savingAction}
          onClose={() => setLemburModal(null)}
          onToggle={onLemburToggle}
          onSubmit={submitLembur}
        />
      )}

      {createModal && (
        <CreateSesiModal
          create={createModal}
          setCreate={setCreateModal}
          userOptions={userOptions}
          retailOptions={retailOptions}
          masukTipeOptions={masukTipeOptions}
          loadingPickers={loadingPickers}
          loadingUserShift={loadingUserShift}
          saving={savingAction}
          onUserChange={onCreateUserChange}
          onLemburChange={onCreateLemburChange}
          onClose={() => setCreateModal(null)}
          onSubmit={submitCreate}
        />
      )}
    </div>
  );
};

export default SesiAbsensi;
