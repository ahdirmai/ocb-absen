const express = require('express');
const authenticateToken = require('../middleware/authMiddleware.js');
const kpiSalaryController = require('../controller/kpiSalary.controller');

const router = express.Router();

router.get('/salary-with-kpi', authenticateToken, kpiSalaryController.getSalaryWithKpi);
router.get('/kpi-teams', authenticateToken, kpiSalaryController.getKpiTeams);

module.exports = router;
