const path = require('path');
const {
  sequelize,
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
  User,
  Service
} = require('../src/models');
const initDatabase = require('../src/config/initDatabase');

const runPersistenceLifecycleTest = async () => {
  console.log('========================================================================');
  console.log('CLINIC PERMANENT STORAGE & SERVER RESTART VERIFICATION TEST');
  console.log('========================================================================\n');

  // STEP 0: Initialize database
  console.log('[Step 0] Initializing database connection...');
  await initDatabase();
  console.log(`Connected to database dialect: ${sequelize.getDialect()}`);

  const testPhone = '+251 91 777 6655';
  const testName = 'Bethlehem Haile (Persistence Test Patient)';

  // Clean up previous test run if any
  const previousTest = await Patient.findOne({ where: { phone: testPhone } });
  if (previousTest) {
    console.log(`Cleaning previous test patient: ${previousTest.card_number}`);
    await PatientVisit.destroy({ where: { patient_id: previousTest.id } });
    await Payment.destroy({ where: { patient_id: previousTest.id } });
    await Patient.destroy({ where: { id: previousTest.id } });
  }

  // STEP 1: Register a new patient
  console.log('\n[Step 1] Registering a new patient in the database...');
  const currentYear = new Date().getFullYear();
  const lastPatient = await Patient.findOne({
    where: { card_number: { [require('sequelize').Op.like]: `CLN-${currentYear}-%` } },
    order: [['id', 'DESC']]
  });

  let nextSeq = 1;
  if (lastPatient && lastPatient.card_number) {
    const parts = lastPatient.card_number.split('-');
    if (parts.length === 3 && !isNaN(parseInt(parts[2], 10))) {
      nextSeq = parseInt(parts[2], 10) + 1;
    }
  }
  const generatedCard = `CLN-${currentYear}-${String(nextSeq).padStart(4, '0')}`;

  const patient = await Patient.create({
    card_number: generatedCard,
    full_name: testName,
    dob: '1995-04-12',
    age: 31,
    sex: 'female',
    phone: testPhone,
    address: 'Bole Sub-City, Woreda 04, Addis Ababa',
    emergency_contact: 'Haile Wolde (Father) - +251 91 111 2233',
    consultation_type: 'General Consultation',
    registration_date: new Date(),
    last_card_fee_date: new Date(),
    allergies: 'None reported',
    medical_history: 'No prior chronic conditions',
    current_medications: 'None',
    status: 'active'
  });
  console.log(`✔ Patient saved to database: ${patient.full_name} with Card #${patient.card_number} (ID: ${patient.id})`);

  // STEP 2: Add payment information
  console.log('\n[Step 2] Adding payment and fee allocation records...');
  const receptionist = await User.findOne({ where: { email: 'reception@clinic.com' } });
  const cardService = await Service.findOne({ where: { service_code: 'SRV-CARD-01' } });
  const consultService = await Service.findOne({ where: { service_code: 'SRV-CONS-01' } });

  const receiptNum = `REC-TEST-${Date.now().toString().slice(-6)}`;
  const payment = await Payment.create({
    patient_id: patient.id,
    receipt_number: receiptNum,
    total_amount: 500.00,
    amount_paid: 500.00,
    payment_method: 'telebirr',
    status: 'approved',
    approved_by: receptionist ? receptionist.id : 1,
    approved_at: new Date(),
    transaction_reference: 'TB-987654321',
    notes: 'Registration Card Fee (150 ETB) and Consultation Fee (350 ETB)'
  });

  if (cardService) {
    await PaymentAllocation.create({
      payment_id: payment.id,
      service_id: cardService.id,
      allocation_type: 'card_fee',
      amount: 150.00
    });
  }
  if (consultService) {
    await PaymentAllocation.create({
      payment_id: payment.id,
      service_id: consultService.id,
      allocation_type: 'consultation_fee',
      amount: 350.00
    });
  }
  console.log(`✔ Payment recorded: ${payment.receipt_number} (${payment.total_amount} ETB via ${payment.payment_method})`);

  // STEP 3: Assign the patient to a doctor & create visit
  console.log('\n[Step 3] Assigning patient to doctor & opening outpatient encounter...');
  const doctor = await User.findOne({ where: { email: 'doctor@clinic.com' } });
  const visit = await PatientVisit.create({
    patient_id: patient.id,
    doctor_id: doctor ? doctor.id : 1,
    visit_date: new Date(),
    visit_type: 'Outpatient',
    status: 'in_consultation',
    notes: 'Initial clinical assessment for persistent fever and headache.'
  });
  // Link payment to visit
  payment.visit_id = visit.id;
  await payment.save();
  console.log(`✔ Patient assigned to Dr. Abebe Kebede (Visit ID: ${visit.id})`);

  // STEP 4: Save the doctor's diagnosis, clinical notes, and prescription
  console.log("\n[Step 4] Saving doctor's clinical consultation, diagnosis, and prescription...");
  const consultation = await Consultation.create({
    visit_id: visit.id,
    patient_id: patient.id,
    doctor_id: doctor ? doctor.id : 1,
    symptoms: 'Fever (38.8C), chills, generalized body weakness, and throbbing headache for 3 days.',
    examination_findings: 'Febrile, alert, no signs of meningism. Spleen palpable 1cm below costal margin.',
    diagnosis: 'Acute Febrile Illness - Suspected Plasmodium falciparum Malaria',
    treatment_plan: 'Ordered STAT Malaria RDT and Complete Blood Count. Oral rehydration advised.',
    clinical_notes: 'Patient advised to rest and stay hydrated pending diagnostic blood film confirmation.'
  });

  const diagnosis = await Diagnosis.create({
    consultation_id: consultation.id,
    patient_id: patient.id,
    code: 'B54',
    description: 'Acute Febrile Illness - Suspected Plasmodium falciparum Malaria',
    type: 'provisional'
  });

  const prescription = await Prescription.create({
    consultation_id: consultation.id,
    visit_id: visit.id,
    patient_id: patient.id,
    doctor_id: doctor ? doctor.id : 1,
    status: 'prescribed',
    notes: 'Coartem (Artemether/Lumefantrine) 20/120mg pending lab verification'
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
  console.log(`✔ Clinical consultation and primary diagnosis recorded (Diagnosis: ${diagnosis.description})`);

  // STEP 5: Add a laboratory request and result
  console.log('\n[Step 5] Adding laboratory request and recording verified test result...');
  const labTech = await User.findOne({ where: { email: 'lab@clinic.com' } });
  const malariaService = await Service.findOne({ where: { service_code: 'LAB-MAL-01' } });

  const labRequest = await ProcedureRequest.create({
    visit_id: visit.id,
    patient_id: patient.id,
    doctor_id: doctor ? doctor.id : 1,
    technician_id: labTech ? labTech.id : 1,
    category: 'laboratory',
    priority: 'urgent',
    status: 'results_ready',
    clinical_reason: 'R/O Acute Malaria infection',
    total_cost: 180.00
  });

  if (malariaService) {
    await ProcedureRequestItem.create({
      request_id: labRequest.id,
      service_id: malariaService.id,
      item_price: 180.00,
      status: 'completed'
    });
  }

  const labResult = await LaboratoryResult.create({
    request_id: labRequest.id,
    patient_id: patient.id,
    technician_id: labTech ? labTech.id : 1,
    test_name: 'Malaria Rapid Diagnostic Test (RDT) & Blood Film',
    status: 'final',
    findings: 'RDT: Plasmodium falciparum POSITIVE; Blood Film: P. falciparum ring stages identified (Density: ++)',
    observations: 'Thin blood smear confirms ring form trophozoites of P. falciparum. No mixed species identified.',
    doctor_comments: 'Initiate Artemether/Lumefantrine treatment immediately. Repeat smear in 48 hours.',
    doctor_reviewed_at: new Date(),
    completed_at: new Date(),
    results_data: {
      template_code: 'TMPL-MALARIA',
      template_name: 'Malaria Rapid Diagnostic Test (RDT) & Blood Film Smear',
      department: 'Parasitology',
      specimen_type: 'Capillary / Venous Whole Blood',
      parameters: [
        { id: 'rdt_result', name: 'Malaria RDT', value: 'Positive (P. falciparum)', flag: 'POSITIVE', unit: '', ref_range_text: 'Negative' },
        { id: 'species', name: 'Parasite Species', value: 'Plasmodium falciparum', flag: 'POSITIVE', unit: '', ref_range_text: 'No hemoparasites' },
        { id: 'density', name: 'Parasitemia Density', value: 'Moderate (++)', flag: 'ABNORMAL', unit: '', ref_range_text: 'Negative' }
      ]
    }
  });
  console.log(`✔ Laboratory result recorded & finalized: ${labResult.test_name} [${labResult.status}]`);

  // STEP 6: Complete server stop simulation
  console.log('\n[Step 6] SIMULATING COMPLETE BACKEND SERVER SHUTDOWN...');
  console.log('Closing all database connection pools and clearing memory cache...');
  await sequelize.close();
  console.log('✔ Database connection completely closed. In-memory state terminated.');

  // Wait 1.5 seconds to ensure file locks are released
  await new Promise(r => setTimeout(r, 1500));

  // STEP 7, 8, 9, 10: Restart server via new process and verify
  console.log('\n[Step 7 & 8] RESTARTING BACKEND SERVER & RECONNECTING IN COLD PROCESS...');
  const { execSync } = require('child_process');
  const verifyOutput = execSync(`node test/verifyRestart.js "${generatedCard}"`, {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8'
  });
  console.log(verifyOutput);

  process.exit(0);
};

runPersistenceLifecycleTest().catch(err => {
  console.error('\n❌ PERSISTENCE TEST FAILED:', err);
  process.exit(1);
});
