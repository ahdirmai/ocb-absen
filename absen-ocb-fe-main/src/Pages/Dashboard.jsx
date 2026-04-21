import { useState, useEffect } from "react";
import axios from "axios";
import { Bar} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

const VITE_API_URL = import.meta.env.VITE_API_URL;
// const now = new Date();
// const DateNow = format(now, "yyyy-MM-dd HH:mm:ss");
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState([]);
  const [chartData, setChartData] =  useState({
    labels: [],
    datasets:[],});

  useEffect(() => {
    fetchSummary();
    fetchcatabsen();
    fetchFee();
  }, []);

    const fetchcatabsen = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
  
        const response = await axios.get(`${VITE_API_URL}/summary/daily-retail`, { headers });
        const fetchedData = response.data;
  
        console.log("Data yang diterima:", fetchedData);
  
        // Pastikan fetchedData adalah array
        if (Array.isArray(fetchedData) && fetchedData.length > 0) {
          const labels = fetchedData.map(item => item.retail_name);
  
          // Mengonversi nilai string ke angka jika diperlukan
          const totalAbsen = fetchedData.map(item => Number(item.total_absensi));
          const totalOntime = fetchedData.map(item => Number(item.total_ontime));
          const totalLate = fetchedData.map(item => Number(item.total_late));
  
          // Update chartData
          setChartData({
            labels: labels || [],
            datasets: [
              {
                label: 'Total Absen',
                data: totalAbsen || [],
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
              },
              {
                label: 'Total Ontime',
                data: totalOntime || [],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
              },
              {
                label: 'Total Late',
                data: totalLate || [],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
              },
            ],
          });
        } else {
          console.error('Data tidak valid atau kosong:', fetchedData);
        }
      } catch (error) {
        console.error('Terjadi kesalahan saat mengambil data:', error);
      }
    };
  
    

  
  

  //data Dummy 
// const chartData1 = {
//   labels: ['AdithCollection', 'khunStore123', 'MisLa Store'],
//   datasets: [
//     {
//       label: 'Total Absensi',
//       data: [4, 3, 1],
//       backgroundColor: 'rgba(75, 192, 192, 0.6)',
//     },
//     {
//       label: 'Total Ontime',
//       data: [1, 0, 0],
//       backgroundColor: 'rgba(75, 192, 192, 0.6)',
//     },
//     {
//       label: 'Total Late',
//       data: [3, 3, 1],
//       backgroundColor: 'rgba(255, 99, 132, 0.6)',
//     },
//   ],
// };

  // Data Dummy untuk Line Chart
  // const lineChartData = {
  //   labels: ['Toko A', 'Toko B', 'Toko C'],
  //   datasets: [
  //     {
  //       label: 'Total Fee',
  //       data: [300000, 250000, 400000],
  //       borderColor: 'rgba(153, 102, 255, 1)',
  //       backgroundColor: 'rgba(153, 102, 255, 0.2)',
  //       tension: 0.4, // Membuat garis sedikit melengkung
  //     },
  //   ],
  // };




    const fetchSummary = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${VITE_API_URL}/summary`, {
          headers,
        });

        // Ambil data dari getTotalDaily
        const fetchedData = response.data.getTotalDaily || [];
        setDashboardData(fetchedData);
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    
    const fetchFee = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${VITE_API_URL}/summary/total-feedaily`, {
          headers,
        });

        // console.log("Response Data:", response.data);

        // Akses data.total_fee dari array di dalam respons
        const fetchedFee = response.data?.data[0]?.total_fee || 0;
        // console.log("Fetched Fee:", fetchedFee);

        setFee(fetchedFee); // Simpan nilai angka total_fee
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };



  return (
    <div className="content-wrapper">
      <div className="page-header">
        <h3 className="page-title">
          <span className="page-title-icon bg-gradient-primary text-white me-2">
            <i className="mdi mdi-home"></i>
          </span>{" "}
          Dashboard
        </h3>
        <nav aria-label="breadcrumb">
          <ul className="breadcrumb">
            <li className="breadcrumb-item active" aria-current="page">
              <span></span>Overview{" "}
              <i className="mdi mdi-alert-circle-outline icon-sm text-primary align-middle"></i>
            </li>
          </ul>
        </nav>
      </div>
      <div className="row">
        {dashboardData.map((item, index) => (
          <div className="col-md-3 stretch-card grid-margin" key={index}>
            <div className="card bg-gradient-danger card-img-holder text-white">
              <div className="card-body">
                <img
                  src="/circle.svg"
                  className="card-img-absolute"
                  alt="circle-image"
                />
                <h4 className="font-weight-normal mb-3">
                  {item.label}
                  <i className="mdi mdi-chart-line mdi-24px float-end"></i>
                </h4>
                <h2 className="mb-5">{item.value}</h2>
                <h6 className="card-text">Daily Summary</h6>
              </div>
            </div>
          </div>
        ))}

        <div className="col-md-3 stretch-card grid-margin">
          <div className="card bg-gradient-danger card-img-holder text-white">
            <div className="card-body">
              <img
                src="/circle.svg"
                className="card-img-absolute"
                alt="circle-image"
              />
              <h4 className="font-weight-normal mb-3">
                Total fee
                <i className="mdi mdi-chart-line mdi-24px float-end"></i>
              </h4>
              <h2 className="mb-5">{fee || 0}</h2>
              <h6 className="card-text">Total Fee Hari ini</h6>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
            <div className="clearfix">
              <h6>Trend Total Absensi Per Retail/Hari</h6>
              <Bar
              //   data={barChartData}
              //   options={{
              //     responsive: true,
              //     plugins: {
              //       legend: { position: "top" },
              //     },
              //     scales: {
              //       y: {
              //         beginAtZero: true,
              //       },
              //     },
              //   }}
              // />
              data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
          },
          scales: {
            x: {
              barPercentage: 1.0, // Ukuran bar per kategori (0.1 - 1.0)
              categoryPercentage: 10.0, // Spasi antar kategori
            },
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
              </div>
            </div>
          </div>
        </div>
        {/* <div className="col-md-6 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
            <div className="clearfix">
              <h6>Fee Per Retail/Hari</h6>
              <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div> */}
    
      </div>
    </div>
  );
};

export default Dashboard;
