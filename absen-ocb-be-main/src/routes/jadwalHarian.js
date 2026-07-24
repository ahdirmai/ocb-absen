const express = require("express");
const authenticateToken = require("../middleware/authMiddleware.js");
const jadwalHarianController = require("../controller/jadwalHarian.controller");
const router = express.Router();

// Daftar user eligible (Sales Toko & Trainee Sales Toko)
router.get("/eligible-users", authenticateToken, jadwalHarianController.getEligibleUsers);
// List jadwal per bulan (?month=YYYY-MM&retail_id=optional)
router.get("/", authenticateToken, jadwalHarianController.getJadwal);
// Karyawan terhubung ke retail (via shifting + shift_employes)
router.get("/employees/:retailId", authenticateToken, jadwalHarianController.getEmployeesByRetail);
// Opsi kategori_absen (shift) Sales Toko / Trainee (basis group_absen)
router.get("/kategori", authenticateToken, jadwalHarianController.getKategoriShift);
// Jadwal satu retail pada satu tanggal (pre-fill form edit) (?retail_id=&tanggal=YYYY-MM-DD)
router.get("/by-date", authenticateToken, jadwalHarianController.getByDate);
// Set / replace jadwal satu retail pada satu tanggal
router.post("/set-date", authenticateToken, jadwalHarianController.setByDate);
// Assign / upsert jadwal (bulk user x tanggal)
router.post("/assign", authenticateToken, jadwalHarianController.assign);
// Soft delete jadwal
router.post("/delete/:id", authenticateToken, jadwalHarianController.deleteJadwal);

module.exports = router;
