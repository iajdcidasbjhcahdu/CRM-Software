"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getSiteAPI,
  updateSiteAPI,
  getSettingsAPI,
  updateSettingsAPI,
  getEmailTemplatesAPI,
  getEmailTemplateAPI,
  updateEmailTemplateAPI,
} from "@/lib/api";

// ─── Site Settings ──────────────────────────────────────────

/**
 * Fetch site settings (includes currency, exchange rates, etc.)
 */
export async function getSiteSettings() {
  try {
    const res = await getSiteAPI();
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Update site settings — Server Action (can mutate cookies if needed).
 * Returns { success, data?, error? }
 */
export async function updateSiteSettings(data) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const res = await updateSiteAPI(data, accessToken);
    if (res.success) {
      // Invalidate cached site data across all pages (layout, landing, dashboards)
      revalidatePath("/", "layout");
      return { success: true, data: res.data };
    }
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update site settings" };
  }
}

// ─── System Settings (SMTP) ─────────────────────────────────

/**
 * Fetch system settings (SMTP config, etc.)
 */
export async function getSystemSettings() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  try {
    const res = await getSettingsAPI(accessToken);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Update system settings — Server Action.
 * Returns { success, data?, error? }
 */
export async function updateSystemSettings(data) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const res = await updateSettingsAPI(data, accessToken);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update settings" };
  }
}

// ─── Email Templates ──────────────────────────────────────

/**
 * Fetch all email templates.
 */
export async function getEmailTemplates() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return [];

  try {
    const res = await getEmailTemplatesAPI(accessToken);
    if (res.success) return res.data;
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single email template by ID.
 */
export async function getEmailTemplate(id) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  try {
    const res = await getEmailTemplateAPI(id, accessToken);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Update an email template.
 */
export async function updateEmailTemplate(id, data) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const res = await updateEmailTemplateAPI(id, data, accessToken);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update template" };
  }
}
