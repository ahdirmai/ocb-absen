const express = require('express');
const authenticateToken = require('../middleware/authMiddleware.js');

const summaryController = require('../controller/summary.controller');
const router = express.Router();


//get All Retail
router.get('/', authenticateToken, summaryController.getTottalDaily );
router.get('/daily-retail', authenticateToken, summaryController.getChartTotalAbsensi );

router.get('/total-fee', authenticateToken, summaryController.getTotalFee );

router.get('/total-feedaily', authenticateToken, summaryController.getTotalFeeDaily );


module.exports = router
