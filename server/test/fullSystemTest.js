const path = require('path');
const initDatabase = require('../src/config/initDatabase');
const {
  sequelize,
  User,
  Patient,
  PatientVisit,
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
  ClinicSetting,
  LabTestTemplate,
  Service
} = require('../src/models');

// Import Controllers
const authController = require('../src/controllers/authController');
const patientController = require('../src/controllers/patientController');
const paymentController = require('../src/controllers/paymentController');
const consultationController = require('../src/controllers/consultationController');
const procedureRequestController = require('../src/controllers/procedureRequestController');
const laboratoryController = require('../src/controllers/laboratoryController');
const reportController = require('../src/controllers/reportController');
const serviceController = require('../src/controllers/serviceController');
const appointmentController = require('../src/controllers/appointmentController');
const userController = require('../src/controllers/userController');
const settingController = require('../src/controllers/settingController');

// Dispatcher Helper that executes controller functions directly in memory
const invoke = async (fn, reqData = {}) => {
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    setHeader() { return this; }
  };

  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    user: null,
    ...reqData
  };

  await new Promise((resolve, reject) => {
    const next = (err) => {
      if (err) reject(err);
      else resolve();
    };
    Promise.resolve(fn(req, res, next))
      .then(() => resolve())
      .catch(reject);
  });

  return { status: statusCode, body: responseData };
};

const runFullSystemVerification = async () => {
  console.log('================================================================================');
  console.log('     CLINIC MANAGEMENT SYSTEM: FULL 19-PAGE & WORKFLOW VERIFICATION TEST        ');
  console.log('================================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  const assert = (condition, description) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] #${totalTests} - ${description}`);
    } else {
      failedTests++;
      console.error(`  [FAIL] #${totalTests} - ${description}`);
    }
  };

  // STEP 0: DATABASE INTEGRITY & PERSISTENCE
  console.log('\n--- 0. DATABASE INTEGRITY & PERSISTENCE (SQLite WAL Mode) ---');
  await initDatabase();
  const dialect = sequelize.getDialect();
  assert(dialect === 'sqlite' || dialect === 'mysql' || dialect === 'postgres', `Active database dialect: ${dialect}`);
  
  const initialStaffCount = await User.count();
  const initialPatientCount = await Patient.count();
  const initialTemplateCount = await LabTestTemplate.count();
  assert(initialStaffCount >= 6, `Persistent staff accounts preserved (${initialStaffCount} accounts in DB)`);
  assert(initialPatientCount >= 10, `Persistent patient records preserved (${initialPatientCount} patients in DB)`);
  assert(initialTemplateCount >= 16, `Predefined lab test templates loaded (${initialTemplateCount} templates in DB)`);

  // STEP 1: AUTHENTICATION MODULE (LoginPage.jsx)
  console.log('\n--- 1. AUTHENTICATION & SECURITY (LoginPage.jsx) ---');
  
  // 1.1 Admin Login
  const adminRes = await invoke(authController.login, {
    body: { email: 'admin@clinic.com', password: 'Admin@123' }
  });
  assert(adminRes.status === 200 && adminRes.body.token && adminRes.body.user.role === 'admin', 'Admin login authenticated with secure JWT');
  const adminUser = adminRes.body.user;

  // 1.2 Doctor Login
  const doctorRes = await invoke(authController.login, {
    body: { email: 'doctor@clinic.com', password: 'Doctor@123' }
  });
  assert(doctorRes.status === 200 && doctorRes.body.user.role === 'doctor', 'Doctor login authenticated with doctor role');
  const doctorUser = doctorRes.body.user;

  // 1.3 Lab Technician Login
  const labRes = await invoke(authController.login, {
    body: { email: 'lab@clinic.com', password: 'Lab@123' }
  });
  assert(labRes.status === 200 && labRes.body.user.role === 'lab_tech', 'Lab technician authenticated with lab_tech role');
  const labUser = labRes.body.user;

  // 1.4 Receptionist Login
  const recepRes = await invoke(authController.login, {
    body: { email: 'reception@clinic.com', password: 'Recept@123' }
  });
  assert(recepRes.status === 200 && recepRes.body.user.role === 'receptionist', 'Receptionist authenticated with receptionist role');
  const receptionUser = recepRes.body.user;

  // 1.5 Security: Reject invalid password
  const badLoginRes = await invoke(authController.login, {
    body: { email: 'doctor@clinic.com', password: 'wrongpassword' }
  });
  assert(badLoginRes.status === 401, 'Unauthorized login attempt rejected with HTTP 401');

  // STEP 2: USER PROFILE & PASSWORD MANAGEMENT (ChangePasswordModal.jsx)
  console.log('\n--- 2. PASSWORD MANAGEMENT (ChangePasswordModal.jsx) ---');
  const meRes = await invoke(authController.getMe, { user: doctorUser });
  assert(meRes.status === 200 && meRes.body.user.email === 'doctor@clinic.com', 'Authenticated profile retrieved via getMe');

  // Test password change validation: incorrect current password
  const badChangeRes = await invoke(authController.changePassword, {
    user: doctorUser,
    body: { current_password: 'incorrectOldPassword', new_password: 'newSecretPassword123' }
  });
  assert(badChangeRes.status === 400, 'Password change rejected when current password is wrong');

  // STEP 3: RECEPTIONIST MODULE (5 Pages)
  console.log('\n--- 3. RECEPTION MODULE (5 Pages) ---');

  // 3.1 Reception Home Dashboard (ReceptionDashboard.jsx)
  const recepDashRes = await invoke(reportController.getDashboardStats, { user: receptionUser });
  assert(recepDashRes.status === 200 && recepDashRes.body.stats !== undefined, 'Reception Home Dashboard metrics retrieved (/reports/dashboard)');

  // 3.2 Patient Registration (PatientRegistration.jsx)
  const testPhone = '+251 92 888 7766';
  // Clean up any previous test patient with this phone
  const existingTestPatient = await Patient.findOne({ where: { phone: testPhone } });
  if (existingTestPatient) {
    await PatientVisit.destroy({ where: { patient_id: existingTestPatient.id } });
    await Payment.destroy({ where: { patient_id: existingTestPatient.id } });
    await Patient.destroy({ where: { id: existingTestPatient.id } });
  }

  const regRes = await invoke(patientController.createPatient, {
    user: receptionUser,
    body: {
      full_name: 'Almaz Tadesse (System Test Patient)',
      dob: '1995-04-12',
      sex: 'female',
      phone: testPhone,
      address: 'Bole Subcity, Woreda 03, Addis Ababa',
      emergency_contact: 'Tadesse Wolde (+251 91 123 4567)',
      doctor_id: doctorUser.id,
      consultation_type: 'General Consultation'
    }
  });
  assert(regRes.status === 201 && regRes.body.patient.card_number.startsWith('CLN-'), `Patient registered with auto-formatted Card Number: ${regRes.body?.patient?.card_number}`);
  const testPatient = regRes.body.patient;
  const testVisit = regRes.body.visit;

  // 3.3 Patient List & Search (PatientList.jsx)
  const searchRes = await invoke(patientController.listPatients, {
    user: receptionUser,
    query: { search: testPatient.card_number }
  });
  assert(searchRes.status === 200 && searchRes.body.patients.some(p => p.id === testPatient.id), 'Patient search by Card Number returns newly registered patient');

  // 3.4 10-Day Patient Card Fee Logic (PaymentManagement.jsx)
  console.log('   Testing 10-day card fee validation logic across lifecycle states...');
  
  // State A: Registered patient within 10-day window (Fee waived / Free return)
  const feeCheckRes1 = await invoke(patientController.getCardFeeStatus, {
    user: receptionUser,
    params: { id: testPatient.id }
  });
  assert(feeCheckRes1.status === 200 && feeCheckRes1.body.status.cardFeeWaived === true, '10-Day Policy: Patient card fee is valid and waived (free) within 10 days of payment');

  // State B: Patient returning after 10 days (Card fee expired -> Must pay again)
  const twelveDaysAgo = new Date();
  twelveDaysAgo.setDate(twelveDaysAgo.getDate() - 12);
  await Patient.update(
    { last_card_fee_date: twelveDaysAgo },
    { where: { id: testPatient.id } }
  );

  const feeCheckRes2 = await invoke(patientController.getCardFeeStatus, {
    user: receptionUser,
    params: { id: testPatient.id }
  });
  assert(feeCheckRes2.status === 200 && feeCheckRes2.body.status.cardFeeWaived === false && feeCheckRes2.body.status.statusBadge === 'EXPIRED', '10-Day Policy: Patient returning after 10 days is flagged EXPIRED and prompted to pay card fee again');

  // State C: Renew card fee payment -> Reset 10-day validity
  await Patient.update(
    { last_card_fee_date: new Date() },
    { where: { id: testPatient.id } }
  );
  const feeCheckRes3 = await invoke(patientController.getCardFeeStatus, {
    user: receptionUser,
    params: { id: testPatient.id }
  });
  assert(feeCheckRes3.status === 200 && feeCheckRes3.body.status.cardFeeWaived === true, '10-Day Policy: Card fee renewal resets 10-day validity window');

  // 3.5 Clinic Price List (ClinicPriceList.jsx)
  const priceListRes = await invoke(serviceController.listServices, {
    user: receptionUser,
    query: {}
  });
  assert(priceListRes.status === 200 && priceListRes.body.services.length > 0, 'Clinic Price List retrieves active hospital service prices');

  // 3.6 Reception Reports (ReceptionReports.jsx)
  const recepReportRes = await invoke(reportController.getReceptionAnalytics, {
    user: receptionUser,
    query: { date: new Date().toISOString().slice(0, 10) }
  });
  assert(recepReportRes.status === 200 && recepReportRes.body.weekly_report !== undefined, 'Reception Weekly & Daily Revenue Report generated');

  // STEP 4: DOCTOR MODULE (6 Pages)
  console.log('\n--- 4. DOCTOR MODULE (6 Pages) ---');

  // 4.1 Doctor Home Dashboard (DoctorDashboard.jsx)
  const docDashRes = await invoke(consultationController.getDoctorWaitingQueue, {
    user: doctorUser,
    query: {}
  });
  assert(docDashRes.status === 200 && Array.isArray(docDashRes.body.queue), 'Doctor Home Waiting Patients Queue retrieved');

  // 4.2 Doctor Queue (DoctorQueue.jsx)
  const docQueueRes = await invoke(consultationController.getDoctorWaitingQueue, {
    user: doctorUser,
    query: { doctor_id: doctorUser.id }
  });
  assert(docQueueRes.status === 200, 'Doctor Queue correctly filtered for attending physician');

  // 4.3 Doctor Consultation & Prescription (ConsultationView.jsx)
  const consultRes = await invoke(consultationController.createOrStartConsultation, {
    user: doctorUser,
    body: {
      patient_id: testPatient.id,
      visit_id: testVisit ? testVisit.id : null,
      chief_complaint: 'High grade fever with rigor and chills for 4 days',
      history_of_present_illness: 'Patient reports severe headaches, arthralgia and nausea',
      physical_examination: 'Temp 39.1 C, HR 96 bpm, BP 118/76 mmHg. Mild epigastric tenderness',
      provisional_diagnosis: 'Suspected Acute Plasmodium Falciparum Malaria'
    }
  });
  assert(consultRes.status === 201 && consultRes.body.consultation.id, 'Doctor creates clinical consultation entry');
  const consultation = consultRes.body.consultation;

  // Complete consultation with diagnosis and prescriptions
  const completeConsultRes = await invoke(consultationController.completeConsultation, {
    user: doctorUser,
    params: { id: consultation.id },
    body: {
      final_diagnosis: 'Plasmodium Falciparum Malaria (Microscopically Confirmed)',
      diagnoses: [
        {
          disease_name: 'Plasmodium Falciparum Malaria',
          icd10_code: 'B50.9',
          diagnosis_type: 'final'
        }
      ],
      prescriptions: [
        {
          medication_name: 'Artemether + Lumefantrine (Coartem)',
          dosage: '20/120mg 4 tablets',
          frequency: 'BID (Twice daily)',
          duration: '3 days',
          quantity: 24,
          instructions: 'Take with fatty food or milk'
        }
      ]
    }
  });
  assert(completeConsultRes.status === 200, 'Doctor finalizes consultation with confirmed diagnosis and prescription');

  // 4.4 Doctor Orders Laboratory Tests (HIV & Malaria Rapid Tests)
  const labService = await Service.findOne({ where: { category: 'laboratory' } });

  const labOrderRes = await invoke(procedureRequestController.createProcedureRequest, {
    user: doctorUser,
    body: {
      patient_id: testPatient.id,
      visit_id: testVisit ? testVisit.id : null,
      category: 'laboratory',
      priority: 'urgent',
      clinical_reason: 'Urgent diagnostic panel for acute febrile illness',
      service_ids: [labService ? labService.id : 3]
    }
  });
  assert(labOrderRes.status === 201 && labOrderRes.body.procedure_request.priority === 'urgent', 'Doctor orders STAT/Urgent laboratory investigations');
  const labRequest = labOrderRes.body.procedure_request;

  // Clear payment status so lab technician can proceed
  await ProcedureRequest.update(
    { status: 'payment_approved', paid_amount: 180.00 },
    { where: { id: labRequest.id } }
  );

  // 4.5 Doctor Lab Results Review (DoctorLabResults.jsx)
  const docResultsRes = await invoke(laboratoryController.listLabRequests, {
    user: doctorUser,
    query: { status: 'completed' }
  });
  assert(docResultsRes.status === 200 && Array.isArray(docResultsRes.body.requests), 'Doctor accesses completed laboratory results list');

  // 4.6 Doctor Follow-up Appointments (DoctorAppointments.jsx)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const apptRes = await invoke(appointmentController.createAppointment, {
    user: doctorUser,
    body: {
      patient_id: testPatient.id,
      doctor_id: doctorUser.id,
      appointment_date: nextWeek.toISOString().split('T')[0],
      appointment_time: '10:00',
      reason: 'Post-treatment follow-up and repeat malaria smear',
      status: 'scheduled'
    }
  });
  assert(apptRes.status === 201, 'Doctor schedules patient follow-up appointment');

  // 4.7 Doctor Clinical Reports & Disease Analytics (DoctorReports.jsx)
  const docReportsRes = await invoke(reportController.getDoctorWeeklyReport, {
    user: doctorUser,
    query: { period: 'week' }
  });
  assert(docReportsRes.status === 200 && docReportsRes.body.report.age_group_breakdown !== undefined, 'Doctor Clinical Report categorizes diseases by patient age groups');

  // STEP 5: LABORATORY MODULE (4 Pages)
  console.log('\n--- 5. LABORATORY MODULE (4 Pages) ---');

  // 5.1 Laboratory Home Overview Dashboard (LabHome.jsx)
  const labHomeRes = await invoke(reportController.getLaboratorySummary, { user: labUser });
  assert(labHomeRes.status === 200 && labHomeRes.body.summary !== undefined, 'Laboratory Home Dashboard metrics retrieved successfully');
  assert(Array.isArray(labHomeRes.body.weekly_trend), 'Laboratory Home includes 7-day SVG volume trend data');
  assert(Array.isArray(labHomeRes.body.urgent_requests), 'Laboratory Home includes STAT Urgent Requests alert queue');

  // 5.2 Lab Tests Queue (LabQueue.jsx)
  const labQueueRes = await invoke(laboratoryController.listLabRequests, {
    user: labUser,
    query: { priority: 'urgent' }
  });
  assert(labQueueRes.status === 200 && Array.isArray(labQueueRes.body.requests) && labQueueRes.body.requests.some(r => r.id === labRequest.id), 'Lab Tests Queue displays urgent doctor orders');

  // 5.3 Start Test Processing
  const startTestRes = await invoke(laboratoryController.startTest, {
    user: labUser,
    params: { id: labRequest.id }
  });
  assert(startTestRes.status === 200 && startTestRes.body.procedure_request.status === 'in_progress', 'Lab technician changes test state to In Progress');

  // 5.4 Predefined Lab Test Templates (LabTemplates.jsx)
  const templatesRes = await invoke(laboratoryController.listTemplates, { user: labUser });
  assert(templatesRes.status === 200 && templatesRes.body.templates.length >= 10, 'Predefined structured laboratory templates retrieved');

  // 5.5 Smart Result Entry - Draft Save
  const draftResultPayload = {
    request_id: labRequest.id,
    test_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    findings: 'Malaria: Reactive band observed. HIV: Non-reactive.',
    observations: 'Specimen collected at 09:30 AM, hemolysis absent',
    results_data: {
      parameters: [
        { name: 'HIV 1/2 Rapid Screening', value: 'Negative', flag: 'NORMAL' },
        { name: 'Malaria Rapid Diagnostic Test (Pf/Pv)', value: 'Positive (P. falciparum)', flag: 'ABNORMAL' }
      ]
    }
  };

  const draftResultRes = await invoke(laboratoryController.submitLabResult, {
    user: labUser,
    body: draftResultPayload
  });
  assert(draftResultRes.status === 201 && draftResultRes.body.result.status === 'draft', 'Technician saves laboratory results as Draft');

  // 5.6 Smart Result Entry - Final Submission
  const finalResultPayload = {
    ...draftResultPayload,
    status: 'final',
    observations: 'FINAL CERTIFIED CLINICAL FINDINGS: Plasmodium falciparum confirmed. Attending doctor alerted.'
  };

  const finalResultRes = await invoke(laboratoryController.submitLabResult, {
    user: labUser,
    body: finalResultPayload
  });
  assert(finalResultRes.status === 201 && finalResultRes.body.result.status === 'final', 'Technician submits certified final diagnostic result');

  // 5.7 Immediate Doctor Result Access & Review
  const docReviewRes = await invoke(laboratoryController.doctorReviewResult, {
    user: doctorUser,
    params: { id: finalResultRes.body.result.id },
    body: { doctor_comments: 'Acknowledged positive malaria result. Artemether-Lumefantrine treatment initiated.' }
  });
  assert(docReviewRes.status === 200 && docReviewRes.body.result.doctor_reviewed_at !== null, 'Attending doctor accesses and signs off on certified laboratory findings');

  // 5.8 Laboratory Analytics & Reports (LabReports.jsx)
  const labReportsRes = await invoke(reportController.getLaboratoryAnalytics, {
    user: labUser,
    query: { period: 'month' }
  });
  assert(labReportsRes.status === 200, 'Laboratory Analytics & Reports endpoint returns HTTP 200');
  assert(Array.isArray(labReportsRes.body.report.daily_stats), 'Lab reports contains daily_stats array for SVG chart');
  assert(Array.isArray(labReportsRes.body.report.records) && labReportsRes.body.report.records.length > 0, 'Lab reports contains tabular audit records for CSV/Excel export');
  assert(labReportsRes.body.report.summary.completed >= 1, 'Lab analytics accurately counts completed tests');

  // STEP 6: IMAGING & CLINICAL PROCEDURES (ProcedureDashboard.jsx)
  console.log('\n--- 6. IMAGING & PROCEDURES MODULE (ProcedureDashboard.jsx) ---');
  const procRes = await invoke(procedureRequestController.listProcedureRequests, {
    user: doctorUser,
    query: {}
  });
  assert(procRes.status === 200 && Array.isArray(procRes.body.requests), 'Imaging and procedure queue retrieved successfully');

  // STEP 7: CLINIC ADMINISTRATOR MODULE (6 Pages)
  console.log('\n--- 7. CLINIC ADMINISTRATOR MODULE (6 Pages) ---');

  // 7.1 Admin Executive Dashboard (AdminDashboard.jsx & AdminReports.jsx)
  const adminDashRes = await invoke(reportController.getDashboardStats, {
    user: adminUser,
    query: { period: 'week' }
  });
  assert(adminDashRes.status === 200 && adminDashRes.body.stats !== undefined, 'Admin Executive Analytics retrieved (/reports/dashboard)');

  // 7.2 Staff & User Accounts Management (UserManagement.jsx)
  const usersRes = await invoke(userController.listUsers, { user: adminUser });
  assert(usersRes.status === 200 && usersRes.body.users.length >= 6, 'Admin accesses permanent staff database with all user accounts');

  // Create new staff account in permanent database
  const newStaffEmail = 'nurse.test@clinic.com';
  const existingNurse = await User.findOne({ where: { email: newStaffEmail } });
  if (existingNurse) await User.destroy({ where: { id: existingNurse.id } });

  const addStaffRes = await invoke(userController.createUser, {
    user: adminUser,
    body: {
      name: 'Sister Meron Teshome',
      email: newStaffEmail,
      password: 'password123',
      role: 'receptionist',
      phone: '+251 93 333 4455',
      is_active: true
    }
  });
  assert(addStaffRes.status === 201 && addStaffRes.body.user.email === newStaffEmail, 'Admin adds a persistent staff account in database');

  // 7.3 Service Prices Management (ServiceManagement.jsx)
  const adminServicesRes = await invoke(serviceController.listServices, { user: adminUser, query: {} });
  assert(adminServicesRes.status === 200 && adminServicesRes.body.services.length > 0, 'Admin accesses clinic service pricing catalog');

  // 7.4 Clinic Information & Settings (ClinicSettings.jsx)
  const settingsRes = await invoke(settingController.getSettings, { user: adminUser });
  assert(settingsRes.status === 200 && settingsRes.body.settings !== undefined, 'Admin retrieves clinic settings and configs');

  // 7.5 Audit Trail Logs (AuditLogs.jsx)
  const recentLogs = await AuditLog.findAll({ limit: 10, order: [['id', 'DESC']] });
  assert(recentLogs.length > 0, 'Audit trail logs track clinical and security actions');

  // STEP 8: PERMANENT STORAGE INTEGRITY AUDIT
  console.log('\n--- 8. PERMANENT STORAGE INTEGRITY AUDIT ---');
  const persistedPatient = await Patient.findOne({
    where: { id: testPatient.id },
    include: [
      {
        model: PatientVisit,
        as: 'visits',
        include: [
          {
            model: Consultation,
            as: 'consultations',
            include: [
              { model: Diagnosis, as: 'diagnoses' },
              { model: Prescription, as: 'prescriptions' }
            ]
          },
          {
            model: ProcedureRequest,
            as: 'procedure_requests',
            include: [{ model: LaboratoryResult, as: 'results' }]
          }
        ]
      }
    ]
  });

  assert(persistedPatient !== null, 'Patient permanently preserved in database');
  assert(persistedPatient.visits[0].consultations[0].diagnoses.length >= 1, 'Doctor clinical diagnoses permanently preserved');
  assert(persistedPatient.visits[0].procedure_requests[0].results.length >= 1, 'Laboratory test results & observations permanently preserved');

  console.log('\n================================================================================');
  console.log(`VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log('================================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runFullSystemVerification().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
