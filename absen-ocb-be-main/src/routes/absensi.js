const express = require('express')
const authenticateToken = require('../middleware/authMiddleware.js');
const absensiController = require('../controller/absensi.controller');
const upload = require('../middleware/multer');
const cekAbsenToday = require('../middleware/validasiAbsensi');

const router = express.Router();

//Lakukan Absensi
router.post('/', authenticateToken, cekAbsenToday, upload.single('photo_url'), absensiController.createAbsensi );
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



module.exports=router
