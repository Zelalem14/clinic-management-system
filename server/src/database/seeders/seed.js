const {
  sequelize,
  User,
  Service,
  ClinicSetting,
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
  AuditLog
} = require('../../models');
const { ROLES, VISIT_STATUS, REQUEST_STATUS, PAYMENT_STATUS, SERVICE_CATEGORIES } = require('../../config/constants');

const seedDatabase = async (force = true) => {
  try {
    if (force) {
      console.log('Synchronizing database models with force: true...');
      await sequelize.sync({ force: true });
    } else {
      console.log('Synchronizing database models safely without dropping existing tables...');
      await sequelize.sync();
    }
    console.log('Database synced successfully.');

    // 1. Seed Ethiopian Demo Users
    console.log('Seeding Ethiopian staff user accounts...');
    const admin = await User.create({
      name: 'Hussien Seid (Administrator)',
      email: 'admin@clinic.com',
      password: 'Admin@123',
      role: ROLES.ADMIN,
      phone: '+251 91 100 0001',
      is_active: true
    });

    const receptionist = await User.create({
      name: 'Meron Alemu',
      email: 'reception@clinic.com',
      password: 'Recept@123',
      role: ROLES.RECEPTIONIST,
      phone: '+251 91 100 0002',
      is_active: true
    });

    const doctor = await User.create({
      name: 'Dr. Abebe Kebede, MD',
      email: 'doctor@clinic.com',
      password: 'Doctor@123',
      role: ROLES.DOCTOR,
      phone: '+251 91 100 0003',
      is_active: true
    });

    const labTech = await User.create({
      name: 'Assefa Zegeye, MLS',
      email: 'lab@clinic.com',
      password: 'Lab@123',
      role: ROLES.LAB_TECH,
      phone: '+251 91 100 0004',
      is_active: true
    });

    // 2. Seed Clinic Settings in Ethiopian Birr
    console.log('Seeding clinic configuration (Ethiopian Birr - ETB)...');
    await ClinicSetting.create({
      clinic_name: 'Tena Community Specialty Clinic & Diagnostic Center',
      address: 'Bole Sub-City, Africa Avenue, Addis Ababa, Ethiopia',
      phone: '+251 11 661 2345',
      email: 'info@tenaclinic.et',
      currency_symbol: 'ETB',
      receipt_footer: 'እናመሰግናለን! Thank you for visiting Tena Specialty Clinic. Wishing you swift recovery!'
    });

    // 3. Seed Services with Ethiopian Birr (ETB) pricing
    console.log('Seeding medical services and standard Ethiopian Birr pricing...');
    const servicesData = [
      // Registration & Cards
      {
        service_code: 'SRV-CARD-01',
        service_name: 'Patient File & Digital Card Registration',
        category: SERVICE_CATEGORIES.CARD_REGISTRATION,
        description: 'New patient registration, medical record opening and ID card',
        price: 150.00,
        is_active: true
      },
      // Consultations
      {
        service_code: 'SRV-CONS-01',
        service_name: 'General Medical Consultation',
        category: SERVICE_CATEGORIES.CONSULTATION,
        description: 'Clinical evaluation and physical examination by General Practitioner',
        price: 350.00,
        is_active: true
      },
      {
        service_code: 'SRV-CONS-02',
        service_name: 'Specialist Physician Consultation',
        category: SERVICE_CATEGORIES.CONSULTATION,
        description: 'In-depth consultation with specialized medical doctor',
        price: 600.00,
        is_active: true
      },
      // Laboratory Tests
      {
        service_code: 'LAB-CBC-01',
        service_name: 'Complete Blood Count (CBC / FBC)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Automated 5-part differential blood cell counter evaluating anemia and infection',
        price: 350.00,
        is_active: true
      },
      {
        service_code: 'LAB-MAL-01',
        service_name: 'Malaria Rapid Diagnostic Test (RDT) & Smear',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Plasmodium falciparum antigen detection and blood film microscopy',
        price: 200.00,
        is_active: true
      },
      {
        service_code: 'LAB-GLU-01',
        service_name: 'Fasting Blood Glucose (FBG)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Serum glucose measurement to evaluate diabetes mellitus and glycemic control',
        price: 180.00,
        is_active: true
      },
      {
        service_code: 'LAB-LIP-01',
        service_name: 'Lipid Profile Panel',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Total Cholesterol, HDL, LDL, and Triglycerides assessment',
        price: 550.00,
        is_active: true
      },
      {
        service_code: 'LAB-URI-01',
        service_name: 'Urinalysis (10-Parameter Dipstick & Micro)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Urine chemistry strip and microscopic sediment examination',
        price: 150.00,
        is_active: true
      },
      {
        service_code: 'LAB-WID-01',
        service_name: 'Widal Typhoid Agglutination Test',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Salmonella antibody titers for enteric fever screening',
        price: 250.00,
        is_active: true
      },
      {
        service_code: 'LAB-LFT-01',
        service_name: 'Liver Function Test Panel (LFT)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'ALT, AST, ALP, Bilirubin, and Total Protein',
        price: 650.00,
        is_active: true
      },
      {
        service_code: 'LAB-STL-01',
        service_name: 'Stool Routine Examination & Microscopy',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Ova, parasite, and cysts microscopic examination for intestinal infections',
        price: 150.00,
        is_active: true
      },
      {
        service_code: 'LAB-HPY-01',
        service_name: 'H. Pylori Stool Antigen Test',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Rapid chromatographic immunoassay for Helicobacter pylori detection',
        price: 300.00,
        is_active: true
      }
    ];

    const services = await Service.bulkCreate(servicesData);
    const serviceMap = {};
    services.forEach(s => {
      serviceMap[s.service_code] = s;
    });

    // 4. Seed Ethiopian Patients across Real Clinical Stages
    console.log('Seeding realistic patient journeys with Ethiopian names...');

    // Patient 1: Dawit Tadesse - Registration + Consultation fee approved (Waiting for Dr. Abebe Kebede)
    const p1 = await Patient.create({
      card_number: 'CLN-2026-0001',
      full_name: 'Dawit Tadesse',
      dob: '1982-05-14',
      age: 44,
      sex: 'male',
      phone: '+251 91 234 5678',
      address: 'Kirkos Sub-City, Woreda 03, Addis Ababa',
      emergency_contact: 'Tirhas Gebre (Wife) - +251 91 234 9988',
      consultation_type: 'General Consultation',
      registration_date: new Date().toISOString().slice(0, 10),
      allergies: 'Penicillin (mild rash)',
      medical_history: 'Hypertension (mild), Gastritis',
      current_medications: 'Amlodipine 5mg once daily',
      notes: 'Reports recurring tension headaches and episodic dizziness over the last 3 days.'
    });

    const v1 = await PatientVisit.create({
      patient_id: p1.id,
      visit_date: new Date(),
      status: VISIT_STATUS.WAITING_CONSULTATION,
      notes: 'Checked in by Meron Alemu. Vitals recorded: BP 135/85 mmHg, Pulse 74 bpm.'
    });

    const pay1 = await Payment.create({
      visit_id: v1.id,
      patient_id: p1.id,
      receipt_number: 'REC-20261022-1001',
      total_amount: 500.00,
      amount_paid: 500.00,
      payment_method: 'cash',
      status: PAYMENT_STATUS.APPROVED,
      approved_by: receptionist.id,
      approved_at: new Date(),
      transaction_reference: 'CASH-ETB-001',
      notes: 'Card fee (150 ETB) + Doctor consultation fee (350 ETB)'
    });

    await PaymentAllocation.create({
      payment_id: pay1.id,
      service_id: serviceMap['SRV-CARD-01'].id,
      allocation_type: 'card_fee',
      amount: 150.00
    });
    await PaymentAllocation.create({
      payment_id: pay1.id,
      service_id: serviceMap['SRV-CONS-01'].id,
      allocation_type: 'consultation_fee',
      amount: 350.00
    });

    // Patient 2: Almaz Bekele - In consultation with Dr. Abebe. Ordered CBC + Malaria RDT. Payment approved -> Lab Tech Assefa Zegeye queue!
    const p2 = await Patient.create({
      card_number: 'CLN-2026-0002',
      full_name: 'Almaz Bekele',
      dob: '1995-09-21',
      age: 31,
      sex: 'female',
      phone: '+251 92 345 6789',
      address: 'Yeka Sub-City, Megenagna, Addis Ababa',
      emergency_contact: 'Bekele Worku (Father) - +251 92 345 0012',
      consultation_type: 'General Consultation',
      registration_date: new Date().toISOString().slice(0, 10),
      allergies: 'No known drug allergies (NKDA)',
      medical_history: 'None significant',
      current_medications: 'None',
      notes: 'High fever, severe chills, fatigue and joint pain for 48 hours.'
    });

    const v2 = await PatientVisit.create({
      patient_id: p2.id,
      doctor_id: doctor.id,
      visit_date: new Date(),
      status: VISIT_STATUS.LAB_PENDING,
      notes: 'Temp 39.2°C, Chills. Referred by Dr. Abebe Kebede to Lab for acute febrile workup.'
    });

    await Consultation.create({
      visit_id: v2.id,
      patient_id: p2.id,
      doctor_id: doctor.id,
      consultation_date: new Date(),
      symptoms: 'Sudden onset high grade fever (39.2°C), intermittent rigors, profuse sweating, headache, generalized myalgia.',
      examination_findings: 'Febrile, flushed facies. Chest clear. Abdomen soft, mild RUQ tenderness.',
      diagnosis: 'Acute Febrile Illness - Rule out Malaria / Typhoid',
      treatment_plan: 'Ordered stat CBC and Malaria RDT. Awaiting Assefa Zegeye lab results.',
      clinical_notes: 'Urgent lab testing indicated. Patient given paracetamol and hydrated.',
      status: 'in_progress'
    });

    // Procedure Request for Patient 2: CBC (350 ETB) + Malaria RDT (200 ETB) = 550 ETB
    const procReq2 = await ProcedureRequest.create({
      visit_id: v2.id,
      patient_id: p2.id,
      doctor_id: doctor.id,
      category: SERVICE_CATEGORIES.LABORATORY,
      clinical_reason: 'Fever 39.2C with rigors. Rule out malaria and leukocytosis.',
      priority: 'urgent',
      status: REQUEST_STATUS.PAYMENT_APPROVED, // Paid & approved, waiting for Assefa Zegeye to start
      total_cost: 550.00,
      paid_amount: 550.00
    });

    await ProcedureRequestItem.create({
      request_id: procReq2.id,
      service_id: serviceMap['LAB-CBC-01'].id,
      unit_price: 350.00,
      status: 'paid'
    });
    await ProcedureRequestItem.create({
      request_id: procReq2.id,
      service_id: serviceMap['LAB-MAL-01'].id,
      unit_price: 200.00,
      status: 'paid'
    });

    const pay2 = await Payment.create({
      visit_id: v2.id,
      patient_id: p2.id,
      receipt_number: 'REC-20261022-1002',
      total_amount: 550.00,
      amount_paid: 550.00,
      payment_method: 'mobile_money',
      status: PAYMENT_STATUS.APPROVED,
      approved_by: receptionist.id,
      approved_at: new Date(),
      transaction_reference: 'TELEBIRR-88912',
      notes: 'Procedure fee approved: CBC (350 ETB) + Malaria RDT (200 ETB)'
    });

    await PaymentAllocation.create({
      payment_id: pay2.id,
      service_id: serviceMap['LAB-CBC-01'].id,
      procedure_request_id: procReq2.id,
      allocation_type: 'laboratory_fee',
      amount: 350.00
    });
    await PaymentAllocation.create({
      payment_id: pay2.id,
      service_id: serviceMap['LAB-MAL-01'].id,
      procedure_request_id: procReq2.id,
      allocation_type: 'laboratory_fee',
      amount: 200.00
    });

    // Patient 3: Yohannes Haile - Lab test COMPLETED by Assefa Zegeye -> Ready for Dr. Abebe Kebede review!
    const p3 = await Patient.create({
      card_number: 'CLN-2026-0003',
      full_name: 'Yohannes Haile',
      dob: '1970-12-08',
      age: 56,
      sex: 'male',
      phone: '+251 93 456 7890',
      address: 'Arada Sub-City, Piazza, Addis Ababa',
      emergency_contact: 'Senait Haile (Daughter) - +251 93 456 2233',
      consultation_type: 'General Consultation',
      registration_date: new Date().toISOString().slice(0, 10),
      allergies: 'Sulfa drugs (rash)',
      medical_history: 'Type 2 Diabetes Mellitus, Dyslipidemia',
      current_medications: 'Metformin 850mg BD',
      notes: 'Marked polydipsia, frequent urination, fatigue and visual blurriness.'
    });

    const v3 = await PatientVisit.create({
      patient_id: p3.id,
      doctor_id: doctor.id,
      visit_date: new Date(),
      status: VISIT_STATUS.RESULTS_READY,
      notes: 'Lab test results completed by Assefa Zegeye. Awaiting Dr. Abebe Kebede review.'
    });

    await Consultation.create({
      visit_id: v3.id,
      patient_id: p3.id,
      doctor_id: doctor.id,
      consultation_date: new Date(),
      symptoms: 'Marked thirst, increased urination frequency, fatigue, recent weight loss.',
      examination_findings: 'BMI 28.5 kg/m2. BP 130/80 mmHg.',
      diagnosis: 'Type 2 Diabetes Mellitus with Suboptimal Glycemic Control',
      treatment_plan: 'Ordered Fasting Blood Glucose and Urinalysis. Re-evaluate therapy based on findings.',
      status: 'in_progress'
    });

    const procReq3 = await ProcedureRequest.create({
      visit_id: v3.id,
      patient_id: p3.id,
      doctor_id: doctor.id,
      category: SERVICE_CATEGORIES.LABORATORY,
      clinical_reason: 'Evaluate fasting glucose and check for glucosuria/ketonuria.',
      priority: 'routine',
      status: REQUEST_STATUS.SENT_TO_DOCTOR,
      total_cost: 330.00,
      paid_amount: 330.00
    });

    const fbgItem = await ProcedureRequestItem.create({
      request_id: procReq3.id,
      service_id: serviceMap['LAB-GLU-01'].id,
      unit_price: 180.00,
      status: 'completed'
    });
    const uriItem = await ProcedureRequestItem.create({
      request_id: procReq3.id,
      service_id: serviceMap['LAB-URI-01'].id,
      unit_price: 150.00,
      status: 'completed'
    });

    await LaboratoryResult.create({
      request_id: procReq3.id,
      request_item_id: fbgItem.id,
      patient_id: p3.id,
      technician_id: labTech.id,
      test_name: 'Fasting Blood Glucose (FBG)',
      findings: 'Serum Glucose: 245 mg/dL (Reference Range: 70 - 99 mg/dL)',
      results_data: JSON.stringify({ parameter: 'Fasting Blood Glucose', value: '245 mg/dL', reference: '70-99 mg/dL', interpretation: 'Markedly Elevated' }),
      observations: 'Sample run in duplicate. Verified by Assefa Zegeye.',
      status: 'final',
      completed_at: new Date(),
      verified_by: labTech.id
    });

    await LaboratoryResult.create({
      request_id: procReq3.id,
      request_item_id: uriItem.id,
      patient_id: p3.id,
      technician_id: labTech.id,
      test_name: 'Urinalysis (10-Parameter)',
      findings: 'Glucose: 3+ (Positive), Ketones: Negative, Protein: Trace, Leukocytes: Negative, Nitrite: Negative',
      results_data: JSON.stringify({ glucose: '3+', ketones: 'Negative', protein: 'Trace' }),
      observations: 'Marked glucosuria detected. No signs of urinary tract infection.',
      status: 'final',
      completed_at: new Date(),
      verified_by: labTech.id
    });

    // Patient 4: Selamawit Desta - Fully COMPLETED consultation with Prescriptions & Follow-up
    const p4 = await Patient.create({
      card_number: 'CLN-2026-0004',
      full_name: 'Selamawit Desta',
      dob: '2000-03-12',
      age: 26,
      sex: 'female',
      phone: '+251 94 567 8901',
      address: 'Lideta Sub-City, Addis Ababa',
      emergency_contact: 'Desta Alemayehu (Father) - +251 94 567 3344',
      consultation_type: 'General Consultation',
      registration_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      allergies: 'None',
      medical_history: 'None',
      current_medications: 'None',
      notes: 'Severe sore throat, difficulty swallowing, fever.'
    });

    const v4 = await PatientVisit.create({
      patient_id: p4.id,
      doctor_id: doctor.id,
      visit_date: new Date(Date.now() - 86400000),
      status: VISIT_STATUS.COMPLETED,
      notes: 'Consultation concluded by Dr. Abebe Kebede. Treatment commenced.'
    });

    const c4 = await Consultation.create({
      visit_id: v4.id,
      patient_id: p4.id,
      doctor_id: doctor.id,
      consultation_date: new Date(Date.now() - 86400000),
      symptoms: 'Severe dysphagia, fever 38.4°C, tender neck swelling.',
      examination_findings: 'Pharyngeal erythema with tonsillar exudates. Tender anterior cervical lymph nodes.',
      diagnosis: 'Acute Follicular Tonsillitis',
      treatment_plan: 'Oral antibiotic course, analgesic, warm saline gargles.',
      clinical_notes: 'Bacterial etiology suspected.',
      status: 'completed',
      completed_at: new Date()
    });

    await Diagnosis.create({
      consultation_id: c4.id,
      patient_id: p4.id,
      code: 'J03.90',
      description: 'Acute tonsillitis, unspecified',
      type: 'final'
    });

    const pres4 = await Prescription.create({
      consultation_id: c4.id,
      patient_id: p4.id,
      doctor_id: doctor.id,
      status: 'active',
      instructions: 'Complete the full antibiotic course even when symptoms improve.'
    });

    await PrescriptionItem.create({
      prescription_id: pres4.id,
      medication_name: 'Amoxicillin / Clavulanate (Augmentin)',
      dosage: '625 mg',
      frequency: 'TDS (Every 8 hours)',
      duration: '7 days',
      route: 'Oral',
      instructions: 'Take immediately after food.',
      quantity: 21
    });

    await PrescriptionItem.create({
      prescription_id: pres4.id,
      medication_name: 'Paracetamol',
      dosage: '1000 mg (2 tablets)',
      frequency: 'TDS (Every 8 hours PRN)',
      duration: '5 days',
      route: 'Oral',
      instructions: 'For pain and fever.',
      quantity: 20
    });

    await Appointment.create({
      patient_id: p4.id,
      doctor_id: doctor.id,
      appointment_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      appointment_time: '10:00 AM',
      type: 'follow_up',
      notes: 'Review tonsillitis resolution with Dr. Abebe Kebede.',
      status: 'scheduled'
    });

    // Patient 5: Chala Gemeda - Newly registered, PENDING payment at reception (Demonstrating Meron Alemu approval workflow)
    const p5 = await Patient.create({
      card_number: 'CLN-2026-0005',
      full_name: 'Chala Gemeda',
      dob: '2019-07-15',
      age: 7,
      sex: 'male',
      phone: '+251 95 678 9012',
      address: 'Kolfe Keranio Sub-City, Addis Ababa',
      emergency_contact: 'Gemeda Tufa (Father) - +251 95 678 4455',
      consultation_type: 'Pediatric Consultation',
      registration_date: new Date().toISOString().slice(0, 10),
      allergies: 'None',
      medical_history: 'Asthma (mild)',
      current_medications: 'Salbutamol inhaler PRN',
      notes: 'Child presenting with dry nocturnal cough and wheezing following cold.'
    });

    const v5 = await PatientVisit.create({
      patient_id: p5.id,
      visit_date: new Date(),
      status: VISIT_STATUS.REGISTERED, // Awaiting fee approval from Meron Alemu
      notes: 'Patient registered. Awaiting counter fee confirmation.'
    });

    const pay5 = await Payment.create({
      visit_id: v5.id,
      patient_id: p5.id,
      receipt_number: 'REC-20261022-1005',
      total_amount: 500.00,
      amount_paid: 0.00,
      payment_method: 'cbe_birr',
      status: PAYMENT_STATUS.PENDING,
      notes: 'Card fee (150 ETB) + Pediatric consultation fee (350 ETB) - Awaiting CBE Birr confirmation'
    });

    await PaymentAllocation.create({
      payment_id: pay5.id,
      service_id: serviceMap['SRV-CARD-01'].id,
      allocation_type: 'card_fee',
      amount: 150.00
    });
    await PaymentAllocation.create({
      payment_id: pay5.id,
      service_id: serviceMap['SRV-CONS-01'].id,
      allocation_type: 'consultation_fee',
      amount: 350.00
    });

    // Audit logs for initial setup
    await AuditLog.create({
      user_id: admin.id,
      action: 'SYSTEM_INITIALIZED',
      entity: 'System',
      entityId: '1',
      details: 'Tena Clinic initialized with Ethiopian staff accounts and ETB pricing.',
      ip_address: '127.0.0.1'
    });

    console.log('Seed completed successfully!');
    console.log('Ethiopian Demo Credentials:');
    console.log('  Admin:        Hussien Seid      -> admin@clinic.com     / Admin@123');
    console.log('  Doctor:       Dr. Abebe Kebede  -> doctor@clinic.com    / Doctor@123');
    console.log('  Receptionist: Meron Alemu       -> reception@clinic.com / Recept@123');
    console.log('  Lab Tech:     Assefa Zegeye     -> lab@clinic.com       / Lab@123');

    return true;
  } catch (error) {
    console.error('Database seed error:', error);
    throw error;
  }
};

// Execute if run directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
