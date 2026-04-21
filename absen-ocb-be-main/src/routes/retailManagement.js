const express = require('express');
const authenticateToken = require('../middleware/authMiddleware.js');
const validateRetailInput = require('../middleware/validasiRetailInput');
const retailManagementController = require('../controller/retailManagement.controller');
const router = express.Router();


//get All Retail
router.get('/', authenticateToken, retailManagementController.getAllRetail );
//get Detail retail 
router.post('/detail/:retailId',  authenticateToken, retailManagementController.getRetail );
//create New retail
router.post('/create', authenticateToken, validateRetailInput, retailManagementController.createNewRetail );
//update Retail
router.post('/update/:retailId', authenticateToken ,  retailManagementController.updateRetail);
//Delete Retail
router.post('/delete/:retailId', authenticateToken, retailManagementController.deleteRetail);

module.exports = router
