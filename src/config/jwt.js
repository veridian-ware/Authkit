module.exports = {
  secret: process.env.JWT_SECRET || 'dev_jwt_secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret',
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
};
