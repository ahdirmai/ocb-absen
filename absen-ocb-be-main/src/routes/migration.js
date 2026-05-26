const router = require('express').Router();
const migrationAuth = require('../middleware/migrationAuth');
const ctrl = require('../controller/migration.controller');

router.get('/retail', migrationAuth, ctrl.getRetail);
router.get('/user-categories', migrationAuth, ctrl.getUserCategories);
router.get('/users', migrationAuth, ctrl.getUsers);
router.get('/shifts', migrationAuth, ctrl.getShifts);
router.get('/absen-categories', migrationAuth, ctrl.getAbsenCategories);

module.exports = router;
