const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanySettings = sequelize.define('CompanySettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  company_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: 'Mi Empresa',
  },
  logo_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  primary_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#3B82F6',
  },
  secondary_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#1E40AF',
  },
  accent_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#10B981',
  },
  dark_mode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sectors: {
    type: DataTypes.JSONB,
    defaultValue: ['Mantenimiento', 'Producción', 'Administración', 'Logística'],
    comment: 'List of company sectors/areas',
  },
}, {
  tableName: 'company_settings',
});

module.exports = CompanySettings;
