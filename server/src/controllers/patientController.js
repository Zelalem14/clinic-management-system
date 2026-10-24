const { Op } = require('sequelize');
const {
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
  User,
  sequelize
} = require('../models');
const { VISIT_STATUS, PAYMENT_STATUS, SERVICE_CATEGORIES, ROLES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');

// Helper to generate unique Patient Card Number (e.g. CLN-2026-0001)
const generateCardNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `CLN-${currentYear}-`;

  const lastPatient = await Patient.findOne({
    where: {
      card_number: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['id', 'DESC']]
  });

  let nextSequence = 1;
  if (lastPatient && lastPatient.card_number) {
    const parts = lastPatient.card_number.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSequence = parsedSeq + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSequence}`;
};

// Generate unique receipt number
const generateReceiptNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateStr}-${randomStr}`;
};

const createPatient = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      full_name,
      dob,
      age,
      sex,
      phone,
      address,
      emergency_contact,
      doctor_id,
      consultation_type = 'General Consultation',
      notes,
      payment_method = 'cash',
      allergies,
      medical_history,
      current_medications,
      approve_payment_now = false,
      transaction_reference
    } = req.body;

    if (!full_name || !phone || !sex) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Full name, sex, and phone number are required.'
      });
    }

    // Check for potential duplicate patient by phone and full name
    const existingPatient = await Patient.findOne({
      where: {
        phone: phone.trim(),
        full_name: full_name.trim()
      },
      transaction: t
    });

    if (existingPatient) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: `A patient with the name '${full_name}' and phone number '${phone}' already exists with card number ${existingPatient.card_number}.`,
        patient: existingPatient
      });
    }

    // Generate Card Number
    const card_number = await generateCardNumber();

    // Calculate age if dob provided or vice versa
    let computedAge = age;
    if (dob && !age) {
      const birthDate = new Date(dob);
      const diff = Date.now() - birthDate.getTime();
      const ageDate = new Date(diff);
      computedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    // Create Patient record
    const patient = await Patient.create({
      card_number,
      full_name: full_name.trim(),
      dob: dob || null,
      age: computedAge || null,
      sex,
      phone: phone.trim(),
      address: address || null,
      emergency_contact: emergency_contact || null,
      consultation_type,
      registration_date: new Date(),
      allergies: allergies || null,
      medical_history: medical_history || null,
      current_medications: current_medications || null,
      notes: notes || null,
      status: 'active'
    }, { transaction: t });

    // Fetch configured card fee and consultation fee from Services
    const cardService = await Service.findOne({
      where: { category: SERVICE_CATEGORIES.CARD_REGISTRATION, is_active: true },
      order: [['id', 'ASC']],
      transaction: t
    });
    const consultService = await Service.findOne({
      where: { category: SERVICE_CATEGORIES.CONSULTATION, is_active: true },
      order: [['id', 'ASC']],
      transaction: t
    });

    const cardFee = cardService ? parseFloat(cardService.price) : 150.00;
    const consultFee = consultService ? parseFloat(consultService.price) : 350.00;
    const totalRegistrationFee = cardFee + consultFee;

    // Resolve assigned Doctor ID
    let assignedDoctorId = doctor_id ? parseInt(doctor_id, 10) : null;
    if (!assignedDoctorId) {
      const defaultDoctor = await User.findOne({
        where: { role: ROLES.DOCTOR, is_active: true },
        order: [['id', 'ASC']],
        transaction: t
      });
      if (defaultDoctor) assignedDoctorId = defaultDoctor.id;
    }

    // Determine initial visit status: if approved now -> 'waiting_consultation', else -> 'registered'
    const initialVisitStatus = approve_payment_now
      ? VISIT_STATUS.WAITING_CONSULTATION
      : VISIT_STATUS.REGISTERED;

    // Create Patient Visit
    const visit = await PatientVisit.create({
      patient_id: patient.id,
      doctor_id: assignedDoctorId,
      visit_date: new Date(),
      visit_type: 'Outpatient',
      status: initialVisitStatus,
      notes: `Initial registration visit. Consultation: ${consultation_type}`
    }, { transaction: t });

    // Create Initial Payment Record
    const receipt_number = generateReceiptNumber();
    const isApproved = Boolean(approve_payment_now);

    const payment = await Payment.create({
      visit_id: visit.id,
      patient_id: patient.id,
      receipt_number,
      total_amount: totalRegistrationFee,
      amount_paid: isApproved ? totalRegistrationFee : 0.00,
      payment_method,
      status: isApproved ? PAYMENT_STATUS.APPROVED : PAYMENT_STATUS.PENDING,
      approved_by: isApproved ? req.user.id : null,
      approved_at: isApproved ? new Date() : null,
      transaction_reference: transaction_reference || null,
      notes: 'Registration Card Fee and Doctor Consultation Fee'
    }, { transaction: t });

    // Create Allocations for Card Fee and Consultation Fee
    if (cardService) {
      await PaymentAllocation.create({
        payment_id: payment.id,
        service_id: cardService.id,
        allocation_type: 'card_fee',
        amount: cardFee
      }, { transaction: t });
    }

    if (consultService) {
      await PaymentAllocation.create({
        payment_id: payment.id,
        service_id: consultService.id,
        allocation_type: 'consultation_fee',
        amount: consultFee
      }, { transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user ? req.user.id : null,
      action: 'PATIENT_REGISTERED',
      entity: 'Patient',
      entityId: patient.id,
      details: {
        card_number: patient.card_number,
        full_name: patient.full_name,
        payment_status: payment.status
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient,
      visit,
      payment,
      fees: {
        card_fee: cardFee,
        consultation_fee: consultFee,
        total_fee: totalRegistrationFee
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const listPatients = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { card_number: { [Op.like]: searchTerm } },
        { full_name: { [Op.like]: searchTerm } },
        { phone: { [Op.like]: searchTerm } }
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PatientVisit,
          as: 'visits',
          limit: 1,
          order: [['id', 'DESC']]
        }
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      patients: rows
    });
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id, {
      include: [
        {
          model: PatientVisit,
          as: 'visits',
          include: [
            {
              model: User,
              as: 'doctor',
              attributes: ['id', 'name', 'email', 'role']
            }
          ],
          order: [['id', 'DESC']]
        },
        {
          model: Payment,
          as: 'payments',
          include: [
            {
              model: PaymentAllocation,
              as: 'allocations',
              include: [{ model: Service, as: 'service' }]
            },
            {
              model: User,
              as: 'approver',
              attributes: ['id', 'name']
            }
          ],
          order: [['id', 'DESC']]
        },
        {
          model: ProcedureRequest,
          as: 'procedure_requests',
          include: [
            {
              model: ProcedureRequestItem,
              as: 'items',
              include: [{ model: Service, as: 'service' }]
            },
            {
              model: LaboratoryResult,
              as: 'results',
              include: [{ model: User, as: 'technician', attributes: ['id', 'name'] }]
            },
            {
              model: User,
              as: 'doctor',
              attributes: ['id', 'name']
            }
          ],
          order: [['id', 'DESC']]
        },
        {
          model: Prescription,
          as: 'prescriptions',
          include: [
            { model: PrescriptionItem, as: 'items' },
            { model: User, as: 'doctor', attributes: ['id', 'name'] }
          ],
          order: [['id', 'DESC']]
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      patient
    });
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const updatableFields = [
      'full_name',
      'dob',
      'age',
      'sex',
      'phone',
      'address',
      'emergency_contact',
      'consultation_type',
      'allergies',
      'medical_history',
      'current_medications',
      'notes',
      'status'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        patient[field] = req.body[field];
      }
    });

    await patient.save();

    await logAudit({
      userId: req.user.id,
      action: 'PATIENT_UPDATED',
      entity: 'Patient',
      entityId: patient.id,
      details: { full_name: patient.full_name, card_number: patient.card_number },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    next(error);
  }
};

const getMedicalHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const consultations = await Consultation.findAll({
      where: { patient_id: id },
      include: [
        { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
        { model: Diagnosis, as: 'diagnoses' }
      ],
      order: [['id', 'DESC']]
    });

    const procedureRequests = await ProcedureRequest.findAll({
      where: { patient_id: id },
      include: [
        { model: ProcedureRequestItem, as: 'items', include: [{ model: Service, as: 'service' }] },
        { model: LaboratoryResult, as: 'results', include: [{ model: User, as: 'technician', attributes: ['id', 'name'] }] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] }
      ],
      order: [['id', 'DESC']]
    });

    const prescriptions = await Prescription.findAll({
      where: { patient_id: id },
      include: [
        { model: PrescriptionItem, as: 'items' },
        { model: User, as: 'doctor', attributes: ['id', 'name'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      patient: {
        id: patient.id,
        card_number: patient.card_number,
        full_name: patient.full_name,
        age: patient.age,
        sex: patient.sex,
        phone: patient.phone,
        allergies: patient.allergies,
        medical_history: patient.medical_history,
        current_medications: patient.current_medications
      },
      consultations,
      procedureRequests,
      prescriptions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  listPatients,
  getPatientById,
  updatePatient,
  getMedicalHistory,
  generateCardNumber
};
