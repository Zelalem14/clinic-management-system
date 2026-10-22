const { Op } = require('sequelize');
const {
  ProcedureRequest,
  ProcedureRequestItem,
  Service,
  Payment,
  PaymentAllocation,
  PatientVisit,
  Patient,
  User,
  LaboratoryResult,
  sequelize
} = require('../models');
const { REQUEST_STATUS, PAYMENT_STATUS, VISIT_STATUS, SERVICE_CATEGORIES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');

const generateReceiptNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `PRC-${dateStr}-${randomStr}`;
};

const createProcedureRequest = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      visit_id,
      patient_id,
      category = SERVICE_CATEGORIES.LABORATORY,
      clinical_reason,
      priority = 'routine',
      service_ids = [] // array of service IDs
    } = req.body;

    const doctor_id = req.user.id;

    if (!visit_id || !patient_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Visit ID and Patient ID are required.'
      });
    }

    if (!Array.isArray(service_ids) || service_ids.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'At least one procedure/test service must be selected.'
      });
    }

    // Fetch the services from database to get official prices
    const services = await Service.findAll({
      where: {
        id: { [Op.in]: service_ids },
        is_active: true
      },
      transaction: t
    });

    if (services.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'None of the requested services were found or active.'
      });
    }

    const totalCost = services.reduce((sum, s) => sum + parseFloat(s.price), 0);

    // Create the procedure request
    const procRequest = await ProcedureRequest.create({
      visit_id,
      patient_id,
      doctor_id,
      category,
      clinical_reason: clinical_reason || null,
      priority,
      status: REQUEST_STATUS.AWAITING_PAYMENT,
      total_cost: totalCost,
      paid_amount: 0.00
    }, { transaction: t });

    // Create item records
    for (const service of services) {
      await ProcedureRequestItem.create({
        request_id: procRequest.id,
        service_id: service.id,
        unit_price: service.price,
        status: 'awaiting_payment'
      }, { transaction: t });
    }

    // Automatically create a pending payment in reception queue
    const receipt_number = generateReceiptNumber();
    const serviceNames = services.map(s => s.service_name).join(', ');

    const payment = await Payment.create({
      visit_id,
      patient_id,
      receipt_number,
      total_amount: totalCost,
      amount_paid: 0.00,
      payment_method: 'cash',
      status: PAYMENT_STATUS.PENDING,
      notes: `Procedure Fee (${category.toUpperCase()}): ${serviceNames}`
    }, { transaction: t });

    // Create Payment Allocations for each service in the request
    for (const service of services) {
      await PaymentAllocation.create({
        payment_id: payment.id,
        service_id: service.id,
        procedure_request_id: procRequest.id,
        allocation_type: `${category}_fee`,
        amount: service.price
      }, { transaction: t });
    }

    // Update visit status to lab_pending if category is laboratory
    const visit = await PatientVisit.findByPk(visit_id, { transaction: t });
    if (visit && category === SERVICE_CATEGORIES.LABORATORY) {
      visit.status = VISIT_STATUS.LAB_PENDING;
      await visit.save({ transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'PROCEDURE_REQUESTED',
      entity: 'ProcedureRequest',
      entityId: procRequest.id,
      details: {
        category,
        totalCost,
        services: serviceNames,
        patient_id
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Procedure request created and queued for reception payment verification.',
      procedure_request: procRequest,
      payment_required: totalCost,
      payment_id: payment.id,
      services
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const listProcedureRequests = async (req, res, next) => {
  try {
    const { category, status, patient_id, visit_id, doctor_id, page = 1, limit = 50 } = req.query;
    const whereClause = {};

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (patient_id) {
      whereClause.patient_id = patient_id;
    }

    if (visit_id) {
      whereClause.visit_id = visit_id;
    }

    if (doctor_id) {
      whereClause.doctor_id = doctor_id;
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await ProcedureRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'card_number', 'full_name', 'age', 'sex', 'phone', 'allergies', 'medical_history']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ProcedureRequestItem,
          as: 'items',
          include: [{ model: Service, as: 'service' }]
        },
        {
          model: LaboratoryResult,
          as: 'results',
          include: [{ model: User, as: 'technician', attributes: ['id', 'name'] }]
        }
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      success: true,
      total: count,
      requests: rows
    });
  } catch (error) {
    next(error);
  }
};

const getProcedureRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await ProcedureRequest.findByPk(id, {
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
          model: PaymentAllocation,
          as: 'payment_allocations',
          include: [{ model: Payment, as: 'payment' }]
        }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Procedure request not found'
      });
    }

    res.json({
      success: true,
      procedure_request: request
    });
  } catch (error) {
    next(error);
  }
};

const updateProcedureRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;

    const request = await ProcedureRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Procedure request not found'
      });
    }

    if (status) request.status = status;
    if (cancellation_reason) request.cancellation_reason = cancellation_reason;

    await request.save();

    await logAudit({
      userId: req.user.id,
      action: 'PROCEDURE_STATUS_UPDATED',
      entity: 'ProcedureRequest',
      entityId: request.id,
      details: { new_status: status, reason: cancellation_reason },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Procedure request status updated',
      procedure_request: request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProcedureRequest,
  listProcedureRequests,
  getProcedureRequestById,
  updateProcedureRequestStatus
};
