const fs = require('fs');
const path = require('path');
const {
  sequelize,
  User,
  Service,
  ClinicSetting,
  Patient,
  PatientVisit,
  Payment,
  PaymentAllocation,
  Consultation,
  Diagnosis,
  ProcedureRequest,
  ProcedureRequestItem,
  LaboratoryResult,
  Prescription,
  PrescriptionItem,
  Appointment,
  LabTestTemplate,
  AuditLog
} = require('../models');

const getBackupDir = () => {
  const backupDir = path.resolve(__dirname, '../../../database/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

/**
 * Creates a complete database backup:
 * 1. If SQLite: Copies the .sqlite file with timestamp.
 * 2. Dialect-independent JSON export of all core tables for portable recovery.
 */
const createBackup = async () => {
  const backupDir = getBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const result = {
    timestamp,
    files: []
  };

  // 0. Ensure SQLite WAL checkpoint is flushed into main database file
  if (sequelize.checkpointDatabase) {
    try {
      await sequelize.checkpointDatabase();
    } catch (ckptErr) {
      console.warn('Pre-backup checkpoint note:', ckptErr.message);
    }
  }

  // 1. SQLite binary backup if applicable
  if (sequelize.getDialect() === 'sqlite' && sequelize.options.storage) {
    const sourcePath = sequelize.options.storage;
    if (fs.existsSync(sourcePath)) {
      const sqliteBackupFile = path.join(backupDir, `clinic-backup-${timestamp}.sqlite`);
      fs.copyFileSync(sourcePath, sqliteBackupFile);
      result.files.push({
        type: 'sqlite',
        path: sqliteBackupFile,
        size: fs.statSync(sqliteBackupFile).size
      });
    }
  }

  // 2. Dialect-independent full JSON dump (works on SQLite, MySQL, and PostgreSQL)
  try {
    const dumpData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      dialect: sequelize.getDialect(),
      tables: {
        users: await User.findAll({ raw: true }).catch(() => []),
        services: await Service.findAll({ raw: true }).catch(() => []),
        patients: await Patient.findAll({ raw: true }).catch(() => []),
        visits: await PatientVisit.findAll({ raw: true }).catch(() => []),
        payments: await Payment.findAll({ raw: true }).catch(() => []),
        payment_allocations: await PaymentAllocation.findAll({ raw: true }).catch(() => []),
        consultations: await Consultation.findAll({ raw: true }).catch(() => []),
        diagnoses: await Diagnosis.findAll({ raw: true }).catch(() => []),
        procedure_requests: await ProcedureRequest.findAll({ raw: true }).catch(() => []),
        procedure_items: await ProcedureRequestItem.findAll({ raw: true }).catch(() => []),
        laboratory_results: await LaboratoryResult.findAll({ raw: true }).catch(() => []),
        prescriptions: await Prescription.findAll({ raw: true }).catch(() => []),
        prescription_items: await PrescriptionItem.findAll({ raw: true }).catch(() => []),
        appointments: await Appointment.findAll({ raw: true }).catch(() => []),
        lab_templates: await LabTestTemplate.findAll({ raw: true }).catch(() => []),
        clinic_settings: await ClinicSetting.findAll({ raw: true }).catch(() => [])
      }
    };

    const jsonBackupFile = path.join(backupDir, `clinic-dump-${timestamp}.json`);
    const jsonLatestFile = path.join(backupDir, 'clinic-dump-latest.json');

    const jsonStr = JSON.stringify(dumpData, null, 2);
    fs.writeFileSync(jsonBackupFile, jsonStr, 'utf8');
    fs.writeFileSync(jsonLatestFile, jsonStr, 'utf8');

    result.files.push({
      type: 'json',
      path: jsonBackupFile,
      size: fs.statSync(jsonBackupFile).size,
      patient_count: dumpData.tables.patients.length,
      visit_count: dumpData.tables.visits.length,
      user_count: dumpData.tables.users.length
    });

    // Clean up older backups keeping latest 15
    cleanOldBackups(backupDir, 15);
  } catch (err) {
    console.error('Failed to generate JSON dump:', err.message);
  }

  return result;
};

/**
 * Removes older backup files keeping the specified count
 */
const cleanOldBackups = (dir, keepCount = 15) => {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('clinic-backup-') || f.startsWith('clinic-dump-20'))
      .map(f => ({ name: f, path: path.join(dir, f), time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      files.slice(keepCount).forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
    }
  } catch (e) {}
};

/**
 * Lists available database backups
 */
const listBackups = () => {
  const backupDir = getBackupDir();
  try {
    return fs.readdirSync(backupDir).map(file => {
      const fullPath = path.join(backupDir, file);
      const stat = fs.statSync(fullPath);
      return {
        filename: file,
        size_bytes: stat.size,
        size_kb: Math.round(stat.size / 1024),
        created_at: stat.mtime
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (err) {
    return [];
  }
};

/**
 * Idempotently restores or synchronizes records from clinic-dump-latest.json
 * into the active database. Preserves all existing records and safely inserts any missing ones.
 */
const restoreFromLatestDump = async (customDumpPath = null) => {
  const dumpFile = customDumpPath || path.join(getBackupDir(), 'clinic-dump-latest.json');
  if (!fs.existsSync(dumpFile)) {
    return { success: false, message: 'No portable JSON dump found to restore.' };
  }

  try {
    const rawData = fs.readFileSync(dumpFile, 'utf8');
    const dump = JSON.parse(rawData);
    const tables = dump.tables || {};

    let restoredPatients = 0;
    let restoredUsers = 0;
    let restoredServices = 0;

    // 1. Users
    if (Array.isArray(tables.users)) {
      for (const u of tables.users) {
        const [user, created] = await User.findOrCreate({
          where: { email: u.email.toLowerCase().trim() },
          defaults: u
        });
        if (created) restoredUsers++;
      }
    }

    // 2. Services
    if (Array.isArray(tables.services)) {
      for (const s of tables.services) {
        const [srv, created] = await Service.findOrCreate({
          where: { service_code: s.service_code },
          defaults: s
        });
        if (created) restoredServices++;
      }
    }

    // 3. Patients (with safe non-destructive synchronization)
    if (Array.isArray(tables.patients)) {
      for (const p of tables.patients) {
        const [pat, created] = await Patient.findOrCreate({
          where: { card_number: p.card_number },
          defaults: p
        });
        if (created) {
          restoredPatients++;
        } else {
          // Only fill in fields that are currently empty or null in the live database
          let updated = false;
          ['allergies', 'medical_history', 'current_medications', 'notes', 'phone', 'address', 'emergency_contact'].forEach(f => {
            if ((pat[f] === null || pat[f] === undefined || pat[f] === '') && p[f]) {
              pat[f] = p[f];
              updated = true;
            }
          });
          if (updated) await pat.save();
        }
      }
    }

    // 4. Patient Visits
    if (Array.isArray(tables.visits)) {
      for (const v of tables.visits) {
        await PatientVisit.findOrCreate({
          where: { id: v.id },
          defaults: v
        });
      }
    }

    // 5. Payments
    if (Array.isArray(tables.payments)) {
      for (const pay of tables.payments) {
        await Payment.findOrCreate({
          where: { receipt_number: pay.receipt_number },
          defaults: pay
        });
      }
    }

    // 6. Consultations
    if (Array.isArray(tables.consultations)) {
      for (const c of tables.consultations) {
        await Consultation.findOrCreate({
          where: { id: c.id },
          defaults: c
        });
      }
    }

    // 7. Diagnoses
    if (Array.isArray(tables.diagnoses)) {
      for (const d of tables.diagnoses) {
        await Diagnosis.findOrCreate({
          where: { id: d.id },
          defaults: d
        });
      }
    }

    // 8. Procedure Requests
    if (Array.isArray(tables.procedure_requests)) {
      for (const pr of tables.procedure_requests) {
        await ProcedureRequest.findOrCreate({
          where: { id: pr.id },
          defaults: pr
        });
      }
    }

    // 9. Laboratory Results
    if (Array.isArray(tables.laboratory_results)) {
      for (const lr of tables.laboratory_results) {
        await LaboratoryResult.findOrCreate({
          where: { id: lr.id },
          defaults: lr
        });
      }
    }

    // 10. Prescriptions
    if (Array.isArray(tables.prescriptions)) {
      for (const rx of tables.prescriptions) {
        await Prescription.findOrCreate({
          where: { id: rx.id },
          defaults: rx
        });
      }
    }

    // 11. Appointments
    if (Array.isArray(tables.appointments)) {
      for (const appt of tables.appointments) {
        await Appointment.findOrCreate({
          where: { id: appt.id },
          defaults: appt
        });
      }
    }

    // 12. Clinic Settings
    if (Array.isArray(tables.clinic_settings) && tables.clinic_settings.length > 0) {
      const existingSettings = await ClinicSetting.findOne();
      if (!existingSettings) {
        await ClinicSetting.create(tables.clinic_settings[0]);
      }
    }

    if (sequelize.checkpointDatabase) {
      await sequelize.checkpointDatabase();
    }

    console.log(`Portable dump synchronization: verified ${tables.patients?.length || 0} patients (restored: ${restoredPatients}), ${tables.users?.length || 0} users (restored: ${restoredUsers}).`);

    return {
      success: true,
      restoredPatients,
      restoredUsers,
      totalDumpPatients: tables.patients?.length || 0
    };
  } catch (err) {
    console.error('Failed to restore from latest dump:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  createBackup,
  restoreFromLatestDump,
  listBackups,
  getBackupDir
};
