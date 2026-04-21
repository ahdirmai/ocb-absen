const express = require('express');
const menuController = require('../controller/menu.controller.js');
const authenticateToken = require('../middleware/authMiddleware.js');

const router = express.Router()

//Read users - GET
router.get('/category/:idCategory', authenticateToken, menuController.getMenuCategoryUser);
router.get('/category', authenticateToken, menuController.getAllMenuCategory);
router.get('/', authenticateToken, menuController.getAllMenu);
router.post('/add-config', authenticateToken, menuController.createMenuConfig);
router.post('/update-config/:idMenuConfig', authenticateToken, menuController.updateMenuConfig );
router.post('/delete-config/:idMenuConfig', authenticateToken, menuController.deleteMenuConfig );










module.exports = router