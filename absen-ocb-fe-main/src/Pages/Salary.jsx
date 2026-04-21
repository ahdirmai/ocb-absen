import { useState,useRef, useEffect } from "react";
import axios from "axios";
import DataTable from "react-data-table-component";
import { format } from "date-fns";
import * as XLSX from "xlsx";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const Salary = () => {
  const [salary, setsalary] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState({
    name: "",
    username: "",
    period: "",
    total_gaji_awal: "",
    potongan_terlambat: "",
    potongan_kehadiran: "",
    bonus: "",
    total_deduction: "",
    total_gaji_akhir: "",

  

  });
  const inputRefs = useRef({});
  const [activeInput, setActiveInput] = useState(null);


  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch salary data
        const salaryResponse = await axios.get(`${VITE_API_URL}/management/fee-karyawan`, {
          headers,
        });
        const salaryData = salaryResponse.data.data || [];
        const validsalaryData = salaryData.filter((item) => item && item.name);
        setsalary(validsalaryData);

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

  // const filteredsalary = salary.filter(
  //   (item) =>
  //     item.name?.toLowerCase().includes(search.toLowerCase()) ||
  //     item.username?.toLowerCase().includes(search.toLowerCase()) ||
  //     item.period?.toLowerCase().includes(search.toLowerCase())
  // );

  const filteredsalary = salary.filter((item) =>
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
  

  const columns = [
    {
      name: (
        <span style={{ marginBottom: "45px" }}>#</span>
      ),
      cell: (row, index) => <span>{index + 1}</span>,
      width: "50px",
    },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Nama Karyawan</span>
          <input
            type="text"
            value={filterText.name}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.name = el)}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onFocus={() => setActiveInput('name')} // Set active input
          />
        </div>
      ),
       selector: (row) => row.name },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Username</span>
          <input
            type="text"
            value={filterText.username}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.username = el)}
            onChange={(e) => handleInputChange("username", e.target.value)}
            onFocus={() => setActiveInput('username')} // Set active input
          />
        </div>
      ),
      selector: (row) => row.username },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Period Salary</span>
          <input
            type="text"
            value={filterText.period}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.period = el)}
            onChange={(e) => handleInputChange("period", e.target.value)}
            onFocus={() => setActiveInput('period')} // Set active input
          />
        </div>
      ), 
      selector: (row) => row.period },
    { 
      
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Total Gaji Awal</span>
          <input
            type="text"
            value={filterText.total_gaji_awal}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.total_gaji_awal = el)}
            onChange={(e) => handleInputChange("total_gaji_awal", e.target.value)}
            onFocus={() => setActiveInput('total_gaji_awal')} // Set active input
          />
        </div>
      ),  
      selector: (row) => formatRupiah(row.total_gaji_awal) },
    { 
      
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Potongan Terlambat</span>
          <input
            type="text"
            value={filterText.potongan_terlambat}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.potongan_terlambat = el)}
            onChange={(e) => handleInputChange("potongan_terlambat", e.target.value)}
            onFocus={() => setActiveInput('potongan_terlambat')} // Set active input
          />
        </div>
      ),  
      selector: (row) => formatRupiah(row.potongan_terlambat) },
    { 
      
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Potongan Kehadiran</span>
          <input
            type="text"
            value={filterText.potongan_kehadiran}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.potongan_kehadiran = el)}
            onChange={(e) => handleInputChange("potongan_kehadiran", e.target.value)}
            onFocus={() => setActiveInput('potongan_kehadiran')} // Set active input
          />
        </div>
      ),  
      selector: (row) => formatRupiah(row.potongan_kehadiran) },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Bonus/Punishment</span>
          <input
            type="text"
            value={filterText.bonus}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.bonus = el)}
            onChange={(e) => handleInputChange("bonus", e.target.value)}
            onFocus={() => setActiveInput('bonus')} // Set active input
          />
        </div>
      ),
       selector: (row) => formatRupiah(row.bonus) },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Total Potongan</span>
          <input
            type="text"
            value={filterText.total_deduction}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.total_deduction = el)}
            onChange={(e) => handleInputChange("total_deduction", e.target.value)}
            onFocus={() => setActiveInput('total_deduction')} // Set active input
          />
        </div>
      ),
      selector: (row) => formatRupiah(row.total_deduction) },
    { 
      name: (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: "6px" }}>Total Gaji</span>
          <input
            type="text"
            value={filterText.total_gaji_akhir}
            className="form-control mt-1 filter-header"
            ref={(el) => (inputRefs.current.total_gaji_akhir = el)}
            onChange={(e) => handleInputChange("total_gaji_akhir", e.target.value)}
            onFocus={() => setActiveInput('total_gaji_akhir')} // Set active input
          />
        </div>
      ), 
      selector: (row) => formatRupiah(row.total_gaji_akhir) },
  ];

  useEffect(() => {
    if (activeInput && inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [filterText, activeInput]);

  const exportToExcel = () => {
    const data = filteredsalary.map((row, index) => ({
      "#": index + 1,
      "Nama Karyawan": row.name,
      "Username": row.username,
      "Period Salary": row.period,
      "Total Gaji Awal": row.total_gaji_awal,
      "Potongan Terlambat": row.potongan_terlambat,
      "Potongan Kehadiran": row.potongan_kehadiran,
      "Bonus": row.bonus,
      "Total Potongan": row.total_deduction,
      "Total Gaji": row.total_gaji_akhir,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Data");

    const dateNow = new Date().toISOString().split("T")[0]; // Current date
    XLSX.writeFile(workbook, `Salary_Data_${dateNow}.xlsx`);
  };

  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">Management Salary Karyawan</h3>
      </div>
      <div className="row">
        <div className="col-lg-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Table Salary</h4>
              <div className="">
                {loading ? (
                  <p>Loading data...</p>
                ) : error ? (
                  <p className="text-danger">Error: {error}</p>
                ) : (
                  <>
                    <div className="row mb-3">
                      <div className="col-sm-8">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={exportToExcel}
                        >
                          Export to Excel
                        </button>
                      </div>
                      <div className="col-sm-4">
                        <div className="input-group">
                          <div className="input-group-prepend bg-transparent">
                            
                          </div>
                          
                        </div>
                      </div>
                    </div>

                    {filteredsalary && filteredsalary.length > 0 ? (
                      <DataTable
                        keyField="salary-id"
                        columns={columns}
                        data={filteredsalary}
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
                          {filteredsalary.length > 0 ? (
                            filteredsalary.map((row, index) => (
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
    </div>
  );
};

export default Salary;
