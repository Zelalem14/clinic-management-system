const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// All staff can view services and their configured prices
router.get(
  '/',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECH]),
  serviceController.listServices
);

router.get(
  '/:id',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECH]),
  serviceController.getServiceById
);

// Only Administrator can create, update, or deactivate services and alter prices
router.post(
  '/',
  authorize([ROLES.ADMIN]),
  serviceController.createService
);

router.put(
  '/:id',
  authorize([ROLES.ADMIN]),
  serviceController.updateService
);

router.delete(
  '/:id',
  authorize([ROLES.ADMIN]),
  serviceController.deleteService
);

module.exports = router;
