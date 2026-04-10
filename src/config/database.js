const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      define: { timestamps: true, underscored: true },
    })
  : new Sequelize(
      process.env.POSTGRES_DB || 'authkit_db',
      process.env.POSTGRES_USER || '',
      process.env.POSTGRES_PASSWORD || '',
      {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        dialect: 'postgres',
        logging: false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        define: { timestamps: true, underscored: true },
      }
    );

module.exports = sequelize;