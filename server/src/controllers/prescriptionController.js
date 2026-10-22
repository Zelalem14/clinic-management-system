const {
  Prescription,
  PrescriptionItem,
  Patient,
  User,
  Consultation,
  sequelize
} = require('../models');
const { logAudit } = require('../middleware/auditLogger');

const createPrescription = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { patient_id, consultation_id, instructions, items = [] } = req.body;
    const doctor_id = req.user.id;

    if (!patient_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Prescription must include at least one medication item.' });
    }

    const prescription = await Prescription.create({
      patient_id,
      consultation_id: consultation_id || null,
      doctor_id,
      instructions: instructions || null,
      status: 'active'
    }, { transaction: t });

    for (const item of items) {
      if (item.medication_name) {
        await PrescriptionItem.create({
          prescription_id: prescription.id,
          medication_name: item.medication_name,
          dosage: item.dosage || '1 dose',
          frequency: item.frequency || 'Once daily',
          duration: item.duration || '5 days',
          route: item.route || 'Oral',
          instructions: item.instructions || '',
          quantity: item.quantity || 1
        }, { transaction: t });
      }
    }

    await t.commit();

    await logAudit({
      userId: req.user.id,
      action: 'PRESCRIPTION_CREATED',
      entity: 'Prescription',
      entityId: prescription.id,
      details: { patient_id, items_count: items.length },
      ipAddress: req.ip
    });

    const fullPrescription = await Prescription.findByPk(prescription.id, {
      include: [
        { model: PrescriptionItem, as: 'items' },
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Prescription generated successfully',
      prescription: fullPrescription
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

const listPrescriptions = async (req, res, next) => {
  try {
    const { patient_id, consultation_id, status } = req.query;
    const whereClause = {};

    if (patient_id) whereClause.patient_id = patient_id;
    if (consultation_id) whereClause.consultation_id = consultation_id;
    if (status) whereClause.status = status;

    const prescriptions = await Prescription.findAll({
      where: whereClause,
      include: [
        { model: PrescriptionItem, as: 'items' },
        { model: Patient, as: 'patient', attributes: ['id', 'card_number', 'full_name'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      prescriptions
    });
  } catch (error) {
    next(error);
  }
};

const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const prescription = await Prescription.findByPk(id, {
      include: [
        { model: PrescriptionItem, as: 'items' },
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
        { model: Consultation, as: 'consultation' }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    next(error);
  }
};

const updatePrescriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const prescription = await Prescription.findByPk(id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    prescription.status = status;
    await prescription.save();

    await logAudit({
      userId: req.user.id,
      action: 'PRESCRIPTION_STATUS_UPDATED',
      entity: 'Prescription',
      entityId: prescription.id,
      details: { new_status: status },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Prescription status updated',
      prescription
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  listPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus
};
