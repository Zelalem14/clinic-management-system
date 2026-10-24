const sequelize = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const PatientVisit = require('./PatientVisit');
const Service = require('./Service');
const Payment = require('./Payment');
const PaymentAllocation = require('./PaymentAllocation');
const Consultation = require('./Consultation');
const Diagnosis = require('./Diagnosis');
const ProcedureRequest = require('./ProcedureRequest');
const ProcedureRequestItem = require('./ProcedureRequestItem');
const LaboratoryResult = require('./LaboratoryResult');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const Appointment = require('./Appointment');
const AuditLog = require('./AuditLog');
const ClinicSetting = require('./ClinicSetting');

// Patient <-> PatientVisit
Patient.hasMany(PatientVisit, { foreignKey: 'patient_id', as: 'visits' });
PatientVisit.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// PatientVisit <-> Doctor
User.hasMany(PatientVisit, { foreignKey: 'doctor_id', as: 'assigned_visits' });
PatientVisit.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// Consultation
PatientVisit.hasMany(Consultation, { foreignKey: 'visit_id', as: 'consultations' });
Consultation.belongsTo(PatientVisit, { foreignKey: 'visit_id', as: 'visit' });

Patient.hasMany(Consultation, { foreignKey: 'patient_id', as: 'consultations' });
Consultation.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

User.hasMany(Consultation, { foreignKey: 'doctor_id', as: 'doctor_consultations' });
Consultation.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// Diagnosis
Consultation.hasMany(Diagnosis, { foreignKey: 'consultation_id', as: 'diagnoses' });
Diagnosis.belongsTo(Consultation, { foreignKey: 'consultation_id', as: 'consultation' });

Patient.hasMany(Diagnosis, { foreignKey: 'patient_id', as: 'diagnoses' });
Diagnosis.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Procedure Requests
PatientVisit.hasMany(ProcedureRequest, { foreignKey: 'visit_id', as: 'procedure_requests' });
ProcedureRequest.belongsTo(PatientVisit, { foreignKey: 'visit_id', as: 'visit' });

Patient.hasMany(ProcedureRequest, { foreignKey: 'patient_id', as: 'procedure_requests' });
ProcedureRequest.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

User.hasMany(ProcedureRequest, { foreignKey: 'doctor_id', as: 'doctor_requests' });
ProcedureRequest.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

User.hasMany(ProcedureRequest, { foreignKey: 'technician_id', as: 'assigned_requests' });
ProcedureRequest.belongsTo(User, { foreignKey: 'technician_id', as: 'technician' });

// ProcedureRequest <-> ProcedureRequestItem
ProcedureRequest.hasMany(ProcedureRequestItem, { foreignKey: 'request_id', as: 'items', onDelete: 'CASCADE' });
ProcedureRequestItem.belongsTo(ProcedureRequest, { foreignKey: 'request_id', as: 'request' });

Service.hasMany(ProcedureRequestItem, { foreignKey: 'service_id', as: 'request_items' });
ProcedureRequestItem.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// LaboratoryResult
ProcedureRequest.hasMany(LaboratoryResult, { foreignKey: 'request_id', as: 'results' });
LaboratoryResult.belongsTo(ProcedureRequest, { foreignKey: 'request_id', as: 'request' });

ProcedureRequestItem.hasMany(LaboratoryResult, { foreignKey: 'request_item_id', as: 'results' });
LaboratoryResult.belongsTo(ProcedureRequestItem, { foreignKey: 'request_item_id', as: 'item' });

Patient.hasMany(LaboratoryResult, { foreignKey: 'patient_id', as: 'laboratory_results' });
LaboratoryResult.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

User.hasMany(LaboratoryResult, { foreignKey: 'technician_id', as: 'technician_results' });
LaboratoryResult.belongsTo(User, { foreignKey: 'technician_id', as: 'technician' });

User.hasMany(LaboratoryResult, { foreignKey: 'verified_by', as: 'verified_results' });
LaboratoryResult.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });

// Payments
Patient.hasMany(Payment, { foreignKey: 'patient_id', as: 'payments' });
Payment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

PatientVisit.hasMany(Payment, { foreignKey: 'visit_id', as: 'payments' });
Payment.belongsTo(PatientVisit, { foreignKey: 'visit_id', as: 'visit' });

User.hasMany(Payment, { foreignKey: 'approved_by', as: 'approved_payments' });
Payment.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Payment Allocations
Payment.hasMany(PaymentAllocation, { foreignKey: 'payment_id', as: 'allocations', onDelete: 'CASCADE' });
PaymentAllocation.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

Service.hasMany(PaymentAllocation, { foreignKey: 'service_id', as: 'allocations' });
PaymentAllocation.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

ProcedureRequest.hasMany(PaymentAllocation, { foreignKey: 'procedure_request_id', as: 'payment_allocations' });
PaymentAllocation.belongsTo(ProcedureRequest, { foreignKey: 'procedure_request_id', as: 'procedure_request' });

// Prescriptions
Consultation.hasMany(Prescription, { foreignKey: 'consultation_id', as: 'prescriptions' });
Prescription.belongsTo(Consultation, { foreignKey: 'consultation_id', as: 'consultation' });

Patient.hasMany(Prescription, { foreignKey: 'patient_id', as: 'prescriptions' });
Prescription.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

User.hasMany(Prescription, { foreignKey: 'doctor_id', as: 'doctor_prescriptions' });
Prescription.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescription_id', as: 'items', onDelete: 'CASCADE' });
PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescription_id', as: 'prescription' });

// Appointments
Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

User.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'doctor_appointments' });
Appointment.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });

// Audit Logs
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Patient,
  PatientVisit,
  Service,
  Payment,
  PaymentAllocation,
  Consultation,
  Diagnosis,
  ProcedureRequest,
  ProcedureRequestItem,
  LaboratoryResult,
  Prescription,
  PrescriptionItem,
  Appointment,
  AuditLog,
  ClinicSetting
};
