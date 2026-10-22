const { Op } = require('sequelize');
const { Service } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

const listServices = async (req, res, next) => {
  try {
    const { category, active_only, search } = req.query;
    const whereClause = {};

    if (category) {
      whereClause.category = category;
    }

    if (active_only === 'true' || active_only === true) {
      whereClause.is_active = true;
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { service_name: { [Op.like]: searchTerm } },
        { service_code: { [Op.like]: searchTerm } },
        { description: { [Op.like]: searchTerm } }
      ];
    }

    const services = await Service.findAll({
      where: whereClause,
      order: [
        ['category', 'ASC'],
        ['service_name', 'ASC']
      ]
    });

    res.json({
      success: true,
      total: services.length,
      services
    });
  } catch (error) {
    next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      service
    });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { service_code, service_name, category, description, price, is_active = true } = req.body;

    if (!service_code || !service_name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Service code, name, category, and price are required.'
      });
    }

    const existing = await Service.findOne({ where: { service_code: service_code.trim().toUpperCase() } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Service with code '${service_code}' already exists.`
      });
    }

    const service = await Service.create({
      service_code: service_code.trim().toUpperCase(),
      service_name: service_name.trim(),
      category,
      description: description || null,
      price: parseFloat(price),
      is_active: Boolean(is_active)
    });

    await logAudit({
      userId: req.user.id,
      action: 'SERVICE_CREATED',
      entity: 'Service',
      entityId: service.id,
      details: { code: service.service_code, name: service.service_name, price: service.price },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { service_name, category, description, price, is_active } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const oldPrice = service.price;

    if (service_name !== undefined) service.service_name = service_name.trim();
    if (category !== undefined) service.category = category;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = parseFloat(price);
    if (is_active !== undefined) service.is_active = Boolean(is_active);

    await service.save();

    await logAudit({
      userId: req.user.id,
      action: 'SERVICE_UPDATED',
      entity: 'Service',
      entityId: service.id,
      details: {
        code: service.service_code,
        old_price: oldPrice,
        new_price: service.price,
        is_active: service.is_active
      },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Soft delete via is_active = false
    service.is_active = false;
    await service.save();

    await logAudit({
      userId: req.user.id,
      action: 'SERVICE_DEACTIVATED',
      entity: 'Service',
      entityId: service.id,
      details: { code: service.service_code },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Service deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
