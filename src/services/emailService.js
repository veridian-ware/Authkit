const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async (to, subject, text, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('Email service not configured (SMTP_USER/SMTP_PASS missing). Skipping send.', { to, subject });
    return;
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  logger.info('Email sent', { messageId: info.messageId, to, subject });
  return info;
};

module.exports = { sendMail };
