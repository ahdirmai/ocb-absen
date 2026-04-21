const express = require('express');
const versionController = require('../controller/version.controller');


const router = express.Router()



router.get('/', versionController.getLatestVersion);











module.exports = router