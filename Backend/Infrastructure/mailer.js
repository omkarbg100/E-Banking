const nodemailer = require("nodemailer");
const env = require("../Config/env");
const logger = require("./logger");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (env.EMAIL_SERVICE) {
    transporter = nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth:
        env.SMTP_USER || env.SMTP_PASS
          ? { user: env.SMTP_USER || process.env.EMAIL_USER, pass: env.SMTP_PASS || process.env.EMAIL_PASS }
          : undefined
    });
    return transporter;
  }

  if (!env.SMTP_HOST) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });

  return transporter;
}

async function sendMailDirect({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) {
    logger.warn({ to, subject }, "email not sent: SMTP is not configured");
    return { skipped: true };
  }
  const info = await mailer.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
  logger.info({ to, subject, messageId: info.messageId }, "email sent");
  return info;
}

module.exports = { sendMailDirect, getTransporter };
