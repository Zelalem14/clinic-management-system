const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.post(
  '/',
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  visitController.createVisit
);

router.get(
  '/',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]),
  visitController.listVisits
);

router.get(
  '/:id',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]),
  visitController.getVisitById
);

router.put(
  '/:id/status',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]),
  visitController.updateVisitStatus
);

module.exports = router;
