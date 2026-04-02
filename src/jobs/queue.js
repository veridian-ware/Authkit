const Queue = require('bull');

const automationQueue = new Queue('automatizaciones', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
});

module.exports = {
  automationQueue,
};
