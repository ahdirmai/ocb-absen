const express = require('express');
const LaporanController = require('../controller/laporan.controller.js');
const authenticateToken = require('../middleware/authMiddleware.js');

const upload = require('../middleware/multerLaporan')

const router = express.Router()

router.get('/', authenticateToken, LaporanController.getAllFiles)
router.post('/upload',authenticateToken, upload.single('file_url'), LaporanController.UploadFile)
router.post('/update-file/:idFile', authenticateToken, upload.single('file_url'), LaporanController.updateFile)
router.post('/delete-file/:idFile', authenticateToken,  LaporanController.deleteFile)








module.exports = router