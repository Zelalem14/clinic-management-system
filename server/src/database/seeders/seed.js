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

const seedDatabase = async () => {
  try {
    console.log('Synchronizing database models...');
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // 1. Seed Users
    console.log('Seeding demo user accounts...');
    const admin = await User.create({
      name: 'Dr. Michael Vance (Admin)',
      email: 'admin@clinic.com',
      password: 'Admin@123',
      role: ROLES.ADMIN,
      phone: '+1 (555) 100-0001',
      is_active: true
    });

    const receptionist = await User.create({
      name: 'Sarah Jenkins',
      email: 'reception@clinic.com',
      password: 'Recept@123',
      role: ROLES.RECEPTIONIST,
      phone: '+1 (555) 100-0002',
      is_active: true
    });

    const doctor = await User.create({
      name: 'Dr. Emily Clark, MD',
      email: 'doctor@clinic.com',
      password: 'Doctor@123',
      role: ROLES.DOCTOR,
      phone: '+1 (555) 100-0003',
      is_active: true
    });

    const labTech = await User.create({
      name: 'David Kim, MLS',
      email: 'lab@clinic.com',
      password: 'Lab@123',
      role: ROLES.LAB_TECH,
      phone: '+1 (555) 100-0004',
      is_active: true
    });

    // 2. Seed Clinic Settings
    console.log('Seeding clinic configuration...');
    await ClinicSetting.create({
      clinic_name: 'St. Jude Community Clinic & Diagnostic Center',
      address: '124 Healthcare Boulevard, Suite 300, Medical District',
      phone: '+1 (555) 019-2834',
      email: 'contact@stjudeclinic.org',
      currency_symbol: '$',
      receipt_footer: 'Thank you for choosing St. Jude Clinic. We are dedicated to your optimal health and speedy recovery!'
    });

    // 3. Seed Services
    console.log('Seeding medical services and standard pricing...');
    const servicesData = [
      // Registration & Cards
      {
        service_code: 'SRV-CARD-01',
        service_name: 'Patient Card & File Registration',
        category: SERVICE_CATEGORIES.CARD_REGISTRATION,
        description: 'New patient digital medical file opening and physical card creation',
        price: 10.00,
        is_active: true
      },
      // Consultations
      {
        service_code: 'SRV-CONS-01',
        service_name: 'General Medical Consultation',
        category: SERVICE_CATEGORIES.CONSULTATION,
        description: 'Comprehensive physical examination and clinical evaluation by General Practitioner',
        price: 25.00,
        is_active: true
      },
      {
        service_code: 'SRV-CONS-02',
        service_name: 'Specialist Physician Consultation',
        category: SERVICE_CATEGORIES.CONSULTATION,
        description: 'In-depth consultation with specialized medical doctor',
        price: 45.00,
        is_active: true
      },
      // Laboratory Tests
      {
        service_code: 'LAB-CBC-01',
        service_name: 'Complete Blood Count (CBC / FBC)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Automated 5-part differential blood cell counter evaluating anemia, infection, and platelet count',
        price: 20.00,
        is_active: true
      },
      {
        service_code: 'LAB-MAL-01',
        service_name: 'Malaria Rapid Diagnostic Test (RDT) & Smear',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Plasmodium falciparum antigen detection and blood film microscopy',
        price: 15.00,
        is_active: true
      },
      {
        service_code: 'LAB-GLU-01',
        service_name: 'Fasting Blood Glucose (FBG)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Serum glucose measurement to evaluate diabetes mellitus and glycemic control',
        price: 12.00,
        is_active: true
      },
      {
        service_code: 'LAB-LIP-01',
        service_name: 'Lipid Profile Panel',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Total Cholesterol, HDL, LDL, and Triglycerides assessment',
        price: 35.00,
        is_active: true
      },
      {
        service_code: 'LAB-URI-01',
        service_name: 'Urinalysis (10-Parameter Dipstick & Micro)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Urine chemistry strip and microscopic sediment examination',
        price: 10.00,
        is_active: true
      },
      {
        service_code: 'LAB-WID-01',
        service_name: 'Widal Typhoid Agglutination Test',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'Salmonella antibody titers for enteric fever screening',
        price: 18.00,
        is_active: true
      },
      {
        service_code: 'LAB-LFT-01',
        service_name: 'Liver Function Test Panel (LFT)',
        category: SERVICE_CATEGORIES.LABORATORY,
        description: 'ALT, AST, ALP, Bilirubin, and Total Protein',
        price: 40.00,
        is_active: true
      },
      // Ultrasound
      {
        service_code: 'RAD-US-01',
        service_name: 'Abdominal Ultrasound Scan',
        category: SERVICE_CATEGORIES.ULTRASOUND,
        description: 'Ultrasound imaging of liver, gallbladder, kidneys, spleen, and pancreas',
        price: 50.00,
        is_active: true
      },
      {
        service_code: 'RAD-US-02',
        service_name: 'Pelvic Ultrasound Scan',
        category: SERVICE_CATEGORIES.ULTRASOUND,
        description: 'Diagnostic sonography of bladder, uterus, ovaries, or prostate',
        price: 45.00,
        is_active: true
      },
      {
        service_code: 'RAD-US-03',
        service_name: 'Obstetric Ultrasound Scan',
        category: SERVICE_CATEGORIES.ULTRASOUND,
        description: 'Fetal growth, anatomy scan, and gestational age assessment',
        price: 40.00,
        is_active: true
      },
      // X-Ray
      {
        service_code: 'RAD-XR-01',
        service_name: 'Chest Digital X-Ray (PA View)',
        category: SERVICE_CATEGORIES.X_RAY,
        description: 'Digital plain radiography of lungs, heart contours, and rib cage',
        price: 35.00,
        is_active: true
      },
      {
        service_code: 'RAD-XR-02',
        service_name: 'Extremity X-Ray (Single View)',
        category: SERVICE_CATEGORIES.X_RAY,
        description: 'Radiographic image of upper or lower limb for fracture/dislocation check',
        price: 30.00,
        is_active: true
      },
      // Minor Procedures
      {
        service_code: 'PROC-ECG-01',
        service_name: '12-Lead Electrocardiogram (ECG)',
        category: SERVICE_CATEGORIES.PROCEDURE,
        description: '12-lead cardiac rhythm recording and rhythm strip interpretation',
        price: 25.00,
        is_active: true
      },
      {
        service_code: 'PROC-WND-01',
        service_name: 'Wound Dressing & Antiseptic Care',
        category: SERVICE_CATEGORIES.PROCEDURE,
        description: 'Debridement, antiseptic cleaning, and sterile dressing for open wounds',
        price: 15.00,
        is_active: true
      },
      {
        service_code: 'PROC-SUT-01',
        service_name: 'Minor Surgical Suturing (1-3 cm)',
        category: SERVICE_CATEGORIES.PROCEDURE,
        description: 'Local anesthesia infiltration and surgical wound closure',
        price: 50.00,
        is_active: true
      }
    ];

    const services = await Service.bulkCreate(servicesData);
    const serviceMap = {};
    services.forEach(s => {
      serviceMap[s.service_code] = s;
    });

    // 4. Seed Patients & Sample Workflows
    console.log('Seeding realistic patient journeys across all clinic stages...');

    // Patient 1: Newly registered with card & consultation fee APPROVED -> Waiting for Doctor
    const p1 = await Patient.create({
      card_number: 'CLN-2026-0001',
      full_name: 'Robert Johnson',
      dob: '1981-04-12',
      age: 45,
      sex: 'male',
      phone: '+1 (555) 234-5678',
      address: '742 Evergreen Terrace, West End',
      emergency_contact: 'Mary Johnson (Wife) - +1 (555) 234-9988',
      consultation_type: 'General Consultation',
      registration_date: new Date().toISOString().slice(0, 10),
      allergies: 'Penicillin (mild rash)',
      medical_history: 'Essential Hypertension (controlled), Mild GERD',
      current_medications: 'Amlodipine 5mg once daily',
      notes: 'Reports recurring tension headaches and episodic dizziness over the last 3 days.'
    });

    const v1 = await PatientVisit.create({
      patient_id: p1.id,
      visit_date: new Date(),
      status: VISIT_STATUS.WAITING_CONSULTATION,
      notes: 'Checked in by Reception. Vitals recorded: BP 138/86 mmHg, Pulse 76 bpm.'
    });

    const pay1 = await Payment.create({
      visit_id: v1.id,
      patient_id: p1.id,
      receipt_number: 'REC-20261022-1001',
      total_amount: 35.00,
      amount_paid: 35.00,
      payment_method: 'cash',
      status: PAYMENT_STATUS.APPROVED,
      approved_by: receptionist.id,
      approved_at: new Date(),
      transaction_reference: 'CASH-001',
      notes: 'Card fee ($10) + Doctor consultation fee ($25)'
    });

    await PaymentAllocation.create({
      payment_id: pay1.id,
      service_id: serviceMap['SRV-CARD-01'].id,
      allocation_type: 'card_fee',
      amount: 10.00
    });
    await PaymentAllocation.create({
      payment_id: pay1.id,
      service_id: serviceMap['SRV-CONS-01'].id,
      allocation_type: 'consultation_fee',
      amount: 25.00
    });

    // Patient 2: Consultation in Progress with ordered Lab tests. Payment is APPROVED -> Lab Tech Queue!
    const p2 = await Patient.create({
      card_number: 'CLN-2026-0002',
      full_name: 'Elena Rostova',
      dob: '1994-08-19',
      age: 32,
      sex: 'female',
      phone: '+1 (555) 345-6789',
      address: '1802 Pine St, Apt 4B, North Hill',
      emergency_contact: 'Dmitri Rostov (Brother) - +1 (555) 345-0012',
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
      notes: 'Temp 39.1°C, Rigors noted. Referred to laboratory for acute febrile workup.'
    });

    await Consultation.create({
      visit_id: v2.id,
      patient_id: p2.id,
      doctor_id: doctor.id,
      consultation_date: new Date(),
      symptoms: 'Sudden onset high grade fever (39.1°C), intermittent rigors, profuse sweating, throbbing retro-orbital headache, generalized myalgia.',
      examination_findings: 'Febrile, flushed facies. Heart sounds normal, chest clear to auscultation. Abdomen soft, mild tenderness in right upper quadrant, no palpable organomegaly.',
      diagnosis: 'Acute Febrile Illness - Suspected Malaria vs Enteric Fever',
      treatment_plan: 'Ordered stat CBC and Malaria RDT. Awaiting laboratory results before initiating targeted antimicrobial therapy.',
      clinical_notes: 'Urgent lab testing indicated. Patient hydrated with oral fluids.',
      status: 'in_progress'
    });

    // Procedure Request for Patient 2: CBC ($20) + Malaria RDT ($15) = $35
    const procReq2 = await ProcedureRequest.create({
      visit_id: v2.id,
      patient_id: p2.id,
      doctor_id: doctor.id,
      category: SERVICE_CATEGORIES.LABORATORY,
      clinical_reason: 'Fever 39.1C with rigors. Rule out malaria and leukocytosis.',
      priority: 'urgent',
      status: REQUEST_STATUS.PAYMENT_APPROVED, // Payment approved by reception, ready for lab!
      total_cost: 35.00,
      paid_amount: 35.00
    });

    await ProcedureRequestItem.create({
      request_id: procReq2.id,
      service_id: serviceMap['LAB-CBC-01'].id,
      unit_price: 20.00,
      status: 'paid'
    });
    await ProcedureRequestItem.create({
      request_id: procReq2.id,
      service_id: serviceMap['LAB-MAL-01'].id,
      unit_price: 15.00,
      status: 'paid'
    });

    const pay2 = await Payment.create({
      visit_id: v2.id,
      patient_id: p2.id,
      receipt_number: 'REC-20261022-1002',
      total_amount: 35.00,
      amount_paid: 35.00,
      payment_method: 'mobile_money',
      status: PAYMENT_STATUS.APPROVED,
      approved_by: receptionist.id,
      approved_at: new Date(),
      transaction_reference: 'MOMO-789211',
      notes: 'Procedure fee approved: CBC and Malaria RDT'
    });

    await PaymentAllocation.create({
      payment_id: pay2.id,
      service_id: serviceMap['LAB-CBC-01'].id,
      procedure_request_id: procReq2.id,
      allocation_type: 'laboratory_fee',
      amount: 20.00
    });
    await PaymentAllocation.create({
      payment_id: pay2.id,
      service_id: serviceMap['LAB-MAL-01'].id,
      procedure_request_id: procReq2.id,
      allocation_type: 'laboratory_fee',
      amount: 15.00
    });

    // Patient 3: Laboratory test COMPLETED, results transmitted to Doctor -> Ready for Doctor Review!
    const p3 = await Patient.create({
      card_number: 'CLN-2026-0003',
      full_name: 'Marcus Campbell',
      dob: '1968-11-03',
      age: 58,
      sex: 'male',
      phone: '+1 (555) 456-7890',
      address: '302 Elm Court, Harbor District',
      emergency_contact: 'Judith Campbell - +1 (555) 456-2233',
      consultation_type: 'General Consultation',
      registration_date: new Date().toISOString().slice(0, 10),
      allergies: 'Sulfa drugs (hives)',
      medical_history: 'Type 2 Diabetes Mellitus (uncontrolled), Dyslipidemia',
      current_medications: 'Metformin 850mg BD, Atorvastatin 20mg nocte',
      notes: 'Complains of polydipsia, polyuria, polyphagia and blurry vision over recent weeks.'
    });

    const v3 = await PatientVisit.create({
      patient_id: p3.id,
      doctor_id: doctor.id,
      visit_date: new Date(),
      status: VISIT_STATUS.RESULTS_READY,
      notes: 'Lab test results completed and returned by Laboratory. Awaiting doctor final review.'
    });

    const c3 = await Consultation.create({
      visit_id: v3.id,
      patient_id: p3.id,
      doctor_id: doctor.id,
      consultation_date: new Date(),
      symptoms: 'Marked thirst, increased frequency of urination especially at night, recent 4kg unintentional weight loss, visual blurriness.',
      examination_findings: 'BMI 29.4 kg/m2. Mild peripheral neuropathy signs in lower extremities. Fundus shows no gross microaneurysms.',
      diagnosis: 'Type 2 Diabetes Mellitus with Poor Glycemic Control',
      treatment_plan: 'Requested Fasting Blood Glucose and Urinalysis. Re-evaluate medication regimen based on lab findings.',
      status: 'in_progress'
    });

    const procReq3 = await ProcedureRequest.create({
      visit_id: v3.id,
      patient_id: p3.id,
      doctor_id: doctor.id,
      category: SERVICE_CATEGORIES.LABORATORY,
      clinical_reason: 'Uncontrolled diabetes check. Measure fasting glucose and check for glucosuria/ketonuria.',
      priority: 'routine',
      status: REQUEST_STATUS.SENT_TO_DOCTOR,
      total_cost: 22.00,
      paid_amount: 22.00
    });

    const fbgItem = await ProcedureRequestItem.create({
      request_id: procReq3.id,
      service_id: serviceMap['LAB-GLU-01'].id,
      unit_price: 12.00,
      status: 'completed'
    });
    const uriItem = await ProcedureRequestItem.create({
      request_id: procReq3.id,
      service_id: serviceMap['LAB-URI-01'].id,
      unit_price: 10.00,
      status: 'completed'
    });

    await LaboratoryResult.create({
      request_id: procReq3.id,
      request_item_id: fbgItem.id,
      patient_id: p3.id,
      technician_id: labTech.id,
      test_name: 'Fasting Blood Glucose (FBG)',
      findings: 'Serum Glucose: 248 mg/dL (Reference Range: 70 - 99 mg/dL)',
      results_data: JSON.stringify({ parameter: 'Fasting Blood Glucose', value: '248 mg/dL', reference: '70-99 mg/dL', interpretation: 'Markedly Elevated' }),
      observations: 'Sample run in duplicate with good calibration. Patient confirmed 10 hours overnight fast.',
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
      results_data: JSON.stringify({ glucose: '3+', ketones: 'Negative', protein: 'Trace', leukocytes: 'Negative', nitrite: 'Negative' }),
      observations: 'Marked glucosuria detected. No signs of urinary tract infection or diabetic ketoacidosis.',
      status: 'final',
      completed_at: new Date(),
      verified_by: labTech.id
    });

    // Patient 4: Fully COMPLETED consultation with Final Diagnosis, Prescriptions, and Follow-up
    const p4 = await Patient.create({
      card_number: 'CLN-2026-0004',
      full_name: 'Amara Diallo',
      dob: '1999-02-14',
      age: 27,
      sex: 'female',
      phone: '+1 (555) 567-8901',
      address: '55 Maple Avenue, Eastside',
      emergency_contact: 'Fatima Diallo (Sister) - +1 (555) 567-3344',
      consultation_type: 'General Consultation',
      registration_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      allergies: 'None',
      medical_history: 'Seasonal allergic rhinitis',
      current_medications: 'None',
      notes: 'Acute sore throat, dysphagia, and painful cervical lymph nodes.'
    });

    const v4 = await PatientVisit.create({
      patient_id: p4.id,
      doctor_id: doctor.id,
      visit_date: new Date(Date.now() - 86400000),
      status: VISIT_STATUS.COMPLETED,
      notes: 'Consultation concluded. Treatment commenced.'
    });

    const c4 = await Consultation.create({
      visit_id: v4.id,
      patient_id: p4.id,
      doctor_id: doctor.id,
      consultation_date: new Date(Date.now() - 86400000),
      symptoms: 'Severe pain on swallowing, fever 38.3°C, tender anterior neck swelling.',
      examination_findings: 'Pharyngeal erythema with follicular tonsillar exudates. Tender anterior cervical lymphadenopathy.',
      diagnosis: 'Acute Follicular Tonsillitis',
      treatment_plan: 'Oral antibiotic course, analgesic, warm saline gargles, adequate hydration.',
      clinical_notes: 'Centor score: 4. Bacterial etiology highly suspected.',
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
      instructions: 'Complete full antibiotic course even if feeling fully recovered.'
    });

    await PrescriptionItem.create({
      prescription_id: pres4.id,
      medication_name: 'Amoxicillin / Clavulanate (Augmentin)',
      dosage: '625 mg',
      frequency: 'TDS (Every 8 hours)',
      duration: '7 days',
      route: 'Oral',
      instructions: 'Take immediately before or at the start of a meal.',
      quantity: 21
    });

    await PrescriptionItem.create({
      prescription_id: pres4.id,
      medication_name: 'Paracetamol (Acetaminophen)',
      dosage: '1000 mg (2 tablets of 500mg)',
      frequency: 'TDS (Every 8 hours PRN)',
      duration: '5 days',
      route: 'Oral',
      instructions: 'Take after meals for fever and throat pain.',
      quantity: 30
    });

    await Appointment.create({
      patient_id: p4.id,
      doctor_id: doctor.id,
      appointment_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      appointment_time: '10:30 AM',
      type: 'follow_up',
      notes: 'Check resolution of tonsillitis and examine throat.',
      status: 'scheduled'
    });

    // Patient 5: Newly registered with PENDING payment (demonstrating Receptionist Approval workflow!)
    const p5 = await Patient.create({
      card_number: 'CLN-2026-0005',
      full_name: 'Sophia Martinez',
      dob: '2018-06-25',
      age: 8,
      sex: 'female',
      phone: '+1 (555) 678-9012',
      address: '412 Oak Lane, Southside',
      emergency_contact: 'Carlos Martinez (Father) - +1 (555) 678-4455',
      consultation_type: 'Pediatric Consultation',
      registration_date: new Date().toISOString().slice(0, 10),
      allergies: 'Peanuts',
      medical_history: 'Childhood asthma',
      current_medications: 'Salbutamol inhaler as needed',
      notes: 'Child presenting with dry cough and mild wheeze following common cold.'
    });

    const v5 = await PatientVisit.create({
      patient_id: p5.id,
      visit_date: new Date(),
      status: VISIT_STATUS.REGISTERED, // Not yet approved -> waiting at reception
      notes: 'Patient registered. Awaiting fee verification from guardian.'
    });

    const pay5 = await Payment.create({
      visit_id: v5.id,
      patient_id: p5.id,
      receipt_number: 'REC-20261022-1005',
      total_amount: 35.00,
      amount_paid: 0.00,
      payment_method: 'bank_transfer',
      status: PAYMENT_STATUS.PENDING,
      notes: 'Card fee ($10) + Pediatric consultation fee ($25) - Awaiting confirmation of bank transfer.'
    });

    await PaymentAllocation.create({
      payment_id: pay5.id,
      service_id: serviceMap['SRV-CARD-01'].id,
      allocation_type: 'card_fee',
      amount: 10.00
    });
    await PaymentAllocation.create({
      payment_id: pay5.id,
      service_id: serviceMap['SRV-CONS-01'].id,
      allocation_type: 'consultation_fee',
      amount: 25.00
    });

    // Audit logs for initial setup
    await AuditLog.create({
      user_id: admin.id,
      action: 'SYSTEM_INITIALIZED',
      entity: 'System',
      entityId: '1',
      details: 'Initial clinic services, pricing, settings, and demo clinical records successfully seeded.',
      ip_address: '127.0.0.1'
    });

    console.log('Seed completed successfully!');
    console.log('Demo Credentials:');
    console.log('  Admin:        admin@clinic.com     / Admin@123');
    console.log('  Receptionist: reception@clinic.com / Recept@123');
    console.log('  Doctor:       doctor@clinic.com    / Doctor@123');
    console.log('  Lab Tech:     lab@clinic.com       / Lab@123');

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
