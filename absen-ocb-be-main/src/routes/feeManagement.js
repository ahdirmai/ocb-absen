const express = require('express');
const authenticateToken = require('../middleware/authMiddleware.js');

const feeController = require('../controller/feeManagement.controller');
const router = express.Router();


//get All Retail
router.get('/offday', authenticateToken, feeController.getOffDaytWithEmployes);
router.get('/bonus', authenticateToken, feeController.getBonustWithEmployes);
router.get('/type-off', authenticateToken, feeController.getTypeOff);
router.get('/type-pb', authenticateToken, feeController.getTypePB);
router.post('/addoffday', authenticateToken, feeController.createOffDay);
router.post('/addbonus', authenticateToken, feeController.createBonus);
router.post('/updateoffday/:idOffday', authenticateToken, feeController.updateOffDay );
router.post('/updatebonus/:bonusID', authenticateToken, feeController.updateBonus );
router.post('/deleteoffday/:offID', authenticateToken, feeController.deleteOffDay );
router.post('/deletebonus/:bonusID', authenticateToken, feeController.deleteBonus );
router.get('/fee-karyawan', authenticateToken, feeController.getSalaryKaryawan );
router.get('/fee-karyawan-history', authenticateToken, feeController.getSalaryKaryawanByMonth );
router.get('/potongan', authenticateToken, feeController.getPotongan );
router.post('/update-potongan/:potonganID', authenticateToken, feeController.updatePotongan );







// router.get('/total-fee', authenticateToken);


module.exports = router
