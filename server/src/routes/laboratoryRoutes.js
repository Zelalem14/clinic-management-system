const express = require('express');
const router = express.Router();
const laboratoryController = require('../controllers/laboratoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.get(
  '/requests',
  authorize([ROLES.LAB_TECH, ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  laboratoryController.listLabRequests
);

router.post(
  '/start/:id',
  authorize([ROLES.LAB_TECH, ROLES.ADMIN]),
  laboratoryController.startTest
);

router.post(
  '/results',
  authorize([ROLES.LAB_TECH, ROLES.ADMIN, ROLES.DOCTOR]),
  laboratoryController.submitLabResult
);

router.get(
  '/results/:id',
  authorize([ROLES.LAB_TECH, ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  laboratoryController.getLabResultById
);

module.exports = router;
