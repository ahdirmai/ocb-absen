/* eslint-disable react/prop-types */
import Select from "react-select";
import { fmtTime } from "./helpers";
import { Modal, ModalActions } from "./ui";

const portalStyles = { menuPortal: (base) => ({ ...base, zIndex: 1100 }) };

// ── Match sesi incomplete dengan pasangan kandidat ──
export const MatchModal = ({ match, setMatch, loadingCand, saving, onClose, onSubmit }) => (
  <Modal onClose={onClose} width={520}>
    <h5 style={{ marginTop: 0 }}>Match Sesi Absensi</h5>
    <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
      {match.sesi.nama_karyawan} — {match.sesi.shift_name || "-"}
    </p>
    <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12 }}>
      <div>
        <b>Sesi ini (#{match.sesi.sesi_id})</b>
      </div>
      <div>Masuk: {match.sesi.masuk_absensi_id ? fmtTime(match.sesi.masuk_time) : "— (kosong)"}</div>
      <div>Keluar: {match.sesi.keluar_absensi_id ? fmtTime(match.sesi.keluar_time) : "— (kosong)"}</div>
    </div>

    <label style={{ fontWeight: 600, fontSize: 13 }}>
      Pilih sesi pasangan ({match.needDir === "masuk" ? "absen masuk" : "absen keluar"})
    </label>
    {loadingCand ? (
      <p style={{ color: "#90a4ae" }}>Memuat kandidat...</p>
    ) : match.candidates.length === 0 ? (
      <p style={{ color: "#c62828" }}>Tidak ada kandidat pasangan yang cocok.</p>
    ) : (
      <select
        className="form-control"
        value={match.selected}
        onChange={(e) => setMatch({ ...match, selected: e.target.value })}
      >
        <option value="">-- pilih --</option>
        {match.candidates.map((c) => (
          <option key={c.sesi_id} value={String(c.sesi_id)}>
            #{c.sesi_id} · {c.shift_name} · {fmtTime(c.pair_time)}
          </option>
        ))}
      </select>
    )}

    <ModalActions
      onCancel={onClose}
      onConfirm={onSubmit}
      confirmLabel="Pasangkan"
      saving={saving}
      confirmDisabled={!match.selected}
    />
  </Modal>
);

// ── Ubah status sesi manual ──
export const StatusModal = ({ statusModal, setStatusModal, saving, onClose, onSubmit }) => (
  <Modal onClose={onClose} width={380}>
    <h5 style={{ marginTop: 0 }}>Ubah Status Sesi #{statusModal.sesi_id}</h5>
    <select
      className="form-control"
      value={statusModal.status}
      onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
    >
      <option value="open">Open</option>
      <option value="closed">Closed</option>
      <option value="incomplete">Incomplete</option>
    </select>
    <ModalActions onCancel={onClose} onConfirm={onSubmit} confirmLabel="Simpan" saving={saving} />
  </Modal>
);

// ── Tambah absen bagian hilang (masuk/keluar) pada sesi incomplete ──
export const AddAbsenModal = ({ add, setAdd, saving, onClose, onSubmit }) => (
  <Modal onClose={onClose} width={420}>
    <h5 style={{ marginTop: 0 }}>
      Tambah Absen {add.direction === "masuk" ? "Masuk" : "Keluar"}
    </h5>
    <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
      {add.sesi.nama_karyawan} — {add.sesi.shift_name || "-"} · Sesi #{add.sesi.sesi_id}
    </p>

    <div className="form-group" style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 600, fontSize: 13 }}>Waktu Absen</label>
      <input
        type="datetime-local"
        className="form-control"
        value={add.absen_time_local}
        onChange={(e) => setAdd({ ...add, absen_time_local: e.target.value })}
      />
    </div>

    <div className="form-group" style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 600, fontSize: 13 }}>
        Status <span style={{ fontWeight: 400, color: "#888" }}>(kosong = otomatis)</span>
      </label>
      <select
        className="form-control"
        value={add.status_absen}
        onChange={(e) => setAdd({ ...add, status_absen: e.target.value })}
      >
        <option value="">Otomatis (dari jam)</option>
        <option value="1">Ontime</option>
        <option value="2">Telat</option>
      </select>
    </div>

    <div className="form-group" style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 600, fontSize: 13 }}>Catatan</label>
      <textarea
        className="form-control"
        rows={2}
        value={add.reason}
        onChange={(e) => setAdd({ ...add, reason: e.target.value })}
        placeholder="Alasan input manual..."
      />
    </div>

    <div className="form-group" style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: 600, fontSize: 13 }}>
        Foto <span style={{ fontWeight: 400, color: "#888" }}>(opsional)</span>
      </label>
      <input
        type="file"
        accept="image/*"
        className="form-control"
        onChange={(e) => setAdd({ ...add, photo: e.target.files?.[0] || null })}
      />
    </div>

    <p style={{ fontSize: 11, color: "#90a4ae", margin: "0 0 12px" }}>
      Input manual admin. Lokasi tidak dicatat (none). Sesi otomatis ditutup (closed).
    </p>

    <ModalActions
      onCancel={onClose}
      onConfirm={onSubmit}
      confirmLabel="Tambah & Tutup Sesi"
      saving={saving}
    />
  </Modal>
);

// ── Buat sesi baru (absen masuk), regular atau lembur ──
export const CreateSesiModal = ({
  create,
  setCreate,
  userOptions,
  retailOptions,
  masukTipeOptions,
  loadingPickers,
  loadingUserShift,
  saving,
  onUserChange,
  onLemburChange,
  onClose,
  onSubmit,
}) => {
  const isLembur = create.is_lembur === 1;
  const userLabel = (u) => `${u.name} (${u.username})`;
  const tipeLabel = (t) => `${t.name} — ${t.description}`;

  return (
    <Modal onClose={onClose} width={460}>
      <h5 style={{ marginTop: 0 }}>Buat Sesi Baru (Absen Masuk)</h5>
      <p style={{ fontSize: 12, color: "#90a4ae", margin: "0 0 14px" }}>
        Buat sesi baru dengan absen masuk. Sesi berstatus <b>open</b> — isi absen keluar kemudian via tombol tambah absen.
      </p>

      {loadingPickers ? (
        <p style={{ color: "#90a4ae" }}>Memuat data...</p>
      ) : (
        <>
          <div
            className="form-group"
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              background: isLembur ? "#fff3e0" : "#f5f5f5",
              border: `1px solid ${isLembur ? "#ffb74d" : "#e0e0e0"}`,
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isLembur}
                onChange={(e) => onLemburChange(e.target.checked)}
              />
              <span style={{ fontWeight: 600, fontSize: 13 }}>Sesi Lembur</span>
            </label>
            <p style={{ fontSize: 11, color: "#90a4ae", margin: "6px 0 0 24px" }}>
              {isLembur
                ? "Tipe absen diambil dari daftar lembur. Sesi tidak ditautkan ke jadwal harian."
                : "Sesi regular ditautkan ke jadwal harian bila ada."}
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Karyawan</label>
            <Select
              options={userOptions.map((u) => ({ value: String(u.user_id), label: userLabel(u) }))}
              value={
                create.user_id
                  ? {
                      value: create.user_id,
                      label:
                        userOptions
                          .filter((u) => String(u.user_id) === create.user_id)
                          .map(userLabel)[0] || "",
                    }
                  : null
              }
              onChange={(opt) => onUserChange(opt ? opt.value : "")}
              placeholder="Cari nama / username..."
              isClearable
              menuPortalTarget={document.body}
              styles={portalStyles}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Retail</label>
            <Select
              options={retailOptions.map((r) => ({ value: String(r.retail_id), label: r.name }))}
              value={
                create.retail_id
                  ? {
                      value: create.retail_id,
                      label:
                        retailOptions
                          .filter((r) => String(r.retail_id) === create.retail_id)
                          .map((r) => r.name)[0] || "",
                    }
                  : null
              }
              onChange={(opt) => setCreate({ ...create, retail_id: opt ? opt.value : "" })}
              placeholder="Cari retail..."
              isClearable
              menuPortalTarget={document.body}
              styles={portalStyles}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              {isLembur ? "Tipe Lembur (Masuk)" : "Shift (Tipe Masuk)"}
            </label>
            <Select
              options={masukTipeOptions.map((t) => ({ value: String(t.absen_id), label: tipeLabel(t) }))}
              value={
                create.absen_type_id
                  ? {
                      value: create.absen_type_id,
                      label:
                        masukTipeOptions
                          .filter((t) => String(t.absen_id) === create.absen_type_id)
                          .map(tipeLabel)[0] || "",
                    }
                  : null
              }
              onChange={(opt) => setCreate({ ...create, absen_type_id: opt ? opt.value : "" })}
              isDisabled={!create.user_id || loadingUserShift}
              isLoading={loadingUserShift}
              isClearable
              placeholder={
                !create.user_id
                  ? "Pilih karyawan dulu"
                  : loadingUserShift
                  ? "Memuat tipe..."
                  : masukTipeOptions.length === 0
                  ? isLembur
                    ? "Tak ada tipe lembur"
                    : "Tak ada shift ter-assign"
                  : isLembur
                  ? "Cari tipe lembur..."
                  : "Cari shift..."
              }
              noOptionsMessage={() => (isLembur ? "Tak ada tipe lembur" : "Tak ada shift ter-assign")}
              menuPortalTarget={document.body}
              styles={portalStyles}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Waktu Masuk</label>
            <input
              type="datetime-local"
              className="form-control"
              value={create.absen_time_local}
              onChange={(e) => setCreate({ ...create, absen_time_local: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Status <span style={{ fontWeight: 400, color: "#888" }}>(kosong = otomatis)</span>
            </label>
            <select
              className="form-control"
              value={create.status_absen}
              onChange={(e) => setCreate({ ...create, status_absen: e.target.value })}
            >
              <option value="">Otomatis (dari jam)</option>
              <option value="1">Ontime</option>
              <option value="2">Telat</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>Catatan</label>
            <textarea
              className="form-control"
              rows={2}
              value={create.reason}
              onChange={(e) => setCreate({ ...create, reason: e.target.value })}
              placeholder="Alasan input manual..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Foto <span style={{ fontWeight: 400, color: "#888" }}>(opsional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => setCreate({ ...create, photo: e.target.files?.[0] || null })}
            />
          </div>

          <p style={{ fontSize: 11, color: "#90a4ae", margin: "0 0 12px" }}>
            Input manual admin. Lokasi tidak dicatat (none).
          </p>
        </>
      )}

      <ModalActions
        onCancel={onClose}
        onConfirm={onSubmit}
        confirmLabel="Buat Sesi"
        saving={saving}
        confirmDisabled={loadingPickers}
      />
    </Modal>
  );
};
