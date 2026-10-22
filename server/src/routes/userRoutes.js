const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// User administration (Admin only)
router.get('/', authorize([ROLES.ADMIN]), userController.listUsers);
router.post('/', authorize([ROLES.ADMIN]), userController.createUser);
router.put('/:id', authorize([ROLES.ADMIN]), userController.updateUser);

module.exports = router;
