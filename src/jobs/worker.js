const { automationQueue } = require('./queue');
const emailService = require('../services/emailService');

automationQueue.process('send-email', async (job) => {
  const { to, subject, text } = job.data;
  console.log(`[Worker] Procesando tarea send-email para: ${to}`);
  try {
    const html = `<p>${text}</p>`;
    await emailService.sendMail(to, subject, text, html);
    return { success: true };
  } catch (err) {
    console.error(`[Worker] Error enviando email a ${to}:`, err);
    throw err;
  }
});

automationQueue.process('whatsapp-alert', async (job) => {
  const { phone, message } = job.data;
  console.log(`[Worker] Simulando envío WhatsApp a ${phone}: ${message}`);
  // Placeholder para integración WhatsApp Business API futura
  return { success: true };
});

console.log('[Worker] Worker de automatizaciones inicializado y escuchando tareas.');
