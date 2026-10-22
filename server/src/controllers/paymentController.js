const { Op } = require('sequelize');
const {
  Payment,
  PaymentAllocation,
  Patient,
  PatientVisit,
  ProcedureRequest,
  ProcedureRequestItem,
  Service,
  User,
  sequelize
} = require('../models');
const { PAYMENT_STATUS, VISIT_STATUS, REQUEST_STATUS } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');

const listPayments = async (req, res, next) => {
  try {
    const { status, payment_method, date, search, page = 1, limit = 50 } = req.query;
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (payment_method) {
      whereClause.payment_method = payment_method;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.created_at = { [Op.between]: [startDate, endDate] };
    }

    const patientWhere = {};
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      patientWhere[Op.or] = [
        { card_number: { [Op.like]: searchTerm } },
        { full_name: { [Op.like]: searchTerm } },
        { phone: { [Op.like]: searchTerm } }
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'patient',
          where: Object.keys(patientWhere).length > 0 ? patientWhere : undefined,
          attributes: ['id', 'card_number', 'full_name', 'phone']
        },
        {
          model: PatientVisit,
          as: 'visit',
          attributes: ['id', 'status', 'visit_type']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'role']
        },
        {
          model: PaymentAllocation,
          as: 'allocations',
          include: [
            { model: Service, as: 'service', attributes: ['id', 'service_name', 'service_code', 'category', 'price'] },
            { model: ProcedureRequest, as: 'procedure_request', attributes: ['id', 'category', 'status', 'clinical_reason'] }
          ]
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
      payments: rows
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: PatientVisit,
          as: 'visit'
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: PaymentAllocation,
          as: 'allocations',
          include: [
            { model: Service, as: 'service' },
            { model: ProcedureRequest, as: 'procedure_request' }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    next(error);
  }
};

const approvePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { payment_method, amount_paid, transaction_reference, notes } = req.body;

    const payment = await Payment.findByPk(id, {
      include: [
        { model: PaymentAllocation, as: 'allocations' },
        { model: PatientVisit, as: 'visit' },
        { model: Patient, as: 'patient' }
      ],
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (payment.status === PAYMENT_STATUS.APPROVED) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'This payment has already been approved and verified. Duplicate approval is not permitted.'
      });
    }

    const verifiedAmount = amount_paid !== undefined ? parseFloat(amount_paid) : parseFloat(payment.total_amount);

    if (isNaN(verifiedAmount) || verifiedAmount <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'A valid amount paid must be provided to approve this payment.'
      });
    }

    // Update payment record
    payment.status = PAYMENT_STATUS.APPROVED;
    payment.amount_paid = verifiedAmount;
    payment.approved_by = req.user.id;
    payment.approved_at = new Date();
    if (payment_method) payment.payment_method = payment_method;
    if (transaction_reference) payment.transaction_reference = transaction_reference;
    if (notes) payment.notes = payment.notes ? `${payment.notes} | ${notes}` : notes;

    await payment.save({ transaction: t });

    // Process all payment allocations to update relevant department queues
    for (const allocation of payment.allocations) {
      // 1. If this allocation is for a procedure request:
      if (allocation.procedure_request_id) {
        const procRequest = await ProcedureRequest.findByPk(allocation.procedure_request_id, { transaction: t });
        if (procRequest) {
          procRequest.status = REQUEST_STATUS.PAYMENT_APPROVED;
          procRequest.paid_amount = parseFloat(procRequest.paid_amount || 0) + parseFloat(allocation.amount);
          await procRequest.save({ transaction: t });

          // Update items
          await ProcedureRequestItem.update(
            { status: 'paid' },
            {
              where: { request_id: procRequest.id },
              transaction: t
            }
          );
        }
      }

      // 2. If this allocation is for card or consultation fee:
      if (allocation.allocation_type === 'consultation_fee' || allocation.allocation_type === 'card_fee') {
        if (payment.visit && payment.visit.status === VISIT_STATUS.REGISTERED) {
          payment.visit.status = VISIT_STATUS.WAITING_CONSULTATION;
          await payment.visit.save({ transaction: t });
        }
      }
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'PAYMENT_APPROVED',
      entity: 'Payment',
      entityId: payment.id,
      details: {
        receipt_number: payment.receipt_number,
        amount_paid: payment.amount_paid,
        payment_method: payment.payment_method,
        patient_id: payment.patient_id
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Payment verified and approved successfully. Patient/requests routed to appropriate departments.',
      payment
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  listPayments,
  getPaymentById,
  approvePayment
};
