const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  DOCTOR: 'doctor',
  LAB_TECH: 'lab_tech'
};

const VISIT_STATUS = {
  REGISTERED: 'registered',
  WAITING_CONSULTATION: 'waiting_consultation',
  IN_CONSULTATION: 'in_consultation',
  LAB_PENDING: 'lab_pending',
  RESULTS_READY: 'results_ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const REQUEST_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',
  PAYMENT_APPROVED: 'payment_approved',
  IN_PROGRESS: 'in_progress',
  RESULTS_READY: 'results_ready',
  SENT_TO_DOCTOR: 'sent_to_doctor',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  INSURANCE: 'insurance',
  OTHER: 'other'
};

const SERVICE_CATEGORIES = {
  CARD_REGISTRATION: 'card_registration',
  CONSULTATION: 'consultation',
  LABORATORY: 'laboratory',
  ULTRASOUND: 'ultrasound',
  X_RAY: 'x_ray',
  PROCEDURE: 'procedure',
  OTHER: 'other'
};

const CONSULTATION_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

const PRESCRIPTION_STATUS = {
  ACTIVE: 'active',
  DISPENSED: 'dispensed',
  CANCELLED: 'cancelled'
};

const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

module.exports = {
  ROLES,
  VISIT_STATUS,
  REQUEST_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  SERVICE_CATEGORIES,
  CONSULTATION_STATUS,
  PRESCRIPTION_STATUS,
  APPOINTMENT_STATUS
};
