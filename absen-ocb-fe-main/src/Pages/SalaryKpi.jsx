import { useState, useRef, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import * as XLSX from "xlsx";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const fmt = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const SalaryKpi = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kpiPeriod, setKpiPeriod] = useState(null);
  const [kpiTeam, setKpiTeam] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [filterText, setFilterText] = useState({ name: "", period: "" });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${VITE_API_URL}/management/kpi-teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch KPI teams:", err);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const params = { month };
      if (teamId) params.team_id = teamId;

      const response = await axios.get(`${VITE_API_URL}/management/salary-with-kpi`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const resData = response.data;
      setData(resData.data || []);
      setKpiPeriod(resData.kpi_period);
      setKpiTeam(resData.kpi_team);
      setHasFetched(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const filteredData = data.filter((item) =>
    Object.keys(filterText).every((key) =>
      String(item[key] ?? "").toLowerCase().includes(filterText[key].toLowerCase())
    )
  );

  const handleInputChange = (field, value) =>
    setFilterText((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

  const filterHeader = (label, field) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
      <span style={{ marginBottom: "6px", fontWeight: 600 }}>{label}</span>
      <input
        type="text"
        value={filterText[field] || ""}
        className="form-control form-control-sm mt-1"
        placeholder={`Cari ${label}...`}
        ref={(el) => (inputRefs.current[field] = el)}
        onChange={(e) => handleInputChange(field, e.target.value)}
        onFocus={() => setActiveInput(field)}
      />
    </div>
  );

  // Summary stats
  const totalKaryawan = filteredData.length;
  const totalKenaPotongan = filteredData.filter((r) => r.kena_potongan).length;
  const totalPotonganKpi = filteredData.reduce((s, r) => s + (r.potongan_kpi || 0), 0);
  const totalGajiFinal = filteredData.reduce((s, r) => s + (r.total_gaji_final || 0), 0);

  const columns = [
    {
      name: "#",
      cell: (_row, index) => <span>{index + 1}</span>,
      width: "48px",
    },
    {
      name: filterHeader("Nama Karyawan", "name"),
      selector: (row) => row.name,
      minWidth: "160px",
      sortable: true,
    },
    {
      name: filterHeader("Period", "period"),
      selector: (row) => row.period ?? "-",
      width: "100px",
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600 }}>Gaji Kotor</span>,
      selector: (row) => row.total_gaji_awal,
      cell: (row) => fmt(row.total_gaji_awal),
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600 }}>Pot. Terlambat</span>,
      selector: (row) => row.potongan_terlambat,
      cell: (row) => (
        <span className={row.potongan_terlambat > 0 ? "text-warning fw-semibold" : "text-muted"}>
          {fmt(row.potongan_terlambat)}
        </span>
      ),
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600 }}>Pot. Kehadiran</span>,
      selector: (row) => row.potongan_kehadiran,
      cell: (row) => (
        <span className={row.potongan_kehadiran > 0 ? "text-warning fw-semibold" : "text-muted"}>
          {fmt(row.potongan_kehadiran)}
        </span>
      ),
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600 }}>Bonus</span>,
      selector: (row) => row.bonus,
      cell: (row) => (
        <span className={row.bonus > 0 ? "text-success fw-semibold" : "text-muted"}>
          {fmt(row.bonus)}
        </span>
      ),
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600 }}>Gaji Stlh Absen</span>,
      selector: (row) => row.total_gaji_akhir,
      cell: (row) => <span className="fw-semibold">{fmt(row.total_gaji_akhir)}</span>,
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600 }}>Compliance (%)</span>,
      selector: (row) => row.compliance_persen,
      cell: (row) => {
        if (row.compliance_persen === null)
          return <span className="badge bg-secondary">Tidak Ada Data</span>;
        const val = parseFloat(row.compliance_persen);
        return (
          <span className={`badge ${val >= 80 ? "bg-success" : "bg-danger"}`}>
            {val.toFixed(1)}%
          </span>
        );
      },
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600 }}>Performance</span>,
      cell: (row) => {
        const label = row.performance_label;
        if (!label) return <span className="badge bg-secondary">-</span>;
        const map = { excellent: "bg-success", good: "bg-primary", watch: "bg-warning text-dark", poor: "bg-danger" };
        return <span className={`badge ${map[label] || "bg-secondary"}`}>{label}</span>;
      },
      width: "110px",
    },
    {
      name: (
        <div>
          <span style={{ fontWeight: 600 }}>Kena Potongan?</span>
          <div style={{ fontSize: "10px", color: "#888", fontWeight: 400 }}>compliance &lt; 80%</div>
        </div>
      ),
      cell: (row) => {
        if (row.compliance_persen === null)
          return <span className="badge bg-secondary">-</span>;
        return row.kena_potongan
          ? <span className="badge bg-danger">Ya (-10%)</span>
          : <span className="badge bg-success">Tidak</span>;
      },
      width: "120px",
    },
    {
      name: <span style={{ fontWeight: 600 }}>Pot. KPI</span>,
      selector: (row) => row.potongan_kpi,
      cell: (row) => (
        <span className={row.potongan_kpi > 0 ? "text-danger fw-semibold" : "text-muted"}>
          {fmt(row.potongan_kpi)}
        </span>
      ),
      sortable: true,
    },
    {
      name: <span style={{ fontWeight: 600, color: "#1a7431" }}>Gaji Final</span>,
      selector: (row) => row.total_gaji_final,
      cell: (row) => (
        <strong style={{ color: "#1a7431", fontSize: "13px" }}>{fmt(row.total_gaji_final)}</strong>
      ),
      sortable: true,
    },
  ];

  const exportToExcel = () => {
    const rows = filteredData.map((row, index) => ({
      "#": index + 1,
      "Nama Karyawan": row.name,
      Period: row.period,
      "Gaji Kotor": row.total_gaji_awal,
      "Pot. Terlambat": row.potongan_terlambat,
      "Pot. Kehadiran": row.potongan_kehadiran,
      Bonus: row.bonus,
      "Gaji Setelah Absen": row.total_gaji_akhir,
      "Compliance (%)": row.compliance_persen ?? "-",
      "Performance": row.performance_label ?? "-",
      "Kena Potongan KPI": row.compliance_persen === null ? "-" : row.kena_potongan ? "Ya" : "Tidak",
      "Pot. KPI (10%)": row.potongan_kpi,
      "Gaji Final": row.total_gaji_final,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary KPI");
    XLSX.writeFile(workbook, `Salary_KPI_${month}.xlsx`);
  };

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Rekap Gaji + KPI</h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">Dashboard</a></li>
            <li className="breadcrumb-item active">Rekap Gaji KPI</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Filter Data</h4>
              <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>
                Pilih bulan dan team, lalu klik <strong>Tampilkan</strong>. Jika hanya memilih team, tabel hanya menampilkan anggota team tersebut.
                Potongan KPI 10% berlaku jika <strong>compliance &lt; 80%</strong>.
              </p>

              <div className="row g-2 align-items-end mb-3">
                <div className="col-sm-3">
                  <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Bulan</label>
                  <input
                    type="month"
                    className="form-control form-control-sm"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </div>
                <div className="col-sm-4">
                  <label className="form-label fw-semibold" style={{ fontSize: "13px" }}>Team KPI</label>
                  <select
                    className="form-select form-select-sm"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    disabled={teamsLoading}
                  >
                    <option value="">{teamsLoading ? "Memuat..." : "-- Semua / Tanpa Filter Team --"}</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-2">
                  <button className="btn btn-primary btn-sm w-100" onClick={fetchData} disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-1" /> Memuat...</>
                    ) : "Tampilkan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasFetched && (
        <>
          {/* Summary cards */}
          <div className="row mb-3">
            <div className="col-sm-3">
              <div className="card text-center border-0 shadow-sm">
                <div className="card-body py-3">
                  <div className="text-muted" style={{ fontSize: "12px" }}>Total Karyawan</div>
                  <div className="fw-bold" style={{ fontSize: "22px" }}>{totalKaryawan}</div>
                  {kpiTeam && <div className="text-muted" style={{ fontSize: "11px" }}>{kpiTeam.name}</div>}
                </div>
              </div>
            </div>
            <div className="col-sm-3">
              <div className="card text-center border-0 shadow-sm border-danger">
                <div className="card-body py-3">
                  <div className="text-muted" style={{ fontSize: "12px" }}>Kena Potongan KPI</div>
                  <div className="fw-bold text-danger" style={{ fontSize: "22px" }}>{totalKenaPotongan}</div>
                  <div className="text-muted" style={{ fontSize: "11px" }}>compliance &lt; 80%</div>
                </div>
              </div>
            </div>
            <div className="col-sm-3">
              <div className="card text-center border-0 shadow-sm">
                <div className="card-body py-3">
                  <div className="text-muted" style={{ fontSize: "12px" }}>Total Potongan KPI</div>
                  <div className="fw-bold text-danger" style={{ fontSize: "18px" }}>{fmt(totalPotonganKpi)}</div>
                </div>
              </div>
            </div>
            <div className="col-sm-3">
              <div className="card text-center border-0 shadow-sm">
                <div className="card-body py-3">
                  <div className="text-muted" style={{ fontSize: "12px" }}>Total Gaji Final</div>
                  <div className="fw-bold text-success" style={{ fontSize: "18px" }}>{fmt(totalGajiFinal)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="card-title mb-0">Detail Gaji Per Karyawan</h4>
                      {kpiTeam && (
                        <span className="badge bg-info text-dark mt-1">
                          KPI Period: {kpiPeriod} &nbsp;|&nbsp; Team: {kpiTeam.name}
                        </span>
                      )}
                    </div>
                    <button className="btn btn-success btn-sm" onClick={exportToExcel}>
                      Export Excel
                    </button>
                  </div>

                  {error ? (
                    <div className="alert alert-danger py-2">{error}</div>
                  ) : filteredData.length > 0 ? (
                    <DataTable
                      keyField="salary-kpi-id"
                      columns={columns}
                      data={filteredData}
                      pagination
                      responsive
                      highlightOnHover
                      striped
                      dense
                    />
                  ) : (
                    <div className="text-center text-muted py-5">
                      <i className="mdi mdi-inbox-outline" style={{ fontSize: "40px" }} />
                      <p className="mt-2">Tidak ada data untuk filter yang dipilih.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!hasFetched && !loading && (
        <div className="row">
          <div className="col-12 text-center text-muted py-5">
            <i className="mdi mdi-filter-outline" style={{ fontSize: "40px" }} />
            <p className="mt-2">Pilih filter di atas lalu klik <strong>Tampilkan</strong> untuk melihat data.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryKpi;
