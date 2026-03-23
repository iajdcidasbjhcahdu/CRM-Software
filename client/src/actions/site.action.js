"use server";

import { getSiteAPI } from "@/lib/api";

/**
 * Fetches site data (name, logo, contact info, etc.) from the backend.
 * Uses Next.js fetch caching — safe to call from multiple server components
 * in the same request without duplicate API calls.
 */
export async function getSiteData() {
  try {
    const res = await getSiteAPI();
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}
