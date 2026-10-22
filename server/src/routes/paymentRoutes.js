const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.get(
  '/',
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR]),
  paymentController.listPayments
);

router.get(
  '/:id',
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR]),
  paymentController.getPaymentById
);

// Receptionist & Admin approve payments
router.post(
  '/:id/approve',
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  paymentController.approvePayment
);

module.exports = router;
