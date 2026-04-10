const { User } = require('../models');
const logger = require('../config/logger');

const seedDatabase = async () => {
  try {
    const users = [
      {
        username: 'admin',
        first_name: 'Admin',
        last_name: 'Demo',
        email: 'admin@authkit.dev',
        password: 'demo1234',
        role: 'admin',
        area: 'General',
      },
      {
        username: 'supervisor',
        first_name: 'Supervisor',
        last_name: 'Demo',
        email: 'supervisor@authkit.dev',
        password: 'demo1234',
        role: 'supervisor',
        area: 'General',
      },
      {
        username: 'operario',
        first_name: 'Operator',
        last_name: 'Demo',
        email: 'operator@authkit.dev',
        password: 'demo1234',
        role: 'operario',
        area: 'General',
      },
      {
        username: 'contador',
        first_name: 'Accountant',
        last_name: 'Demo',
        email: 'accountant@authkit.dev',
        password: 'demo1234',
        role: 'contador',
        area: 'General',
      },
    ];

    for (const userData of users) {
      const existing = await User.findOne({ where: { email: userData.email } });
      if (!existing) {
        // Password is hashed automatically by Sequelize beforeCreate hook
        await User.create(userData);
        logger.info(`Seeder: created user ${userData.email}`);
      } else {
        logger.info(`Seeder: user already exists ${userData.email}`);
      }
    }

    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Seeding error', { error: error.message });
  }
};

module.exports = seedDatabase;
