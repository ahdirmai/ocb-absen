const express = require('express');
const rawAbsensiController = require('../controller/rawAbsensi.controller');

const router = express.Router();

// GET /api/raw-absensi?period=daily|weekly|monthly[&date=YYYY-MM-DD][&week=YYYY-Www][&month=YYYY-MM]
router.get('/', rawAbsensiController.getRawAbsensi);

module.exports = router;
