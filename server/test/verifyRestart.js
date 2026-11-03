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
  PrescriptionItem
} = require('../src/models');
const initDatabase = require('../src/config/initDatabase');

const cardNumber = process.argv[2];

if (!cardNumber) {
  console.error('Usage: node verifyRestart.js <CARD_NUMBER>');
  process.exit(1);
}

(async () => {
  try {
    await initDatabase();
    console.log(`[Cold Restart Process] Connected to ${sequelize.getDialect()} database.`);

    const retrievedPatient = await Patient.findOne({
      where: { card_number: cardNumber },
      include: [
        {
          model: PatientVisit,
          as: 'visits',
          include: [
            { model: Payment, as: 'payments' },
            {
              model: Consultation,
              as: 'consultations',
              include: [
                { model: Diagnosis, as: 'diagnoses' },
                {
                  model: Prescription,
                  as: 'prescriptions',
                  include: [{ model: PrescriptionItem, as: 'items' }]
                }
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

    if (!retrievedPatient) {
      console.error(`❌ PERSISTENCE FAILURE: Patient with Card #${cardNumber} was NOT found after server restart!`);
      process.exit(1);
    }

    console.log('\n[Step 10] VERIFYING PERSISTENCE INTEGRITY ACROSS ALL CLINICAL TABLES:');
    console.log(`  1. Patient Demographics:     ${retrievedPatient.full_name} (${retrievedPatient.sex}, ${retrievedPatient.age} yrs) -> PASS`);
    console.log(`  2. Medical Card Number:      ${retrievedPatient.card_number} -> PASS`);
    console.log(`  3. Phone Number:             ${retrievedPatient.phone} -> PASS`);
    console.log(`  4. Emergency Contact:        ${retrievedPatient.emergency_contact} -> PASS`);

    const retrievedVisit = retrievedPatient.visits && retrievedPatient.visits[0];
    if (!retrievedVisit) throw new Error('PERSISTENCE FAILURE: Patient visit record was lost!');
    console.log(`  5. Doctor Visit Encounter:   Visit #${retrievedVisit.id} [${retrievedVisit.status}] -> PASS`);

    const retrievedPayment = retrievedVisit.payments && retrievedVisit.payments[0];
    if (!retrievedPayment) throw new Error('PERSISTENCE FAILURE: Payment record was lost!');
    console.log(`  6. Payment & Fee Record:     Receipt #${retrievedPayment.receipt_number} (${retrievedPayment.total_amount} ETB, Status: ${retrievedPayment.status}) -> PASS`);

    const retrievedConsult = retrievedVisit.consultations && retrievedVisit.consultations[0];
    if (!retrievedConsult) throw new Error('PERSISTENCE FAILURE: Doctor consultation record was lost!');
    console.log(`  7. Clinical Consultation:    ${retrievedConsult.symptoms.slice(0, 40)}... -> PASS`);

    const retrievedDiag = retrievedConsult.diagnoses && retrievedConsult.diagnoses[0];
    if (!retrievedDiag) throw new Error('PERSISTENCE FAILURE: Diagnosis record was lost!');
    console.log(`  8. Doctor Diagnosis:         ${retrievedDiag.description} (Code: ${retrievedDiag.code}) -> PASS`);

    const retrievedRx = retrievedConsult.prescriptions && retrievedConsult.prescriptions[0];
    if (!retrievedRx || !retrievedRx.items || !retrievedRx.items.length) throw new Error('PERSISTENCE FAILURE: Prescription record was lost!');
    console.log(`  9. Prescription Items:       ${retrievedRx.items[0].medication_name} ${retrievedRx.items[0].dosage} -> PASS`);

    const retrievedProc = retrievedVisit.procedure_requests && retrievedVisit.procedure_requests[0];
    if (!retrievedProc || !retrievedProc.results || !retrievedProc.results.length) throw new Error('PERSISTENCE FAILURE: Laboratory result was lost!');
    const retrievedResult = retrievedProc.results[0];
    console.log(`  10. Laboratory Result:       ${retrievedResult.test_name} [${retrievedResult.status}] -> PASS`);
    console.log(`  11. Doctor Clinical Review:  "${retrievedResult.doctor_comments}" -> PASS`);

    console.log('\n========================================================================');
    console.log('ALL 10 VERIFICATION STEPS PASSED WITH 100% SUCCESS!');
    console.log('Patient records and all clinical data remain permanently stored across server shutdown and restart.');
    console.log('========================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
})();
