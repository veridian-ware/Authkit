const { sequelize } = require('./models');
const logger = require('./config/logger');
const app = require('./index');

const PORT = process.env.BACKEND_PORT || 4000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    logger.info(`AuthKit Express running on port ${PORT}`);
  });
}).catch(err => {
  logger.error('Database connection error', { error: err.message });
  process.exit(1);
});
