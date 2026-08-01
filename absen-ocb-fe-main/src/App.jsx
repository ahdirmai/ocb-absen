import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import  { useState } from "react";
import Login from "./Pages/Login";
import Sidebar from "./Comppnents/Sidebar";
import Header from "./Comppnents/Header";
import Dashboard from "./Pages/Dashboard";
import Retail from "./Pages/Retail";
import Users from "./Pages/Users";
import Absensi from "./Pages/Absensi";
import Shift from "./Pages/Shift";
import ProtectedRoute from "./middleware/ProtectRoute";
import CatAbsen from "./Pages/CatAbsen";
import Bonus from "./Pages/Bonus";
import OffDay from "./Pages/OffDay";
import Salary from "./Pages/Salary";
import RolesAndCategory from "./Pages/RolesAndCategory";
import MenuCategory from "./Pages/MenuCategory";
import Potongan from "./Pages/Potongan";
import Laporan from "./Pages/Laporan";
import Profile from "./Pages/Profile";
import AbsenKaryawan from "./Pages/AbsenKaryawan";
import SalaryKpi from "./Pages/SalaryKpi";
import RekapKalender from "./Pages/RekapKalender";
import JadwalHarian from "./Pages/JadwalHarian";
import SesiAbsensi from "./Pages/SesiAbsensi";
import UpdateApp from "./Pages/UpdateApp";
import JadwalKaryawan from "./Pages/JadwalKaryawan";
import ApprovalAbsen from "./Pages/ApprovalAbsen";
function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  return (
    <Router>
      <Routes>
        {/* Layout tanpa Header dan Sidebar (misalnya untuk Login) */}
        <Route path="/login" element={<Login />} />
        {/* Halaman Absen Karyawan - pakai login sendiri */}
        <Route path="/absen" element={<AbsenKaryawan />} />
        {/* Jadwal bulanan karyawan - self, pakai sesi /absen */}
        <Route path="/absen/jadwal" element={<JadwalKaryawan />} />
        {/* Approval absen bawahan (khusus atasan/SPV) - self, pakai sesi /absen */}
        <Route path="/absen/approval" element={<ApprovalAbsen />} />
        {/* Panduan install APK - publik, dibuka karyawan dari HP */}
        <Route path="/update" element={<UpdateApp />} />
        {/* Layout dengan Header dan Sidebar */}
        <Route
          path="/*"
          element={
            <ProtectedRoute >
              <div className="container-scroller">
              <Header toggleSidebar={toggleSidebar}/>
              {/* <Header /> */}
              <div className="container-fluid page-body-wrapper">
                <Sidebar isSidebarOpen={isSidebarOpen} />
                {/* <Sidebar /> */}
                <div className="main-panel">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/absensi" element={<Absensi />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/retails" element={<Retail />} />
                    <Route path="/shifting" element={<Shift />} />
                    <Route path="/typeabsen" element={<CatAbsen />} />
                    <Route path="/offday" element={<OffDay />} />
                    <Route path="/bonus" element={<Bonus />} />
                    <Route path="/salary" element={<Salary />} />
                    <Route path="/salary-kpi" element={<SalaryKpi />} />
                    <Route path="/management-user" element={<RolesAndCategory />} />
                    <Route path="/menu-category" element={<MenuCategory />} />
                    <Route path="/potongan" element={<Potongan />} />
                    <Route path="/laporan" element={<Laporan />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/rekap-kalender" element={<RekapKalender />} />
                    <Route path="/jadwal-harian" element={<JadwalHarian />} />
                    <Route path="/sesi-absensi" element={<SesiAbsensi />} />
                  </Routes>
                </div>
              </div>
            </div>
          </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
export default App;
