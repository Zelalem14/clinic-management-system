const { Op } = require('sequelize');
const {
  PatientVisit,
  Patient,
  User,
  Payment,
  PaymentAllocation,
  Service,
  Consultation,
  ProcedureRequest,
  ProcedureRequestItem,
  LaboratoryResult,
  sequelize
} = require('../models');
const { VISIT_STATUS, PAYMENT_STATUS, SERVICE_CATEGORIES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');
const { calculateCardFeeStatus } = require('./patientController');

const generateReceiptNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateStr}-${randomStr}`;
};

const createVisit = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      patient_id,
      doctor_id,
      visit_type = 'Outpatient',
      consultation_type = 'Follow-up Consultation',
      notes,
      payment_method = 'cash',
      approve_payment_now = false,
      transaction_reference
    } = req.body;

    const patient = await Patient.findByPk(patient_id, { transaction: t });
    if (!patient) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if consultation service is configured
    const consultService = await Service.findOne({
      where: { category: SERVICE_CATEGORIES.CONSULTATION, is_active: true },
      order: [['id', 'ASC']],
      transaction: t
    });
    const consultFee = consultService ? parseFloat(consultService.price) : 350.00;

    // Check patient card fee validity (10-day policy)
    const cardService = await Service.findOne({
      where: { category: SERVICE_CATEGORIES.CARD_REGISTRATION, is_active: true },
      order: [['id', 'ASC']],
      transaction: t
    });
    const configuredCardFee = cardService ? parseFloat(cardService.price) : 150.00;
    const cardFeeStatus = calculateCardFeeStatus(patient, configuredCardFee);
    const cardFeeToCharge = cardFeeStatus.feeToCharge; // 0 if <= 10 days, 150 if > 10 days
    const totalAmount = consultFee + cardFeeToCharge;

    const initialStatus = approve_payment_now
      ? VISIT_STATUS.WAITING_CONSULTATION
      : VISIT_STATUS.REGISTERED;

    const visit = await PatientVisit.create({
      patient_id: patient.id,
      doctor_id: doctor_id || null,
      visit_date: new Date(),
      visit_type,
      status: initialStatus,
      notes: notes || `Return visit: ${consultation_type} (${cardFeeStatus.statusBadge}: ${cardFeeStatus.statusText})`
    }, { transaction: t });

    // Create payment record for visit
    const isApproved = Boolean(approve_payment_now);
    const receipt_number = generateReceiptNumber();

    const paymentNote = cardFeeToCharge > 0
      ? `Card fee renewal (${cardFeeToCharge} ETB - expired ${cardFeeStatus.daysExpired || 0}d ago) + Consultation fee (${consultFee} ETB) for visit #${visit.id}`
      : `Consultation fee for visit #${visit.id} (Card fee 0 ETB waived - valid follow-up within 10 days, ${cardFeeStatus.daysRemaining}d remaining)`;

    const payment = await Payment.create({
      visit_id: visit.id,
      patient_id: patient.id,
      receipt_number,
      total_amount: totalAmount,
      amount_paid: isApproved ? totalAmount : 0.00,
      payment_method,
      status: isApproved ? PAYMENT_STATUS.APPROVED : PAYMENT_STATUS.PENDING,
      approved_by: isApproved ? req.user.id : null,
      approved_at: isApproved ? new Date() : null,
      transaction_reference: transaction_reference || null,
      notes: paymentNote
    }, { transaction: t });

    // 1. Consultation allocation
    if (consultService) {
      await PaymentAllocation.create({
        payment_id: payment.id,
        service_id: consultService.id,
        allocation_type: 'consultation_fee',
        amount: consultFee
      }, { transaction: t });
    }

    // 2. Card fee allocation if expired (> 10 days)
    if (cardFeeToCharge > 0 && cardService) {
      await PaymentAllocation.create({
        payment_id: payment.id,
        service_id: cardService.id,
        allocation_type: 'card_fee',
        amount: cardFeeToCharge
      }, { transaction: t });
    }

    // If approved immediately and card fee was charged, update patient's last_card_fee_date
    if (isApproved && cardFeeToCharge > 0) {
      patient.last_card_fee_date = new Date();
      await patient.save({ transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'VISIT_CREATED',
      entity: 'PatientVisit',
      entityId: visit.id,
      details: { patient_id: patient.id, visit_id: visit.id, status: visit.status },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'New visit registered successfully',
      visit,
      payment,
      consultation_fee: consultFee
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const listVisits = async (req, res, next) => {
  try {
    const { status, doctor_id, date, page = 1, limit = 50 } = req.query;
    const whereClause = {};

    if (status) {
      if (Array.isArray(status)) {
        whereClause.status = { [Op.in]: status };
      } else {
        whereClause.status = status;
      }
    }

    if (doctor_id) {
      whereClause.doctor_id = doctor_id;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.visit_date = { [Op.between]: [startDate, endDate] };
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await PatientVisit.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Payment,
          as: 'payments'
        }
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      success: true,
      total: count,
      visits: rows
    });
  } catch (error) {
    next(error);
  }
};

const getVisitById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const visit = await PatientVisit.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
        {
          model: Payment,
          as: 'payments',
          include: [
            {
              model: PaymentAllocation,
              as: 'allocations',
              include: [{ model: Service, as: 'service' }]
            }
          ]
        },
        {
          model: Consultation,
          as: 'consultations',
          include: [{ model: User, as: 'doctor', attributes: ['id', 'name'] }]
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
              include: [
                { model: User, as: 'technician', attributes: ['id', 'name'] },
                { model: User, as: 'verifier', attributes: ['id', 'name'] }
              ]
            }
          ]
        }
      ]
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.json({
      success: true,
      visit
    });
  } catch (error) {
    next(error);
  }
};

const updateVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, doctor_id } = req.body;

    const visit = await PatientVisit.findByPk(id);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (status) visit.status = status;
    if (notes) visit.notes = notes;
    if (doctor_id) visit.doctor_id = doctor_id;

    await visit.save();

    await logAudit({
      userId: req.user.id,
      action: 'VISIT_STATUS_UPDATED',
      entity: 'PatientVisit',
      entityId: visit.id,
      details: { new_status: status },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Visit status updated successfully',
      visit
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVisit,
  listVisits,
  getVisitById,
  updateVisitStatus
};
