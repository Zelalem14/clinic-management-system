const { Op } = require('sequelize');
const {
  Consultation,
  Diagnosis,
  PatientVisit,
  Patient,
  User,
  Prescription,
  PrescriptionItem,
  ProcedureRequest,
  ProcedureRequestItem,
  LaboratoryResult,
  Service,
  Appointment,
  sequelize
} = require('../models');
const { CONSULTATION_STATUS, VISIT_STATUS, ROLES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');

const getDoctorWaitingQueue = async (req, res, next) => {
  try {
    const whereClause = {
      status: {
        [Op.in]: [
          VISIT_STATUS.WAITING_CONSULTATION,
          VISIT_STATUS.IN_CONSULTATION,
          VISIT_STATUS.RESULTS_READY,
          VISIT_STATUS.LAB_PENDING
        ]
      }
    };

    // If logged in as Doctor, only show patients assigned to this doctor
    if (req.user && req.user.role === ROLES.DOCTOR) {
      whereClause.doctor_id = req.user.id;
    } else if (req.query.doctor_id) {
      whereClause.doctor_id = req.query.doctor_id;
    }

    const visits = await PatientVisit.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: ProcedureRequest,
          as: 'procedure_requests',
          include: [
            { model: ProcedureRequestItem, as: 'items', include: [{ model: Service, as: 'service' }] },
            { model: LaboratoryResult, as: 'results' }
          ]
        },
        {
          model: Consultation,
          as: 'consultations',
          limit: 1,
          order: [['id', 'DESC']]
        }
      ],
      order: [
        // prioritize results_ready, then waiting_consultation, then in_consultation
        ['status', 'ASC'],
        ['id', 'ASC']
      ]
    });

    res.json({
      success: true,
      queue: visits
    });
  } catch (error) {
    next(error);
  }
};

const createOrStartConsultation = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      visit_id,
      patient_id,
      symptoms,
      examination_findings,
      diagnosis,
      treatment_plan,
      clinical_notes
    } = req.body;

    const doctor_id = req.user.id;

    const visit = await PatientVisit.findByPk(visit_id, { transaction: t });
    if (!visit) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Check if consultation already exists for this visit
    let consultation = await Consultation.findOne({
      where: { visit_id },
      transaction: t
    });

    if (!consultation) {
      consultation = await Consultation.create({
        visit_id,
        patient_id: patient_id || visit.patient_id,
        doctor_id,
        consultation_date: new Date(),
        symptoms: symptoms || null,
        examination_findings: examination_findings || null,
        diagnosis: diagnosis || null,
        treatment_plan: treatment_plan || null,
        clinical_notes: clinical_notes || null,
        status: CONSULTATION_STATUS.IN_PROGRESS
      }, { transaction: t });

      // Update visit status to IN_CONSULTATION and assign doctor
      visit.status = VISIT_STATUS.IN_CONSULTATION;
      visit.doctor_id = doctor_id;
      await visit.save({ transaction: t });
    } else {
      // Update existing consultation draft
      if (symptoms !== undefined) consultation.symptoms = symptoms;
      if (examination_findings !== undefined) consultation.examination_findings = examination_findings;
      if (diagnosis !== undefined) consultation.diagnosis = diagnosis;
      if (treatment_plan !== undefined) consultation.treatment_plan = treatment_plan;
      if (clinical_notes !== undefined) consultation.clinical_notes = clinical_notes;
      await consultation.save({ transaction: t });
    }

    // If diagnosis was specified, record in diagnoses table
    if (diagnosis) {
      await Diagnosis.create({
        consultation_id: consultation.id,
        patient_id: consultation.patient_id,
        description: diagnosis,
        type: 'provisional'
      }, { transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'CONSULTATION_STARTED',
      entity: 'Consultation',
      entityId: consultation.id,
      details: { visit_id, patient_id: consultation.patient_id },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Consultation initiated successfully',
      consultation
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const updateConsultation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      symptoms,
      examination_findings,
      diagnosis,
      treatment_plan,
      clinical_notes
    } = req.body;

    const consultation = await Consultation.findByPk(id);
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    if (symptoms !== undefined) consultation.symptoms = symptoms;
    if (examination_findings !== undefined) consultation.examination_findings = examination_findings;
    if (diagnosis !== undefined) consultation.diagnosis = diagnosis;
    if (treatment_plan !== undefined) consultation.treatment_plan = treatment_plan;
    if (clinical_notes !== undefined) consultation.clinical_notes = clinical_notes;

    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation updated successfully',
      consultation
    });
  } catch (error) {
    next(error);
  }
};

const completeConsultation = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      final_diagnosis,
      treatment_plan,
      clinical_notes,
      prescriptions = [],
      follow_up_date,
      follow_up_notes
    } = req.body;

    const consultation = await Consultation.findByPk(id, {
      include: [{ model: PatientVisit, as: 'visit' }],
      transaction: t
    });

    if (!consultation) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    // Finalize consultation
    consultation.status = CONSULTATION_STATUS.COMPLETED;
    consultation.completed_at = new Date();
    if (final_diagnosis) consultation.diagnosis = final_diagnosis;
    if (treatment_plan) consultation.treatment_plan = treatment_plan;
    if (clinical_notes) consultation.clinical_notes = clinical_notes;
    await consultation.save({ transaction: t });

    // Record Final Diagnosis
    if (final_diagnosis) {
      await Diagnosis.create({
        consultation_id: consultation.id,
        patient_id: consultation.patient_id,
        description: final_diagnosis,
        type: 'final'
      }, { transaction: t });
    }

    // Save Prescriptions if provided
    if (prescriptions && prescriptions.length > 0) {
      const newPrescription = await Prescription.create({
        consultation_id: consultation.id,
        patient_id: consultation.patient_id,
        doctor_id: req.user.id,
        status: 'active',
        instructions: treatment_plan || 'Take as instructed by physician'
      }, { transaction: t });

      for (const item of prescriptions) {
        if (item.medication_name) {
          await PrescriptionItem.create({
            prescription_id: newPrescription.id,
            medication_name: item.medication_name,
            dosage: item.dosage || '1 unit',
            frequency: item.frequency || 'Once daily',
            duration: item.duration || '5 days',
            route: item.route || 'Oral',
            instructions: item.instructions || '',
            quantity: item.quantity || 1
          }, { transaction: t });
        }
      }
    }

    // Schedule follow-up appointment if provided
    if (follow_up_date) {
      await Appointment.create({
        patient_id: consultation.patient_id,
        doctor_id: req.user.id,
        appointment_date: follow_up_date,
        type: 'follow_up',
        notes: follow_up_notes || 'Follow-up consultation after treatment',
        status: 'scheduled'
      }, { transaction: t });
    }

    // Update Visit Status to COMPLETED
    if (consultation.visit) {
      consultation.visit.status = VISIT_STATUS.COMPLETED;
      await consultation.visit.save({ transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'CONSULTATION_COMPLETED',
      entity: 'Consultation',
      entityId: consultation.id,
      details: {
        diagnosis: final_diagnosis,
        prescriptions_count: prescriptions.length,
        follow_up_date: follow_up_date || null
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Consultation successfully finalized and completed.',
      consultation
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const getConsultationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const consultation = await Consultation.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
        { model: Diagnosis, as: 'diagnoses' },
        {
          model: Prescription,
          as: 'prescriptions',
          include: [{ model: PrescriptionItem, as: 'items' }]
        },
        {
          model: PatientVisit,
          as: 'visit',
          include: [
            {
              model: ProcedureRequest,
              as: 'procedure_requests',
              include: [
                { model: ProcedureRequestItem, as: 'items', include: [{ model: Service, as: 'service' }] },
                { model: LaboratoryResult, as: 'results' }
              ]
            }
          ]
        }
      ]
    });

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    res.json({
      success: true,
      consultation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorWaitingQueue,
  createOrStartConsultation,
  updateConsultation,
  completeConsultation,
  getConsultationById
};
