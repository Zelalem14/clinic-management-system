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

module.exports = {
  createBackup,
  listBackups,
  getBackupDir
};
