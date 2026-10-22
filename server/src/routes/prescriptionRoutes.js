const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.post(
  '/',
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  prescriptionController.createPrescription
);

router.get(
  '/',
  authorize([ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  prescriptionController.listPrescriptions
);

router.get(
  '/:id',
  authorize([ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  prescriptionController.getPrescriptionById
);

router.put(
  '/:id/status',
  authorize([ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  prescriptionController.updatePrescriptionStatus
);

module.exports = router;
