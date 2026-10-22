const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { ROLES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');

const listUsers = async (req, res, next) => {
  try {
    const { role, is_active } = req.query;
    const whereClause = {};

    if (role) whereClause.role = role;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true' || is_active === true;

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'phone', 'is_active', 'created_at', 'updated_at'],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      total: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, is_active = true } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.'
      });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles are: ${Object.values(ROLES).join(', ')}`
      });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone || null,
      is_active: Boolean(is_active)
    });

    await logAudit({
      userId: req.user.id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        is_active: user.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, is_active, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role && Object.values(ROLES).includes(role)) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (is_active !== undefined) user.is_active = Boolean(is_active);

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    await logAudit({
      userId: req.user.id,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: user.id,
      details: { role: user.role, is_active: user.is_active },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        is_active: user.is_active
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser
};
