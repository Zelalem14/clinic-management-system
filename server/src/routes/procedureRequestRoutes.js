const express = require('express');
const router = express.Router();
const procedureRequestController = require('../controllers/procedureRequestController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.post(
  '/',
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  procedureRequestController.createProcedureRequest
);

router.get(
  '/',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECH]),
  procedureRequestController.listProcedureRequests
);

router.get(
  '/:id',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECH]),
  procedureRequestController.getProcedureRequestById
);

router.put(
  '/:id/status',
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.LAB_TECH]),
  procedureRequestController.updateProcedureRequestStatus
);

module.exports = router;
