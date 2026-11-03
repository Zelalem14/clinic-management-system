const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.get('/', settingController.getSettings);
router.put('/', authorize([ROLES.ADMIN]), settingController.updateSettings);

// Database Backup & Recovery Endpoints
router.get('/backups', authorize([ROLES.ADMIN]), settingController.getBackups);
router.post('/backups', authorize([ROLES.ADMIN]), settingController.createManualBackup);

module.exports = router;
