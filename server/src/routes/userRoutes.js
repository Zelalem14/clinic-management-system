const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// User listing allowed for Admin and staff dropdowns (Receptionist, Doctor, Lab Tech)
router.get('/', authorize([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.LAB_TECH]), userController.listUsers);
router.post('/', authorize([ROLES.ADMIN]), userController.createUser);
router.put('/:id', authorize([ROLES.ADMIN]), userController.updateUser);
router.delete('/:id', authorize([ROLES.ADMIN]), userController.deleteUser);

module.exports = router;
