const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Registration & patient list accessible by Receptionist, Doctor, and Admin
router.post(
  '/',
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  patientController.createPatient
);

router.get(
  '/',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECH]),
  patientController.listPatients
);

router.get(
  '/:id',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECH]),
  patientController.getPatientById
);

router.put(
  '/:id',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]),
  patientController.updatePatient
);

router.get(
  '/:id/medical-history',
  authorize([ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  patientController.getMedicalHistory
);

module.exports = router;
