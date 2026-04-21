const express = require('express')
const authenticateToken = require('../middleware/authMiddleware.js');
const absenManagementController = require('../controller/absenManagement.controller')
const validateAbsenManagementInput = require('../middleware/validasiAbsenManagement')
const router = express.Router();


//get All Type Absen
router.get('/', authenticateToken, absenManagementController.getTypeAbsenWithGroups );
//get Detail Absen 
router.post('/detail/:absenId',  authenticateToken, absenManagementController.getTypeAbsen );
//create New Type Absen
router.post('/create', authenticateToken, validateAbsenManagementInput, absenManagementController.createNewAbsenType );
//update Type Absen
router.post('/update/:absenId', authenticateToken ,  absenManagementController.updateAbsenType);
//Delete Type Absen
router.post('/delete/:absenId', authenticateToken, absenManagementController.deleteTypeAbsen);

router.post('/shift-user/:userId', authenticateToken, absenManagementController.getTypeAbsenPerShift);




module.exports = router