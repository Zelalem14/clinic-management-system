const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.post(
  '/',
  authorize([ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN]),
  appointmentController.createAppointment
);

router.get(
  '/',
  authorize([ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN]),
  appointmentController.listAppointments
);

router.put(
  '/:id',
  authorize([ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.ADMIN]),
  appointmentController.updateAppointment
);

module.exports = router;
