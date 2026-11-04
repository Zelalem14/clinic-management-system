const path = require('path');
const { execSync } = require('child_process');
const initDatabase = require('../src/config/initDatabase');
const {
  sequelize,
  User,
  Service,
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
  PrescriptionItem
} = require('../src/models');
const authController = require('../src/controllers/authController');
const patientController = require('../src/controllers/patientController');

// Direct Controller In-Memory Invoker
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

const runLifecycleTest = async () => {
  console.log('========================================================================');
  console.log('   PERMANENT PATIENT RECORD STORAGE & RESTART LIFECYCLE TEST            ');
  console.log('========================================================================\n');

  // STEP 1: Connect to database
  console.log('[Step 1] Connecting to database...');
  await initDatabase();
  const dialect = sequelize.getDialect();
  console.log(`Connected to database dialect: ${dialect}`);

  const initialCount = await Patient.count();
  console.log(`Initial patient count in database: ${initialCount}`);

  // STEP 2: Authenticate Receptionist
  console.log('\n[Step 2] Authenticating receptionist account...');
  const loginRes = await invoke(authController.login, {
    body: { email: 'reception@clinic.com', password: 'Recept@123' }
  });
  if (loginRes.status !== 200) {
    throw new Error('Receptionist login failed: ' + JSON.stringify(loginRes.body));
  }
  const receptionistUser = loginRes.body.user;
  console.log(`Logged in as: ${receptionistUser.name} (${receptionistUser.role})`);

  // STEP 3: Register a New Patient (INSERT Operation)
  console.log('\n[Step 3] Registering a new patient in the database (INSERT)...');
  const testPhone = '+251 98 765 4321';
  const testFullName = 'Kebede Worku (Persistence Verification Patient)';

  // Clean previous run if present
  const existing = await Patient.findOne({ where: { phone: testPhone } });
  if (existing) {
    console.log(`Cleaning old test patient: ${existing.card_number}`);
    await PatientVisit.destroy({ where: { patient_id: existing.id } });
    await Payment.destroy({ where: { patient_id: existing.id } });
    await Patient.destroy({ where: { id: existing.id } });
  }

  const registerRes = await invoke(patientController.createPatient, {
    user: receptionistUser,
    body: {
      full_name: testFullName,
      dob: '1988-09-20',
      sex: 'male',
      phone: testPhone,
      address: 'Yeka Subcity, Addis Ababa',
      emergency_contact: 'Worku Tola (Father) - +251 91 222 3344',
      consultation_type: 'General Medical Consultation',
      allergies: 'None reported',
      medical_history: 'None',
      approve_payment_now: true
    }
  });

  if (registerRes.status !== 201 || !registerRes.body.patient) {
    throw new Error('Patient registration failed: ' + JSON.stringify(registerRes.body));
  }

  const createdPatient = registerRes.body.patient;
  const createdVisit = registerRes.body.visit;
  const createdPayment = registerRes.body.payment;

  console.log(`✔ Patient saved to database: ${createdPatient.full_name}`);
  console.log(`✔ Card Number generated: ${createdPatient.card_number} (ID: ${createdPatient.id})`);
  console.log(`✔ Visit record generated: Visit #${createdVisit.id}`);
  console.log(`✔ Payment record generated: Receipt #${createdPayment.receipt_number}`);

  // STEP 4: Query Patient (SELECT Operation)
  console.log('\n[Step 4] Querying patient from database (SELECT)...');
  const selectRes = await invoke(patientController.getPatientById, {
    user: receptionistUser,
    params: { id: createdPatient.id }
  });

  if (selectRes.status !== 200 || !selectRes.body.patient) {
    throw new Error('Patient SELECT query failed: ' + JSON.stringify(selectRes.body));
  }
  console.log(`✔ Confirmed SELECT: Found Card #${selectRes.body.patient.card_number} matching name "${selectRes.body.patient.full_name}"`);

  // STEP 5: Update Patient (UPDATE Operation)
  console.log('\n[Step 5] Updating patient address and contact in database (UPDATE)...');
  const updateRes = await invoke(patientController.updatePatient, {
    user: receptionistUser,
    params: { id: createdPatient.id },
    body: {
      address: 'Kirkos Subcity, House 402, Addis Ababa',
      allergies: 'Penicillin allergy noted on exam'
    }
  });

  if (updateRes.status !== 200 || updateRes.body.patient.address !== 'Kirkos Subcity, House 402, Addis Ababa') {
    throw new Error('Patient UPDATE failed: ' + JSON.stringify(updateRes.body));
  }
  console.log('✔ Confirmed UPDATE: Address and allergies updated successfully in database.');

  // STEP 6: Save Complete Clinical Encounter Records (Consultation, Diagnosis, Prescription, Lab)
  console.log('\n[Step 6] Saving clinical consultation, prescription, and laboratory records...');
  const doctor = await User.findOne({ where: { email: 'doctor@clinic.com' } });
  const labTech = await User.findOne({ where: { email: 'lab@clinic.com' } });

  const consultation = await Consultation.create({
    visit_id: createdVisit.id,
    patient_id: createdPatient.id,
    doctor_id: doctor ? doctor.id : 1,
    symptoms: 'Fever (38.8C), chills, generalized body weakness, and throbbing headache for 3 days.',
    examination_findings: 'Febrile, alert, no signs of meningism.',
    diagnosis: 'Acute Febrile Illness - Suspected Plasmodium falciparum Malaria',
    treatment_plan: 'Ordered STAT Malaria RDT and Complete Blood Count. Oral rehydration advised.',
    clinical_notes: 'Patient advised to rest and stay hydrated pending diagnostic blood film confirmation.'
  });

  await Diagnosis.create({
    consultation_id: consultation.id,
    patient_id: createdPatient.id,
    code: 'B54',
    description: 'Acute Febrile Illness - Suspected Plasmodium falciparum Malaria',
    type: 'provisional'
  });

  const prescription = await Prescription.create({
    consultation_id: consultation.id,
    visit_id: createdVisit.id,
    patient_id: createdPatient.id,
    doctor_id: doctor ? doctor.id : 1,
    status: 'prescribed',
    notes: 'Coartem 20/120mg pending lab verification'
  });

  await PrescriptionItem.create({
    prescription_id: prescription.id,
    medication_name: 'Paracetamol',
    dosage: '1000mg',
    frequency: 'TDS (3x daily as needed)',
    duration: '3 days',
    route: 'Oral',
    quantity: 10,
    instructions: 'Take after meals for fever relief'
  });

  const labRequest = await ProcedureRequest.create({
    visit_id: createdVisit.id,
    patient_id: createdPatient.id,
    doctor_id: doctor ? doctor.id : 1,
    technician_id: labTech ? labTech.id : 1,
    category: 'laboratory',
    priority: 'urgent',
    status: 'results_ready',
    clinical_reason: 'R/O Acute Malaria infection',
    total_cost: 180.00
  });

  await LaboratoryResult.create({
    request_id: labRequest.id,
    patient_id: createdPatient.id,
    technician_id: labTech ? labTech.id : 1,
    test_name: 'Malaria Rapid Diagnostic Test (RDT) & Blood Film',
    status: 'final',
    findings: 'RDT: Plasmodium falciparum POSITIVE',
    observations: 'Thin blood smear confirms ring form trophozoites of P. falciparum.',
    doctor_comments: 'Initiate Artemether/Lumefantrine treatment immediately. Repeat smear in 48 hours.',
    doctor_reviewed_at: new Date(),
    completed_at: new Date()
  });

  console.log('✔ All clinical sub-records attached to patient encounter.');

  // STEP 7: Flush WAL to disk and update portable JSON snapshot
  console.log('\n[Step 7] FLUSHING WAL TO PERMANENT DISK AND CREATING PERSISTENCE SNAPSHOT...');
  if (sequelize.checkpointDatabase) {
    await sequelize.checkpointDatabase();
  }
  const { createBackup } = require('../src/services/backupService');
  await createBackup();
  console.log('✔ All pending database transactions flushed directly into clinic.sqlite and JSON dump.');

  // STEP 8: RESTART IN SEPARATE PROCESS (True Cold Reboot)
  console.log('\n[Step 8] SPAWNING COLD REBOOT PROCESS TO VERIFY ZERO-MEMORY DATA RETRIEVAL...');
  const verifyScript = path.join(__dirname, 'verifyRestart.js');

  try {
    execSync(`node "${verifyScript}" "${createdPatient.card_number}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (rebootErr) {
    console.error('Cold reboot verification process failed:', rebootErr.message);
    process.exit(1);
  }

  // STEP 9: Test Patient Deletion (DELETE Operation)
  console.log('\n[Step 9] Testing authorized patient record deletion (DELETE)...');
  const adminLoginRes = await invoke(authController.login, {
    body: { email: 'admin@clinic.com', password: 'Admin@123' }
  });
  const adminUser = adminLoginRes.body.user;

  const deleteRes = await invoke(patientController.deletePatient, {
    user: adminUser,
    params: { id: createdPatient.id }
  });

  if (deleteRes.status !== 200) {
    throw new Error('Patient DELETE operation failed: ' + JSON.stringify(deleteRes.body));
  }
  console.log(`✔ Confirmed DELETE: ${deleteRes.body.message}`);

  const verifyDeleted = await Patient.findByPk(createdPatient.id);
  if (verifyDeleted !== null) {
    throw new Error('Patient still found in database after delete!');
  }
  console.log('✔ Confirmed: Patient record successfully removed from database.');

  console.log('\n========================================================================');
  console.log('ALL VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
  console.log('Patient records are permanently stored and preserved across server restarts.');
  console.log('========================================================================\n');
  process.exit(0);
};

runLifecycleTest().catch((err) => {
  console.error('\n❌ Lifecycle verification failed:', err);
  process.exit(1);
});
