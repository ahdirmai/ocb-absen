const express = require('express');
const UserController = require('../controller/user.controller.js');
const authenticateToken = require('../middleware/authMiddleware.js');
const validateUserInput = require('../middleware/validateUserInput');
const checkImei = require('../middleware/checkImei');
const validasiLoginDashboard = require('../middleware/validasiLoginDashboard.js');
const upload = require('../middleware/multerProfile')

const router = express.Router()
//Create Users - POST
router.post('/login', checkImei, UserController.loginUser)

router.post('/login-dashboard', validasiLoginDashboard, UserController.loginUserDashboard)

router.post('/create',authenticateToken, upload.single('photo_url'), UserController.createNewUsers)

//Read users - GET
router.get('/', authenticateToken, UserController.getAllUsers)

router.get('/under-upline/:idUser', authenticateToken, UserController.getUserUpline)


//Update users - PATCH
router.post('/update/:idUser', authenticateToken, upload.single('photo_url'), UserController.updateUsers)

//Delete users - Delete
router.post('/delete/:idUser', authenticateToken,  UserController.deleteUsers)
//Logout  Users
router.post('/logout', authenticateToken, UserController.logoutUser);

//user Profile
router.post('/profile/:idUser', authenticateToken, UserController.profileUsers)
router.post('/profile-web/:idUser', authenticateToken, UserController.profileUsersWeb)

router.get('/roles-with-categories', authenticateToken, UserController.getRolesWithCategories);

router.get('/roles', authenticateToken, UserController.getRoles);

router.get('/category-user/:idRole', authenticateToken,  UserController.getCategories);

router.get('/category-alluser', authenticateToken,  UserController.getAllCategories);

router.post('/change-password', authenticateToken,  UserController.changePassword);








module.exports = router