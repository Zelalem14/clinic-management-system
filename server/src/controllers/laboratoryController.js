const { Op } = require('sequelize');
const {
  ProcedureRequest,
  ProcedureRequestItem,
  LaboratoryResult,
  Patient,
  PatientVisit,
  User,
  Service,
  LabTestTemplate,
  sequelize
} = require('../models');
const { REQUEST_STATUS, VISIT_STATUS, SERVICE_CATEGORIES, ROLES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');
const defaultLabTemplates = require('../database/seeders/labTemplatesData');

/**
 * Intelligent helper to match a requested laboratory test to a structured template
 */
const findMatchingTemplate = async (testName = '') => {
  const normalized = (testName || '').toLowerCase().trim();

  // 1. Direct code search
  let template = await LabTestTemplate.findOne({
    where: {
      is_active: true,
      [Op.or]: [
        { template_code: { [Op.like]: `%${normalized}%` } },
        { template_name: { [Op.like]: `%${normalized}%` } }
      ]
    }
  });

  if (template) return template;

  // 2. Clinical keyword matching
  let targetCode = null;
  if (normalized.includes('cbc') || normalized.includes('fbc') || normalized.includes('complete blood') || normalized.includes('hemogram')) {
    targetCode = 'TMPL-CBC';
  } else if (normalized.includes('hiv')) {
    targetCode = 'TMPL-HIV';
  } else if (normalized.includes('hbsag') || normalized.includes('hepatitis b')) {
    targetCode = 'TMPL-HBSAG';
  } else if (normalized.includes('hcv') || normalized.includes('hepatitis c')) {
    targetCode = 'TMPL-HCV';
  } else if (normalized.includes('malaria') || normalized.includes('rdt') || normalized.includes('blood film') || normalized.includes('smear')) {
    targetCode = 'TMPL-MALARIA';
  } else if (normalized.includes('preg') || normalized.includes('hcg')) {
    targetCode = 'TMPL-PREG';
  } else if (normalized.includes('group') || normalized.includes('rh') || normalized.includes('abo')) {
    targetCode = 'TMPL-BLOODGROUP';
  } else if (normalized.includes('glucose') || normalized.includes('sugar') || normalized.includes('fbs') || normalized.includes('rbs')) {
    targetCode = 'TMPL-GLUCOSE';
  } else if (normalized.includes('urin') || normalized.includes('dipstick')) {
    targetCode = 'TMPL-URINE';
  } else if (normalized.includes('stool') || normalized.includes('parasite')) {
    targetCode = 'TMPL-STOOL';
  } else if (normalized.includes('widal') || normalized.includes('typhoid')) {
    targetCode = 'TMPL-WIDAL';
  } else if (normalized.includes('pylori') || normalized.includes('h. pylori')) {
    targetCode = 'TMPL-HPYLORI';
  } else if (normalized.includes('lipid') || normalized.includes('cholesterol') || normalized.includes('triglyceride')) {
    targetCode = 'TMPL-LIPID';
  } else if (normalized.includes('lft') || normalized.includes('liver') || normalized.includes('alt') || normalized.includes('ast')) {
    targetCode = 'TMPL-LFT';
  } else if (normalized.includes('rft') || normalized.includes('kft') || normalized.includes('renal') || normalized.includes('creatinine')) {
    targetCode = 'TMPL-RFT';
  } else if (normalized.includes('hemoglobin') || normalized.includes('hb')) {
    targetCode = 'TMPL-HB';
  }

  if (targetCode) {
    template = await LabTestTemplate.findOne({
      where: { template_code: targetCode, is_active: true }
    });
  }

  // 3. Fallback: first active template or null
  if (!template) {
    template = await LabTestTemplate.findOne({ where: { is_active: true } });
  }

  return template;
};

/**
 * Calculates parameter abnormal flag based on patient demographics and reference ranges
 */
const computeParameterFlag = (paramDef, value, patientSex = 'male', patientAge = null) => {
  if (value === undefined || value === null || value === '') {
    return 'NORMAL';
  }

  const strVal = String(value).trim();

  // Option-based qualitative test
  if (paramDef.type === 'options') {
    if (paramDef.abnormal_options && Array.isArray(paramDef.abnormal_options)) {
      const isAbnormal = paramDef.abnormal_options.some(abn => strVal.toLowerCase().includes(abn.toLowerCase()));
      if (isAbnormal) {
        if (strVal.toLowerCase().includes('invalid')) return 'INVALID';
        if (strVal.toLowerCase().includes('positive') || strVal.toLowerCase().includes('reactive')) return 'POSITIVE';
        return 'ABNORMAL';
      }
    }
    if (strVal.toLowerCase().includes('positive') || strVal.toLowerCase().includes('reactive')) {
      return 'POSITIVE';
    }
    if (strVal.toLowerCase().includes('invalid')) {
      return 'INVALID';
    }
    return 'NORMAL';
  }

  // Numeric test with reference intervals
  if (paramDef.type === 'numeric') {
    const num = parseFloat(strVal);
    if (isNaN(num)) return 'NORMAL';

    // Check sex-specific range
    let min = paramDef.ref_min;
    let max = paramDef.ref_max;

    if (patientSex && patientSex.toLowerCase() === 'female' && paramDef.female_min !== undefined) {
      min = paramDef.female_min;
      max = paramDef.female_max;
    } else if (patientSex && patientSex.toLowerCase() === 'male' && paramDef.male_min !== undefined) {
      min = paramDef.male_min;
      max = paramDef.male_max;
    } else if (patientAge !== null && patientAge < 15 && paramDef.pediatric_min !== undefined) {
      min = paramDef.pediatric_min;
      max = paramDef.pediatric_max;
    }

    // Critical range check
    if (paramDef.critical_low !== undefined && num < paramDef.critical_low) return 'CRITICAL_LOW';
    if (paramDef.critical_high !== undefined && num > paramDef.critical_high) return 'CRITICAL_HIGH';

    if (min !== undefined && num < min) return 'LOW';
    if (max !== undefined && num > max) return 'HIGH';
    return 'NORMAL';
  }

  return 'NORMAL';
};

// ----------------------------------------------------
// 1. TEMPLATES API
// ----------------------------------------------------

const listTemplates = async (req, res, next) => {
  try {
    const { category, search, active_only } = req.query;
    const where = {};

    if (active_only === 'true') {
      where.is_active = true;
    }
    if (category) {
      where.category = category;
    }
    if (search && search.trim()) {
      where[Op.or] = [
        { template_code: { [Op.like]: `%${search.trim()}%` } },
        { template_name: { [Op.like]: `%${search.trim()}%` } },
        { department: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const templates = await LabTestTemplate.findAll({
      where,
      order: [['template_name', 'ASC']]
    });

    res.json({
      success: true,
      count: templates.length,
      templates
    });
  } catch (error) {
    next(error);
  }
};

const getTemplateByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const template = await LabTestTemplate.findOne({
      where: {
        [Op.or]: [
          { template_code: code },
          { id: isNaN(parseInt(code, 10)) ? -1 : parseInt(code, 10) }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Laboratory template '${code}' not found`
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const {
      template_code,
      template_name,
      category = 'laboratory',
      specimen_type = 'Serum',
      department = 'Clinical Chemistry',
      parameters = [],
      default_observations
    } = req.body;

    if (!template_code || !template_name || !parameters.length) {
      return res.status(400).json({
        success: false,
        message: 'Template code, template name, and at least one parameter are required.'
      });
    }

    const existing = await LabTestTemplate.findOne({ where: { template_code } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Template with code '${template_code}' already exists.`
      });
    }

    const template = await LabTestTemplate.create({
      template_code: template_code.toUpperCase().trim(),
      template_name: template_name.trim(),
      category,
      specimen_type,
      department,
      parameters,
      default_observations: default_observations || null,
      is_active: true
    });

    await logAudit({
      userId: req.user.id,
      action: 'LAB_TEMPLATE_CREATED',
      entity: 'LabTestTemplate',
      entityId: template.id,
      details: { template_code: template.template_code, template_name: template.template_name },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Laboratory template created successfully',
      template
    });
  } catch (error) {
    next(error);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await LabTestTemplate.findOne({
      where: {
        [Op.or]: [
          { id: isNaN(parseInt(id, 10)) ? -1 : parseInt(id, 10) },
          { template_code: id }
        ]
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory template not found'
      });
    }

    const {
      template_name,
      specimen_type,
      department,
      parameters,
      default_observations,
      is_active
    } = req.body;

    if (template_name !== undefined) template.template_name = template_name;
    if (specimen_type !== undefined) template.specimen_type = specimen_type;
    if (department !== undefined) template.department = department;
    if (parameters !== undefined) template.parameters = parameters;
    if (default_observations !== undefined) template.default_observations = default_observations;
    if (is_active !== undefined) template.is_active = is_active;

    await template.save();

    await logAudit({
      userId: req.user.id,
      action: 'LAB_TEMPLATE_UPDATED',
      entity: 'LabTestTemplate',
      entityId: template.id,
      details: { template_code: template.template_code },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Laboratory template updated successfully',
      template
    });
  } catch (error) {
    next(error);
  }
};

const getMatchedTemplate = async (req, res, next) => {
  try {
    const { test_name } = req.query;
    const template = await findMatchingTemplate(test_name);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No matching laboratory template found.'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------
// 2. LAB REQUESTS & TESTS EXECUTION
// ----------------------------------------------------

const listLabRequests = async (req, res, next) => {
  try {
    const { status, category, search, technician_id, page = 1, limit = 50 } = req.query;
    const whereClause = {};

    whereClause.category = category || SERVICE_CATEGORIES.LABORATORY;

    if (status) {
      whereClause.status = status;
    }

    // Role-based visibility
    if (req.user && req.user.role === ROLES.LAB_TECH) {
      // Lab tech sees all lab requests, or assigned requests
      if (technician_id) whereClause.technician_id = technician_id;
    } else if (req.user && req.user.role === ROLES.DOCTOR) {
      whereClause.doctor_id = req.user.id;
    } else if (technician_id) {
      whereClause.technician_id = technician_id;
    }

    const patientInclude = {
      model: Patient,
      as: 'patient',
      attributes: ['id', 'card_number', 'full_name', 'age', 'sex', 'phone', 'dob', 'allergies', 'medical_history', 'current_medications']
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
          include: [
            { model: User, as: 'technician', attributes: ['id', 'name'] },
            { model: User, as: 'verifier', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [
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

    // Assign current technician if not assigned
    if (!request.technician_id && req.user && req.user.role === ROLES.LAB_TECH) {
      request.technician_id = req.user.id;
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
      message: 'Test marked as In Progress.',
      procedure_request: request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit structured laboratory result (Draft or Final)
 */
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
      status = 'final', // 'draft' | 'final'
      mark_sent_to_doctor = true
    } = req.body;

    const technician_id = req.user.id;

    const request = await ProcedureRequest.findByPk(request_id, {
      include: [
        { model: PatientVisit, as: 'visit' },
        { model: Patient, as: 'patient' }
      ],
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
        message: 'Cannot record test results: fee is awaiting receptionist payment verification.'
      });
    }

    // Process structured parameters & compute flags
    let structuredPayload = results_data;
    if (typeof structuredPayload === 'string') {
      try {
        structuredPayload = JSON.parse(structuredPayload);
      } catch (e) {
        structuredPayload = { raw: results_data };
      }
    }

    const patientSex = request.patient?.sex || 'male';
    const patientAge = request.patient?.age || null;

    if (structuredPayload && Array.isArray(structuredPayload.parameters)) {
      structuredPayload.parameters = structuredPayload.parameters.map(p => {
        const flag = computeParameterFlag(p, p.value, patientSex, patientAge);
        return {
          ...p,
          flag: p.flag || flag
        };
      });
    }

    // Generate readable findings summary text if missing
    let findingsSummary = findings;
    if (!findingsSummary && structuredPayload && Array.isArray(structuredPayload.parameters)) {
      findingsSummary = structuredPayload.parameters
        .filter(p => p.value !== undefined && p.value !== '')
        .map(p => `${p.name}: ${p.value} ${p.unit || ''} [${p.flag || 'NORMAL'}]`)
        .join('; ');
    }

    // Check if result already exists for this request (update vs create)
    let result = await LaboratoryResult.findOne({
      where: {
        request_id: request.id,
        ...(request_item_id ? { request_item_id } : {})
      },
      transaction: t
    });

    const isFinal = status === 'final';

    if (result) {
      result.test_name = test_name || result.test_name;
      result.findings = findingsSummary || result.findings;
      result.results_data = structuredPayload;
      result.observations = observations !== undefined ? observations : result.observations;
      result.status = isFinal ? 'final' : 'draft';
      result.technician_id = technician_id;
      if (isFinal) {
        result.completed_at = new Date();
        result.verified_by = technician_id;
      }
      await result.save({ transaction: t });
    } else {
      result = await LaboratoryResult.create({
        request_id: request.id,
        request_item_id: request_item_id || null,
        patient_id: request.patient_id,
        technician_id,
        test_name: test_name || `${request.category.toUpperCase()} Examination`,
        findings: findingsSummary || 'Structured laboratory evaluation completed.',
        results_data: structuredPayload,
        observations: observations || null,
        status: isFinal ? 'final' : 'draft',
        completed_at: isFinal ? new Date() : null,
        verified_by: isFinal ? technician_id : null
      }, { transaction: t });
    }

    // If final, transition statuses
    if (isFinal) {
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

      const newStatus = mark_sent_to_doctor ? REQUEST_STATUS.SENT_TO_DOCTOR : REQUEST_STATUS.RESULTS_READY;
      request.status = newStatus;
      request.technician_id = technician_id;
      await request.save({ transaction: t });

      // Signal doctor queue
      if (request.visit) {
        request.visit.status = VISIT_STATUS.RESULTS_READY;
        await request.visit.save({ transaction: t });
      }
    } else {
      // Draft state: request is in progress
      request.status = REQUEST_STATUS.IN_PROGRESS;
      request.technician_id = technician_id;
      await request.save({ transaction: t });
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: isFinal ? 'LAB_RESULTS_SUBMITTED' : 'LAB_RESULTS_DRAFT_SAVED',
      entity: 'LaboratoryResult',
      entityId: result.id,
      details: {
        test_name: result.test_name,
        request_id: request.id,
        patient_id: request.patient_id,
        status: result.status
      },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: isFinal
        ? 'Laboratory findings finalized and sent to the attending physician.'
        : 'Laboratory findings saved as draft. You can continue editing before final submission.',
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
        { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'verifier', attributes: ['id', 'name'] },
        {
          model: ProcedureRequest,
          as: 'request',
          include: [
            { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
            { model: PatientVisit, as: 'visit' }
          ]
        }
      ]
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory result record not found.'
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

/**
 * Doctor reviews finalized lab result and adds clinical comments
 */
const doctorReviewResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doctor_comments } = req.body;

    const result = await LaboratoryResult.findByPk(id, {
      include: [
        {
          model: ProcedureRequest,
          as: 'request',
          include: [{ model: User, as: 'doctor' }]
        }
      ]
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory result not found'
      });
    }

    // Role verification: Doctor or Admin
    if (req.user.role === ROLES.DOCTOR && result.request?.doctor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned attending physician or medical administrator can review these findings.'
      });
    }

    result.doctor_comments = doctor_comments;
    result.doctor_reviewed_at = new Date();
    await result.save();

    await logAudit({
      userId: req.user.id,
      action: 'LAB_RESULTS_REVIEWED_BY_DOCTOR',
      entity: 'LaboratoryResult',
      entityId: result.id,
      details: { doctor_id: req.user.id, comments: doctor_comments },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Clinical interpretation recorded successfully.',
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
  // Templates
  listTemplates,
  getTemplateByCode,
  createTemplate,
  updateTemplate,
  getMatchedTemplate,

  // Lab processing
  listLabRequests,
  startTest,
  submitLabResult,
  getLabResultById,
  doctorReviewResult,
  assignTechnician
};
