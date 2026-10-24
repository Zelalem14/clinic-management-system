const { Op } = require('sequelize');
const {
  Payment,
  PaymentAllocation,
  Patient,
  PatientVisit,
  Consultation,
  ProcedureRequest,
  LaboratoryResult,
  Appointment,
  AuditLog,
  Service,
  User,
  sequelize
} = require('../models');
const { PAYMENT_STATUS, VISIT_STATUS, REQUEST_STATUS, SERVICE_CATEGORIES, ROLES } = require('../config/constants');

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total & Today's Patients
    const totalPatients = await Patient.count();
    const todayPatients = await Patient.count({
      where: {
        created_at: { [Op.between]: [today, endToday] }
      }
    });

    // 2. Doctor Queue counts (scoped to current doctor if logged in as doctor)
    const doctorFilter = (req.user && req.user.role === ROLES.DOCTOR) ? { doctor_id: req.user.id } : {};
    const waitingForDoctor = await PatientVisit.count({
      where: { status: VISIT_STATUS.WAITING_CONSULTATION, ...doctorFilter }
    });
    const inConsultation = await PatientVisit.count({
      where: { status: VISIT_STATUS.IN_CONSULTATION, ...doctorFilter }
    });
    const resultsReadyCount = await PatientVisit.count({
      where: { status: VISIT_STATUS.RESULTS_READY, ...doctorFilter }
    });
    const totalConsultations = await Consultation.count({
      where: (req.user && req.user.role === ROLES.DOCTOR) ? { doctor_id: req.user.id } : {}
    });

    // 3. Payment Stats
    const pendingPaymentsCount = await Payment.count({
      where: { status: PAYMENT_STATUS.PENDING }
    });
    const approvedPaymentsCount = await Payment.count({
      where: { status: PAYMENT_STATUS.APPROVED }
    });

    const pendingPaymentsAmount = await Payment.sum('total_amount', {
      where: { status: PAYMENT_STATUS.PENDING }
    }) || 0;

    const totalRevenue = await Payment.sum('amount_paid', {
      where: { status: PAYMENT_STATUS.APPROVED }
    }) || 0;

    const todayRevenue = await Payment.sum('amount_paid', {
      where: {
        status: PAYMENT_STATUS.APPROVED,
        approved_at: { [Op.between]: [today, endToday] }
      }
    }) || 0;

    const monthRevenue = await Payment.sum('amount_paid', {
      where: {
        status: PAYMENT_STATUS.APPROVED,
        approved_at: { [Op.gte]: firstDayOfMonth }
      }
    }) || 0;

    // 4. Laboratory / Procedure counts (scoped to current lab tech if logged in as lab tech)
    const techFilter = (req.user && req.user.role === ROLES.LAB_TECH) ? { technician_id: req.user.id } : {};
    const labAwaitingPayment = await ProcedureRequest.count({
      where: { status: REQUEST_STATUS.AWAITING_PAYMENT, ...techFilter }
    });
    const labApproved = await ProcedureRequest.count({
      where: { status: REQUEST_STATUS.PAYMENT_APPROVED, ...techFilter }
    });
    const labInProgress = await ProcedureRequest.count({
      where: { status: REQUEST_STATUS.IN_PROGRESS, ...techFilter }
    });
    const labCompleted = await ProcedureRequest.count({
      where: {
        status: {
          [Op.in]: [REQUEST_STATUS.RESULTS_READY, REQUEST_STATUS.SENT_TO_DOCTOR, REQUEST_STATUS.COMPLETED]
        },
        ...techFilter
      }
    });

    // 5. Appointments today
    const appointmentsToday = await Appointment.count({
      where: {
        appointment_date: today.toISOString().slice(0, 10),
        status: 'scheduled'
      }
    });

    // 6. Revenue by Payment Method
    const paymentsByMethod = await Payment.findAll({
      attributes: [
        'payment_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount_paid')), 'total']
      ],
      where: { status: PAYMENT_STATUS.APPROVED },
      group: ['payment_method']
    });

    // 7. Revenue by Allocation Type (Category)
    const revenueByCategory = await PaymentAllocation.findAll({
      attributes: [
        'allocation_type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      include: [
        {
          model: Payment,
          as: 'payment',
          where: { status: PAYMENT_STATUS.APPROVED },
          attributes: []
        }
      ],
      group: ['allocation_type']
    });

    res.json({
      success: true,
      stats: {
        reception: {
          today_patients: todayPatients,
          total_patients: totalPatients,
          waiting_for_doctor: waitingForDoctor,
          pending_payments_count: pendingPaymentsCount,
          pending_payments_amount: pendingPaymentsAmount,
          approved_payments_count: approvedPaymentsCount,
          today_revenue: todayRevenue
        },
        doctor: {
          waiting_patients: waitingForDoctor,
          in_consultation: inConsultation,
          results_ready: resultsReadyCount,
          total_consultations: totalConsultations,
          appointments_today: appointmentsToday
        },
        laboratory: {
          awaiting_payment: labAwaitingPayment,
          ready_to_start: labApproved,
          in_progress: labInProgress,
          completed: labCompleted
        },
        admin: {
          total_revenue: totalRevenue,
          today_revenue: todayRevenue,
          month_revenue: monthRevenue,
          total_patients: totalPatients,
          total_consultations: totalConsultations,
          outstanding_pending_amount: pendingPaymentsAmount,
          payments_by_method: paymentsByMethod,
          revenue_by_category: revenueByCategory
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entity, user_id, page = 1, limit = 50 } = req.query;
    const whereClause = {};

    if (action) whereClause.action = action;
    if (entity) whereClause.entity = entity;
    if (user_id) whereClause.user_id = user_id;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
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
      logs: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs
};
