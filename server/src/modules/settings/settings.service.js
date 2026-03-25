import prisma from "../../utils/prisma.js";
import { clearTransporterCache } from "../../utils/mailer.js";

class SettingsService {
  /**
   * Get settings (auto-creates default record if none exists)
   * Masks the SMTP password for security.
   */
  async getSettings() {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "default" } });
    }

    const { createdAt, updatedAt, ...data } = settings;

    // Mask SMTP password — only show if configured or not
    return {
      ...data,
      smtpPassword: data.smtpPassword ? "••••••••" : null,
      isSmtpConfigured: !!(
        data.smtpHost &&
        data.smtpPort &&
        data.smtpEmail &&
        data.smtpPassword
      ),
    };
  }

  /**
   * Update settings (OWNER only)
   * If smtpPassword is the masked string, skip updating it.
   */
  async updateSettings(data) {
    // Don't overwrite password with the mask
    if (data.smtpPassword === "••••••••") {
      delete data.smtpPassword;
    }

    // Track if SMTP fields are being changed
    const smtpFieldsChanged = !!(
      data.smtpHost !== undefined ||
      data.smtpPort !== undefined ||
      data.smtpEmail !== undefined ||
      data.smtpPassword !== undefined ||
      data.smtpIsSecure !== undefined
    );

    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "default", ...data },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: "default" },
        data,
      });
    }

    // Clear cached nodemailer transporter if SMTP config changed
    if (smtpFieldsChanged) {
      clearTransporterCache();
    }

    const { createdAt, updatedAt, ...result } = settings;

    return {
      ...result,
      smtpPassword: result.smtpPassword ? "••••••••" : null,
      isSmtpConfigured: !!(
        result.smtpHost &&
        result.smtpPort &&
        result.smtpEmail &&
        result.smtpPassword
      ),
    };
  }
}

export default new SettingsService();
