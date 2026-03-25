import nodemailer from "nodemailer";
import prisma from "./prisma.js";

/**
 * Mailer Utility — reads SMTP config from the database Settings table
 * and creates a fresh nodemailer transporter each time.
 * Fully modular: all email sending goes through sendMail().
 */

let _cachedTransporter = null;
let _cachedConfigHash = null;

/**
 * Build a hash string from SMTP config to detect changes.
 */
function configHash(cfg) {
  return `${cfg.smtpHost}:${cfg.smtpPort}:${cfg.smtpEmail}:${cfg.smtpIsSecure}`;
}

/**
 * Get or create a nodemailer transporter using SMTP settings from DB.
 * Caches the transporter until config changes.
 */
async function getTransporter() {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  if (!settings?.smtpHost || !settings?.smtpPort || !settings?.smtpEmail || !settings?.smtpPassword) {
    throw new Error("SMTP is not configured. Please configure SMTP settings first.");
  }

  const hash = configHash(settings);

  // Reuse cached transporter if config hasn't changed
  if (_cachedTransporter && _cachedConfigHash === hash) {
    return { transporter: _cachedTransporter, fromEmail: settings.smtpEmail };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpIsSecure, // true for 465, false for 587
    auth: {
      user: settings.smtpEmail,
      pass: settings.smtpPassword,
    },
    // Connection pool for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  _cachedTransporter = transporter;
  _cachedConfigHash = hash;

  return { transporter, fromEmail: settings.smtpEmail };
}

/**
 * Send an email using the configured SMTP transport.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient email
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML body
 * @param {string} [options.text]   - Plain text fallback
 * @param {string} [options.from]   - Override sender (default: SMTP email)
 */
export async function sendMail({ to, subject, html, text, from }) {
  const { transporter, fromEmail } = await getTransporter();

  const site = await prisma.site.findUnique({ where: { id: "default" } });
  const siteName = site?.name || "TaskGo Agency";

  const info = await transporter.sendMail({
    from: from || `"${siteName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text fallback
  });

  return info;
}

/**
 * Verify SMTP connection is working.
 * Returns true if successful, throws on failure.
 */
export async function verifySmtp() {
  const { transporter } = await getTransporter();
  await transporter.verify();
  return true;
}

/**
 * Clear the cached transporter (call after SMTP settings change).
 */
export function clearTransporterCache() {
  _cachedTransporter = null;
  _cachedConfigHash = null;
}
