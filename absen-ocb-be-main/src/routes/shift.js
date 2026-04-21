const express = require('express')
const authenticateToken = require('../middleware/authMiddleware.js');
const shiftingController = require('../controller/shift.controller');
const validasiShiftInput = require('../middleware/validasiShiftInput')
const router = express.Router();

//get All Shift
router.get('/', authenticateToken, shiftingController.getTypeShiftWithEmployes);
//get Detail Shift
router.post('/detail/:shiftingId', authenticateToken, shiftingController.getShiftDetail);
//Create New Shift
router.post('/create/', authenticateToken, validasiShiftInput, shiftingController.createNewShift);
//Update Shift
router.post('/update/:shiftingId', authenticateToken, validasiShiftInput, shiftingController.updateShift);
//Delete Shift
router.post('/delete/:shiftingId', authenticateToken, shiftingController.deleteShift);






module.exports = router