const { Op } = require('sequelize');
const { Appointment, Patient, User } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

const createAppointment = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, type = 'follow_up', notes } = req.body;

    if (!patient_id || !appointment_date) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and appointment date are required.'
      });
    }

    const appointment = await Appointment.create({
      patient_id,
      doctor_id: doctor_id || req.user.id,
      appointment_date,
      appointment_time: appointment_time || '09:00 AM',
      type,
      notes: notes || null,
      status: 'scheduled'
    });

    await logAudit({
      userId: req.user.id,
      action: 'APPOINTMENT_SCHEDULED',
      entity: 'Appointment',
      entityId: appointment.id,
      details: { patient_id, date: appointment_date },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

const listAppointments = async (req, res, next) => {
  try {
    const { date, status, doctor_id, patient_id } = req.query;
    const whereClause = {};

    if (date) whereClause.appointment_date = date;
    if (status) whereClause.status = status;
    if (doctor_id) whereClause.doctor_id = doctor_id;
    if (patient_id) whereClause.patient_id = patient_id;

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'card_number', 'full_name', 'phone'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] }
      ],
      order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
    });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, appointment_date, appointment_time } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    if (appointment_date) appointment.appointment_date = appointment_date;
    if (appointment_time) appointment.appointment_time = appointment_time;

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  listAppointments,
  updateAppointment
};
