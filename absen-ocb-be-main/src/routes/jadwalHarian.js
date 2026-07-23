const express = require("express");
const authenticateToken = require("../middleware/authMiddleware.js");
const jadwalHarianController = require("../controller/jadwalHarian.controller");
const router = express.Router();

// Daftar user eligible (Sales Toko & Trainee Sales Toko)
router.get("/eligible-users", authenticateToken, jadwalHarianController.getEligibleUsers);
// List jadwal per bulan (?month=YYYY-MM&retail_id=optional)
router.get("/", authenticateToken, jadwalHarianController.getJadwal);
// Opsi kategori_absen (shift) untuk sebuah retail
router.get("/kategori/:retailId", authenticateToken, jadwalHarianController.getKategoriByRetail);
// Assign / upsert jadwal (bulk user x tanggal)
router.post("/assign", authenticateToken, jadwalHarianController.assign);
// Soft delete jadwal
router.post("/delete/:id", authenticateToken, jadwalHarianController.deleteJadwal);

module.exports = router;
