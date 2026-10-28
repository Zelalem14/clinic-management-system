const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Dashboard stats endpoint for all authenticated staff roles
router.get(
  '/dashboard',
  reportController.getDashboardStats
);

// Doctor Weekly Clinical Report
router.get(
  '/doctor-weekly',
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  reportController.getDoctorWeeklyReport
);

// Reception Weekly & Daily Analytics
router.get(
  '/reception-analytics',
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  reportController.getReceptionAnalytics
);

// Laboratory Analytics Report
router.get(
  '/laboratory-analytics',
  authorize([ROLES.LAB_TECH, ROLES.ADMIN, ROLES.DOCTOR]),
  reportController.getLaboratoryAnalytics
);

// Revenue alias
router.get(
  '/revenue',
  authorize([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  reportController.getDashboardStats
);

// Audit logs (Admin only)
router.get(
  '/audit-logs',
  authorize([ROLES.ADMIN]),
  reportController.getAuditLogs
);

module.exports = router;
