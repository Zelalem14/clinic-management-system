const { Op } = require('sequelize');
const {
  Payment,
  PaymentAllocation,
  Patient,
  PatientVisit,
  Consultation,
  Diagnosis,
  ProcedureRequest,
  ProcedureRequestItem,
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

/**
 * Doctor Weekly Report: Patients seen per week and disease breakdown categorized by patient age groups
 */
const getDoctorWeeklyReport = async (req, res, next) => {
  try {
    const { doctor_id, start_date, end_date } = req.query;

    let targetDoctorId = null;
    if (req.user.role === ROLES.DOCTOR) {
      targetDoctorId = req.user.id;
    } else if (doctor_id) {
      targetDoctorId = parseInt(doctor_id, 10);
    }

    let start, end;
    if (start_date && end_date) {
      start = new Date(start_date);
      start.setHours(0, 0, 0, 0);
      end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMon);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    const consultWhere = {
      consultation_date: { [Op.between]: [start, end] }
    };
    if (targetDoctorId) {
      consultWhere.doctor_id = targetDoctorId;
    }

    const consultations = await Consultation.findAll({
      where: consultWhere,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'card_number', 'full_name', 'age', 'dob', 'sex']
        },
        {
          model: Diagnosis,
          as: 'diagnoses',
          attributes: ['id', 'code', 'description', 'type']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['consultation_date', 'ASC']]
    });

    const totalConsultations = consultations.length;
    const uniquePatientIds = new Set(consultations.map(c => c.patient_id));
    const totalPatientsSeen = uniquePatientIds.size;

    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyBreakdown = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = daysMap[d.getDay()];
      const dayConsults = consultations.filter(c => {
        const cDate = new Date(c.consultation_date).toISOString().slice(0, 10);
        return cDate === dateStr;
      });
      const dayPatients = new Set(dayConsults.map(c => c.patient_id)).size;
      dailyBreakdown.push({
        date: dateStr,
        day: dayName,
        consultations_count: dayConsults.length,
        patients_count: dayPatients
      });
    }

    const ageCategories = {
      pediatric: { label: 'Pediatric (0 - 14 yrs)', range: '0-14', min: 0, max: 14, total_diagnoses: 0, diseases: {} },
      youth: { label: 'Youth (15 - 24 yrs)', range: '15-24', min: 15, max: 24, total_diagnoses: 0, diseases: {} },
      adult: { label: 'Adults (25 - 54 yrs)', range: '25-54', min: 25, max: 54, total_diagnoses: 0, diseases: {} },
      senior: { label: 'Seniors (55+ yrs)', range: '55+', min: 55, max: 200, total_diagnoses: 0, diseases: {} }
    };

    const overallDiseases = {};

    consultations.forEach(c => {
      const p = c.patient;
      if (!p) return;

      let patientAge = p.age;
      if (patientAge === null || patientAge === undefined) {
        if (p.dob) {
          const birthDate = new Date(p.dob);
          patientAge = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        } else {
          patientAge = 30;
        }
      }

      let groupKey = 'adult';
      if (patientAge <= 14) groupKey = 'pediatric';
      else if (patientAge <= 24) groupKey = 'youth';
      else if (patientAge <= 54) groupKey = 'adult';
      else groupKey = 'senior';

      if (c.diagnoses && c.diagnoses.length > 0) {
        c.diagnoses.forEach(diag => {
          const diseaseName = diag.description ? diag.description.trim() : 'Unspecified Condition';
          const code = diag.code || '';
          const key = diseaseName;

          ageCategories[groupKey].total_diagnoses += 1;
          if (!ageCategories[groupKey].diseases[key]) {
            ageCategories[groupKey].diseases[key] = { name: diseaseName, code, count: 0 };
          }
          ageCategories[groupKey].diseases[key].count += 1;

          if (!overallDiseases[key]) {
            overallDiseases[key] = { name: diseaseName, code, count: 0 };
          }
          overallDiseases[key].count += 1;
        });
      }
    });

    const ageGroupBreakdown = Object.keys(ageCategories).map(k => {
      const group = ageCategories[k];
      const diseaseList = Object.values(group.diseases)
        .sort((a, b) => b.count - a.count)
        .map(d => ({
          name: d.name,
          code: d.code,
          count: d.count,
          percentage: group.total_diagnoses > 0 ? ((d.count / group.total_diagnoses) * 100).toFixed(1) : '0'
        }));

      return {
        key: k,
        label: group.label,
        range: group.range,
        total_diagnoses: group.total_diagnoses,
        diseases: diseaseList
      };
    });

    const topOverallDiseases = Object.values(overallDiseases)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      report: {
        week: {
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10)
        },
        doctor: targetDoctorId ? consultations[0]?.doctor || { id: targetDoctorId, name: 'Doctor' } : { name: 'All Doctors' },
        summary: {
          total_patients_seen: totalPatientsSeen,
          total_consultations: totalConsultations,
          total_diagnoses_recorded: Object.values(overallDiseases).reduce((sum, d) => sum + d.count, 0)
        },
        daily_trend: dailyBreakdown,
        age_group_breakdown: ageGroupBreakdown,
        top_overall_diseases: topOverallDiseases
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reception Analytics: Weekly visit/revenue reports and dedicated Daily Revenue Tracking
 */
const getReceptionAnalytics = async (req, res, next) => {
  try {
    const { date, start_date, end_date } = req.query;

    // 1. Daily Report Calculation
    const queryDateStr = date || new Date().toISOString().slice(0, 10);
    const dayStart = new Date(queryDateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(queryDateStr);
    dayEnd.setHours(23, 59, 59, 999);

    const dailyPayments = await Payment.findAll({
      where: {
        status: PAYMENT_STATUS.APPROVED,
        approved_at: { [Op.between]: [dayStart, dayEnd] }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'card_number', 'full_name', 'phone']
        },
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
      order: [['approved_at', 'DESC']]
    });

    const dailyRevenue = dailyPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
    const dailyReceiptsCount = dailyPayments.length;

    const dailyByMethod = {
      cash: { count: 0, total: 0 },
      telebirr: { count: 0, total: 0 },
      bank: { count: 0, total: 0 }
    };
    dailyPayments.forEach(p => {
      const m = (p.payment_method || 'cash').toLowerCase();
      const amount = parseFloat(p.amount_paid || 0);
      if (m.includes('telebirr')) {
        dailyByMethod.telebirr.count += 1;
        dailyByMethod.telebirr.total += amount;
      } else if (m.includes('bank') || m.includes('cbe')) {
        dailyByMethod.bank.count += 1;
        dailyByMethod.bank.total += amount;
      } else {
        dailyByMethod.cash.count += 1;
        dailyByMethod.cash.total += amount;
      }
    });

    const dailyAllocations = {
      card_fee: 0,
      consultation_fee: 0,
      procedure_fee: 0,
      other: 0
    };
    dailyPayments.forEach(p => {
      if (p.allocations && p.allocations.length > 0) {
        p.allocations.forEach(a => {
          const amt = parseFloat(a.amount || 0);
          if (a.allocation_type === 'card_fee') dailyAllocations.card_fee += amt;
          else if (a.allocation_type === 'consultation_fee') dailyAllocations.consultation_fee += amt;
          else if (a.allocation_type === 'procedure_request') dailyAllocations.procedure_fee += amt;
          else dailyAllocations.other += amt;
        });
      }
    });

    const dailyPatientsRegistered = await Patient.count({
      where: {
        registration_date: queryDateStr
      }
    });

    const dailyVisitsCount = await PatientVisit.count({
      where: {
        visit_date: { [Op.between]: [dayStart, dayEnd] }
      }
    });

    // 2. Weekly Report Calculation
    let weekStart, weekEnd;
    if (start_date && end_date) {
      weekStart = new Date(start_date);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd = new Date(end_date);
      weekEnd.setHours(23, 59, 59, 999);
    } else {
      const now = new Date(queryDateStr);
      const dayOfWeek = now.getDay();
      const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diffToMon);
      weekStart.setHours(0, 0, 0, 0);

      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    }

    const weeklyVisits = await PatientVisit.findAll({
      where: {
        visit_date: { [Op.between]: [weekStart, weekEnd] }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'card_number', 'full_name', 'registration_date']
        }
      ]
    });

    const weeklyPayments = await Payment.findAll({
      where: {
        status: PAYMENT_STATUS.APPROVED,
        approved_at: { [Op.between]: [weekStart, weekEnd] }
      }
    });

    const weeklyTotalRevenue = weeklyPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
    const weeklyTotalVisits = weeklyVisits.length;

    let newPatientVisits = 0;
    let returnPatientVisits = 0;
    weeklyVisits.forEach(v => {
      const regDate = v.patient?.registration_date;
      const vDateStr = new Date(v.visit_date).toISOString().slice(0, 10);
      if (regDate === vDateStr) {
        newPatientVisits += 1;
      } else {
        returnPatientVisits += 1;
      }
    });

    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyDayList = [];
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = daysMap[d.getDay()];

      const dayVisits = weeklyVisits.filter(v => new Date(v.visit_date).toISOString().slice(0, 10) === dateStr).length;
      const dayRev = weeklyPayments
        .filter(p => new Date(p.approved_at).toISOString().slice(0, 10) === dateStr)
        .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);

      weeklyDayList.push({
        date: dateStr,
        day: dayName,
        visits_count: dayVisits,
        revenue_etb: dayRev
      });
    }

    res.json({
      success: true,
      daily_report: {
        date: queryDateStr,
        total_revenue_etb: dailyRevenue,
        receipts_count: dailyReceiptsCount,
        patients_registered: dailyPatientsRegistered,
        visits_count: dailyVisitsCount,
        payment_methods: dailyByMethod,
        fee_allocations: dailyAllocations,
        transactions: dailyPayments.map(p => ({
          id: p.id,
          receipt_number: p.receipt_number,
          patient_name: p.patient?.full_name || 'Walk-in',
          card_number: p.patient?.card_number || 'N/A',
          amount: parseFloat(p.amount_paid || 0),
          payment_method: p.payment_method,
          approved_at: p.approved_at,
          approver: p.approver?.name || 'Staff'
        }))
      },
      weekly_report: {
        start_date: weekStart.toISOString().slice(0, 10),
        end_date: weekEnd.toISOString().slice(0, 10),
        total_revenue_etb: weeklyTotalRevenue,
        total_visits: weeklyTotalVisits,
        new_patient_visits: newPatientVisits,
        return_patient_visits: returnPatientVisits,
        daily_breakdown: weeklyDayList
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Laboratory Analytics: Tests processed, turnaround, workload, daily trends, and test category breakdowns
 */
const getLaboratoryAnalytics = async (req, res, next) => {
  try {
    const { start_date, end_date, period = 'week', technician_id } = req.query;

    const now = new Date();
    let start, end;

    if (start_date && end_date) {
      start = new Date(start_date);
      start.setHours(0, 0, 0, 0);
      end = new Date(end_date);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'today') {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      start = new Date(now);
      start.setDate(now.getDate() - 364);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: last 7 days (week)
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    }

    const whereClause = {
      created_at: { [Op.between]: [start, end] },
      category: 'laboratory'
    };

    if (technician_id) {
      whereClause.technician_id = parseInt(technician_id, 10);
    }

    const requests = await ProcedureRequest.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'card_number', 'full_name', 'age', 'sex']
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
          model: User,
          as: 'doctor',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'technician',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const totalRequests = requests.length;
    let completedCount = 0;
    let inProgressCount = 0;
    let readyToStartCount = 0;
    let awaitingPaymentCount = 0;
    let cancelledCount = 0;
    let urgentCount = 0;
    let routineCount = 0;
    let totalRevenue = 0;

    const testFrequency = {};
    const technicianWorkload = {};

    // Generate day-by-day map between start and end date
    const dailyMap = {};
    const dayCursor = new Date(start);
    while (dayCursor <= end) {
      const dateKey = dayCursor.toISOString().slice(0, 10);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dailyMap[dateKey] = {
        date: dateKey,
        day: dayNames[dayCursor.getDay()],
        total: 0,
        completed: 0,
        in_progress: 0,
        ready_to_start: 0,
        awaiting_payment: 0,
        revenue: 0
      };
      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    requests.forEach(r => {
      const isCompleted = [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.RESULTS_READY, REQUEST_STATUS.SENT_TO_DOCTOR].includes(r.status);
      const isInProgress = r.status === REQUEST_STATUS.IN_PROGRESS;
      const isReady = r.status === REQUEST_STATUS.PAYMENT_APPROVED;
      const isAwaiting = r.status === REQUEST_STATUS.AWAITING_PAYMENT;
      const isCancelled = r.status === REQUEST_STATUS.CANCELLED;

      if (isCompleted) completedCount += 1;
      else if (isInProgress) inProgressCount += 1;
      else if (isReady) readyToStartCount += 1;
      else if (isCancelled) cancelledCount += 1;
      else awaitingPaymentCount += 1;

      if (r.priority === 'urgent') urgentCount += 1;
      else routineCount += 1;

      const cost = parseFloat(r.total_cost || 0);
      if (r.status !== REQUEST_STATUS.AWAITING_PAYMENT && r.status !== REQUEST_STATUS.CANCELLED) {
        totalRevenue += cost;
      }

      // Daily distribution bucket
      const rawDate = r.createdAt || r.created_at || new Date();
      const dateObj = new Date(rawDate);
      const rDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      if (dailyMap[rDate]) {
        dailyMap[rDate].total += 1;
        if (isCompleted) dailyMap[rDate].completed += 1;
        else if (isInProgress) dailyMap[rDate].in_progress += 1;
        else if (isReady) dailyMap[rDate].ready_to_start += 1;
        else if (isAwaiting) dailyMap[rDate].awaiting_payment += 1;

        if (r.status !== REQUEST_STATUS.AWAITING_PAYMENT && r.status !== REQUEST_STATUS.CANCELLED) {
          dailyMap[rDate].revenue += cost;
        }
      }

      // Top tests frequency
      if (r.items && r.items.length > 0) {
        r.items.forEach(item => {
          const testName = item.service?.service_name || item.service?.name || item.custom_description || 'Laboratory Test';
          if (!testFrequency[testName]) {
            testFrequency[testName] = {
              test_name: testName,
              service_code: item.service?.service_code || 'LAB-TEST',
              request_count: 0,
              completed_count: 0,
              unit_price: parseFloat(item.item_price || item.service?.price || 0),
              revenue: 0
            };
          }
          testFrequency[testName].request_count += 1;
          if (isCompleted) {
            testFrequency[testName].completed_count += 1;
            testFrequency[testName].revenue += parseFloat(item.item_price || item.service?.price || 0);
          }
        });
      }

      // Technician workload
      const techName = r.technician?.name || r.results?.[0]?.technician?.name || 'Unassigned';
      if (!technicianWorkload[techName]) {
        technicianWorkload[techName] = {
          name: techName,
          total_assigned: 0,
          completed: 0,
          in_progress: 0
        };
      }
      technicianWorkload[techName].total_assigned += 1;
      if (isCompleted) technicianWorkload[techName].completed += 1;
      else if (isInProgress) technicianWorkload[techName].in_progress += 1;
    });

    const topTests = Object.values(testFrequency)
      .sort((a, b) => b.request_count - a.request_count)
      .slice(0, 10);

    const completionRate = totalRequests > 0
      ? Math.round((completedCount / totalRequests) * 100)
      : 0;

    // Detailed tabular records for export
    const detailedRecords = requests.map(r => {
      const itemNames = (r.items || []).map(i => i.service?.service_name || 'Laboratory Test').join(', ');
      return {
        id: r.id,
        request_number: `REQ-${r.id}`,
        patient_name: r.patient?.full_name || 'Unknown Patient',
        card_number: r.patient?.card_number || 'N/A',
        age: r.patient?.age || 'N/A',
        sex: r.patient?.sex || 'N/A',
        tests: itemNames || 'Laboratory Examination',
        priority: r.priority || 'routine',
        status: r.status,
        doctor_name: r.doctor?.name || 'Assigned Physician',
        technician_name: r.technician?.name || r.results?.[0]?.technician?.name || 'Unassigned',
        clinical_reason: r.clinical_reason || 'Routine lab test',
        total_cost: parseFloat(r.total_cost || 0),
        requested_at: r.createdAt || r.created_at || new Date(),
        completed_at: r.results?.[0]?.completed_at || (r.status === 'completed' ? (r.updatedAt || r.updated_at) : null)
      };
    });

    res.json({
      success: true,
      report: {
        range: {
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
          period
        },
        summary: {
          total_requests: totalRequests,
          completed: completedCount,
          in_progress: inProgressCount,
          ready_to_start: readyToStartCount,
          awaiting_payment: awaitingPaymentCount,
          cancelled: cancelledCount,
          urgent: urgentCount,
          routine: routineCount,
          completion_rate: completionRate,
          total_revenue: totalRevenue
        },
        daily_stats: Object.values(dailyMap),
        top_tests: topTests,
        technicians: Object.values(technicianWorkload),
        records: detailedRecords,
        recent_requests: detailedRecords.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Laboratory Home Snapshot: Real-time overview KPIs, daily activities, urgent queue, and 7-day trend
 */
const getLaboratorySummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    // Fetch all active laboratory requests
    const allLabRequests = await ProcedureRequest.findAll({
      where: { category: 'laboratory' },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'card_number', 'full_name', 'age', 'sex'] },
        { model: ProcedureRequestItem, as: 'items', include: [{ model: Service, as: 'service' }] },
        { model: LaboratoryResult, as: 'results', include: [{ model: User, as: 'technician', attributes: ['id', 'name'] }] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
        { model: User, as: 'technician', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    let todayOrders = 0;
    let todayCompleted = 0;
    let awaitingPayment = 0;
    let readyToTest = 0;
    let inProgress = 0;
    let overallCompleted = 0;
    let urgentActive = 0;

    const urgentList = [];
    const dailyTrendMap = {};

    const cursor = new Date(weekAgo);
    while (cursor <= todayEnd) {
      const dKey = cursor.toISOString().slice(0, 10);
      const dName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][cursor.getDay()];
      dailyTrendMap[dKey] = { date: dKey, day: dName, total: 0, completed: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }

    allLabRequests.forEach(r => {
      const isCompleted = [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.RESULTS_READY, REQUEST_STATUS.SENT_TO_DOCTOR].includes(r.status);
      const rawDate = r.createdAt || r.created_at || new Date();
      const dateObj = new Date(rawDate);
      const isToday = !isNaN(dateObj.getTime()) && dateObj >= todayStart;
      const rDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

      if (isToday) todayOrders += 1;

      if (isCompleted) {
        overallCompleted += 1;
        const resCompletedDate = r.results?.[0]?.completed_at ? new Date(r.results[0].completed_at) : null;
        if (resCompletedDate && !isNaN(resCompletedDate.getTime()) && resCompletedDate >= todayStart) {
          todayCompleted += 1;
        } else if (isToday) {
          todayCompleted += 1;
        }
      } else if (r.status === REQUEST_STATUS.IN_PROGRESS) {
        inProgress += 1;
      } else if (r.status === REQUEST_STATUS.PAYMENT_APPROVED) {
        readyToTest += 1;
      } else if (r.status === REQUEST_STATUS.AWAITING_PAYMENT) {
        awaitingPayment += 1;
      }

      if (r.priority === 'urgent' && !isCompleted && r.status !== REQUEST_STATUS.CANCELLED) {
        urgentActive += 1;
        urgentList.push(r);
      }

      if (dailyTrendMap[rDate]) {
        dailyTrendMap[rDate].total += 1;
        if (isCompleted) dailyTrendMap[rDate].completed += 1;
      }
    });

    const completionRate = allLabRequests.length > 0
      ? Math.round((overallCompleted / allLabRequests.length) * 100)
      : 0;

    // Latest completed results with findings
    const latestResults = await LaboratoryResult.findAll({
      limit: 8,
      order: [['completed_at', 'DESC']],
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'card_number', 'full_name', 'age', 'sex'] },
        { model: User, as: 'technician', attributes: ['id', 'name'] },
        {
          model: ProcedureRequest,
          as: 'request',
          include: [{ model: User, as: 'doctor', attributes: ['id', 'name'] }]
        }
      ]
    });

    res.json({
      success: true,
      summary: {
        today_orders: todayOrders,
        today_completed: todayCompleted,
        awaiting_payment: awaitingPayment,
        ready_to_test: readyToTest,
        in_progress: inProgress,
        overall_completed: overallCompleted,
        total_requests: allLabRequests.length,
        urgent_active: urgentActive,
        completion_rate: completionRate
      },
      weekly_trend: Object.values(dailyTrendMap),
      urgent_requests: urgentList.slice(0, 6).map(r => ({
        id: r.id,
        patient_name: r.patient?.full_name,
        card_number: r.patient?.card_number,
        tests: r.items?.map(i => i.service?.service_name).join(', ') || 'Laboratory Test',
        status: r.status,
        priority: r.priority,
        doctor_name: r.doctor?.name || 'Assigned Doctor',
        created_at: r.created_at
      })),
      recent_results: latestResults.map(res => ({
        id: res.id,
        test_name: res.test_name,
        status: res.status,
        findings: res.findings,
        observations: res.observations,
        completed_at: res.completed_at,
        technician_name: res.technician?.name || 'Lab Technologist',
        doctor_name: res.request?.doctor?.name || 'Attending Doctor',
        patient: res.patient,
        results_data: res.results_data,
        request: res.request
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs,
  getDoctorWeeklyReport,
  getReceptionAnalytics,
  getLaboratoryAnalytics,
  getLaboratorySummary
};
