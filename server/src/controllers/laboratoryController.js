const { Op } = require('sequelize');
const {
  ProcedureRequest,
  ProcedureRequestItem,
  LaboratoryResult,
  Patient,
  PatientVisit,
  User,
  Service,
  sequelize
} = require('../models');
const { REQUEST_STATUS, VISIT_STATUS, SERVICE_CATEGORIES, ROLES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');

const listLabRequests = async (req, res, next) => {
  try {
    const { status, category, search, technician_id, page = 1, limit = 50 } = req.query;
    const whereClause = {};

    // Laboratory requests only
    whereClause.category = category || SERVICE_CATEGORIES.LABORATORY;

    if (status) {
      whereClause.status = status;
    }

    // Role-based filtering:
    // - Lab Tech only sees requests assigned to them
    // - Doctor only sees requests ordered for their patients
    if (req.user && req.user.role === ROLES.LAB_TECH) {
      whereClause.technician_id = req.user.id;
    } else if (req.user && req.user.role === ROLES.DOCTOR) {
      whereClause.doctor_id = req.user.id;
    } else if (technician_id) {
      whereClause.technician_id = technician_id;
    }

    const patientInclude = {
      model: Patient,
      as: 'patient',
      attributes: ['id', 'card_number', 'full_name', 'age', 'sex', 'phone', 'allergies', 'medical_history', 'current_medications']
    };

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      patientInclude.where = {
        [Op.or]: [
          { card_number: { [Op.like]: searchTerm } },
          { full_name: { [Op.like]: searchTerm } }
        ]
      };
      patientInclude.required = true;
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await ProcedureRequest.findAndCountAll({
      where: whereClause,
      include: [
        patientInclude,
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'technician',
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
      order: [
        // urgent priority first, then status priority
        ['priority', 'DESC'],
        ['id', 'DESC']
      ],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      requests: rows
    });
  } catch (error) {
    next(error);
  }
};

const startTest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await ProcedureRequest.findByPk(id, {
      include: [{ model: Patient, as: 'patient' }]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Procedure request not found'
      });
    }

    if (request.status === REQUEST_STATUS.AWAITING_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been approved for this test. Laboratory cannot process tests before payment verification by Reception.'
      });
    }

    if (request.status === REQUEST_STATUS.IN_PROGRESS) {
      return res.json({
        success: true,
        message: 'Test is already marked as in progress.',
        procedure_request: request
      });
    }

    request.status = REQUEST_STATUS.IN_PROGRESS;
    await request.save();

    await logAudit({
      userId: req.user.id,
      action: 'LAB_TEST_STARTED',
      entity: 'ProcedureRequest',
      entityId: request.id,
      details: { patient_id: request.patient_id, category: request.category },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Test status updated to In Progress.',
      procedure_request: request
    });
  } catch (error) {
    next(error);
  }
};

const submitLabResult = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      request_id,
      request_item_id,
      test_name,
      findings,
      results_data,
      observations,
      mark_sent_to_doctor = true
    } = req.body;

    const technician_id = req.user.id;

    const request = await ProcedureRequest.findByPk(request_id, {
      include: [{ model: PatientVisit, as: 'visit' }],
      transaction: t
    });

    if (!request) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Procedure request not found'
      });
    }

    if (request.status === REQUEST_STATUS.AWAITING_PAYMENT) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot record test results because the required payment is still pending verification.'
      });
    }

    // Create result record
    const result = await LaboratoryResult.create({
      request_id: request.id,
      request_item_id: request_item_id || null,
      patient_id: request.patient_id,
      technician_id,
      test_name: test_name || `${request.category.toUpperCase()} Examination`,
      findings: findings || null,
      results_data: typeof results_data === 'object' ? JSON.stringify(results_data) : results_data,
      observations: observations || null,
      status: 'final',
      completed_at: new Date(),
      verified_by: technician_id
    }, { transaction: t });

    // Update procedure item status if item provided
    if (request_item_id) {
      await ProcedureRequestItem.update(
        { status: 'completed' },
        { where: { id: request_item_id }, transaction: t }
      );
    } else {
      await ProcedureRequestItem.update(
        { status: 'completed' },
        { where: { request_id: request.id }, transaction: t }
      );
    }

    // Update request status to 'results_ready' or 'sent_to_doctor'
    const newStatus = mark_sent_to_doctor ? REQUEST_STATUS.SENT_TO_DOCTOR : REQUEST_STATUS.RESULTS_READY;
    request.status = newStatus;
    await request.save({ transaction: t });

    // Update visit status to 'results_ready' so the doctor queue highlights it immediately!
    if (request.visit) {
      request.visit.status = VISIT_STATUS.RESULTS_READY;
      await request.visit.save({ transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'LAB_RESULTS_SUBMITTED',
      entity: 'LaboratoryResult',
      entityId: result.id,
      details: {
        test_name: result.test_name,
        request_id: request.id,
        patient_id: request.patient_id
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Test result submitted and transmitted to requesting doctor.',
      result,
      procedure_request: request
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const getLabResultById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await LaboratoryResult.findByPk(id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'verifier', attributes: ['id', 'name'] },
        {
          model: ProcedureRequest,
          as: 'request',
          include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'email'] }]
        }
      ]
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory result not found'
      });
    }

    res.json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
};

const assignTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;

    const request = await ProcedureRequest.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Procedure request not found'
      });
    }

    request.technician_id = technician_id ? parseInt(technician_id, 10) : null;
    await request.save();

    await logAudit({
      userId: req.user.id,
      action: 'LAB_REQUEST_ASSIGNED',
      entity: 'ProcedureRequest',
      entityId: request.id,
      details: { technician_id: request.technician_id },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Technician assigned successfully',
      procedure_request: request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLabRequests,
  startTest,
  submitLabResult,
  getLabResultById,
  assignTechnician
};
