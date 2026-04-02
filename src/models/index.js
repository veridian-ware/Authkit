const sequelize = require('../config/database');
const User = require('./User');
const AuditLog = require('./AuditLog');
const CompanySettings = require('./CompanySettings');

// Associations
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  AuditLog,
  CompanySettings,
};