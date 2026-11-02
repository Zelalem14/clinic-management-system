const express = require('express');
const router = express.Router();
const laboratoryController = require('../controllers/laboratoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// ---------------------------------------------
// Laboratory Test Templates Management
// ---------------------------------------------
router.get(
  '/templates',
  authorize([ROLES.LAB_TECH, ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  laboratoryController.listTemplates
);

router.get(
  '/template-for-test',
  authorize([ROLES.LAB_TECH, ROLES.DOCTOR, ROLES.ADMIN]),
  laboratoryController.getMatchedTemplate
);

router.get(
  '/templates/:code',
  authorize([ROLES.LAB_TECH, ROLES.DOCTOR, ROLES.ADMIN]),
  laboratoryController.getTemplateByCode
);

router.post(
  '/templates',
  authorize([ROLES.ADMIN, ROLES.LAB_TECH]),
  laboratoryController.createTemplate
);

router.put(
  '/templates/:id',
  authorize([ROLES.ADMIN, ROLES.LAB_TECH]),
  laboratoryController.updateTemplate
);

// ---------------------------------------------
// Laboratory Queue & Result Processing
// ---------------------------------------------
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

router.post(
  '/results/:id/review',
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  laboratoryController.doctorReviewResult
);

router.put(
  '/assign/:id',
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.LAB_TECH]),
  laboratoryController.assignTechnician
);

module.exports = router;
