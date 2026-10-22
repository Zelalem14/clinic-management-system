const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Doctor waiting queue
router.get(
  '/queue',
  authorize([ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  consultationController.getDoctorWaitingQueue
);

router.post(
  '/',
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  consultationController.createOrStartConsultation
);

router.get(
  '/:id',
  authorize([ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  consultationController.getConsultationById
);

router.put(
  '/:id',
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  consultationController.updateConsultation
);

router.post(
  '/:id/complete',
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  consultationController.completeConsultation
);

module.exports = router;
