const { ClinicSetting } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

const getSettings = async (req, res, next) => {
  try {
    let setting = await ClinicSetting.findOne();
    if (!setting) {
      setting = await ClinicSetting.create({
        clinic_name: 'Tena Specialty Clinic',
        address: 'Bole Sub-City, Africa Avenue, Addis Ababa, Ethiopia',
        phone: '+251 11 661 2345',
        email: 'info@tenaclinic.et',
        currency_symbol: 'ETB',
        receipt_footer: 'እናመሰግናለን! Thank you for visiting Tena Specialty Clinic. Wishing you swift recovery!'
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
