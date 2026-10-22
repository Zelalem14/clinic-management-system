const { ClinicSetting } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

const getSettings = async (req, res, next) => {
  try {
    let setting = await ClinicSetting.findOne();
    if (!setting) {
      setting = await ClinicSetting.create({
        clinic_name: 'St. Jude Community Clinic',
        address: '124 Healthcare Boulevard, City Center',
        phone: '+1 (555) 019-2834',
        email: 'info@stjudeclinic.org',
        currency_symbol: '$',
        receipt_footer: 'Thank you for choosing St. Jude Clinic. Wishing you swift recovery!'
      });
    }

    res.json({
      success: true,
      settings: setting
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    let setting = await ClinicSetting.findOne();
    if (!setting) {
      setting = await ClinicSetting.create({});
    }

    const { clinic_name, address, phone, email, currency_symbol, receipt_footer } = req.body;

    if (clinic_name !== undefined) setting.clinic_name = clinic_name;
    if (address !== undefined) setting.address = address;
    if (phone !== undefined) setting.phone = phone;
    if (email !== undefined) setting.email = email;
    if (currency_symbol !== undefined) setting.currency_symbol = currency_symbol;
    if (receipt_footer !== undefined) setting.receipt_footer = receipt_footer;

    await setting.save();

    await logAudit({
      userId: req.user.id,
      action: 'SETTINGS_UPDATED',
      entity: 'ClinicSetting',
      entityId: setting.id,
      details: req.body,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Clinic information updated successfully',
      settings: setting
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
