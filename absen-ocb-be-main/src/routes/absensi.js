const express = require('express')
const authenticateToken = require('../middleware/authMiddleware.js');
const absensiController = require('../controller/absensi.controller');
const upload = require('../middleware/multer');
const cekAbsenToday = require('../middleware/validasiAbsensi');

const router = express.Router();

//Lakukan Absensi
router.post('/', authenticateToken, upload.single('photo_url'), cekAbsenToday, absensiController.createAbsensi );
//Get All Absensi
// router.get('/history/', authenticateToken, );
// //Get History Absensi Per User
router.post('/history-user/:userId', authenticateToken, absensiController.historyAbsensiPerUser);
//get Total Free //PerUser
router.post('/cekfee-user/:userId', authenticateToken, absensiController.cekFeePeruser);

router.get('/history/?', authenticateToken, absensiController.historyAbsensiAllUser);

router.post('/approval/:approvalId', authenticateToken, absensiController.listAbsensiApproval);

router.post('/total-absensi/:userId', authenticateToken, absensiController.totalAbsenPerMonth);

router.post('/approve-absensi/:absenId', authenticateToken, absensiController.approveAbsen);

router.post('/reject-absensi/:absenId', authenticateToken, absensiController.rejectAbsen);

router.post('/validasi/:absenId', authenticateToken, absensiController.validasiAbsen);

router.get('/tipe-absen', authenticateToken, absensiController.listTipeAbsenByDirection);

// Kelola Sesi Absensi
router.get('/sesi', authenticateToken, absensiController.listSesiAbsensi);
router.post('/sesi/create', authenticateToken, upload.single('photo_url'), absensiController.createNewSesi);
router.post('/sesi/match', authenticateToken, absensiController.matchSesiAbsensi);
router.get('/sesi/:sesiId/candidates', authenticateToken, absensiController.getSesiCandidates);
router.post('/sesi/:sesiId/unmatch', authenticateToken, absensiController.unmatchSesiAbsensi);
router.post('/sesi/:sesiId/status', authenticateToken, absensiController.updateSesiAbsensi);
router.post('/sesi/:sesiId/add-absen', authenticateToken, upload.single('photo_url'), absensiController.addAbsenToSesi);
router.post('/sesi/:sesiId/delete', authenticateToken, absensiController.deleteSesiAbsensi);

router.post('/koreksi/:absenId', authenticateToken, absensiController.koreksiAbsen);

router.get('/rekap-kalender', authenticateToken, absensiController.rekapKalender);

module.exports=router
