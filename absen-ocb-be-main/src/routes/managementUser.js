const express = require('express');
const managementUserController = require('../controller/managementUser.controller.js');
const authenticateToken = require('../middleware/authMiddleware.js');

const router = express.Router()

//Read users - GET
router.get('/', authenticateToken, managementUserController.getAllRoleUser);
router.post('/addRoles', authenticateToken, managementUserController.createRoles);
router.get('/category', authenticateToken, managementUserController.getAllCategoryUser);
router.post('/addCategory', authenticateToken, managementUserController.createCategory);
router.post('/updateRole/:idRole', authenticateToken, managementUserController.updateRoles );
router.post('/updateCategory/:idCategory', authenticateToken, managementUserController.updateCategory );








module.exports = router