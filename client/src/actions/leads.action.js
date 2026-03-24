"use server";

import { cookies } from "next/headers";
import {
  getLeadsAPI,
  getLeadAPI,
  createLeadAPI,
  updateLeadAPI,
  updateLeadStatusAPI,
  deleteLeadAPI,
  getUsersAPI,
} from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

// ─── List Leads ──────────────────────────────────────────

export async function getLeads(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getLeadsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch leads" };
  }
}

// ─── Get Single Lead ─────────────────────────────────────

export async function getLead(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getLeadAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch lead" };
  }
}

// ─── Create Lead ─────────────────────────────────────────

export async function createLead(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createLeadAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create lead" };
  }
}

// ─── Update Lead ─────────────────────────────────────────

export async function updateLead(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateLeadAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update lead" };
  }
}

// ─── Update Lead Status ──────────────────────────────────

export async function updateLeadStatus(id, status, lostReason) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const body = { status };
    if (lostReason) body.lostReason = lostReason;
    const res = await updateLeadStatusAPI(id, body, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update lead status" };
  }
}

// ─── Delete Lead ─────────────────────────────────────────

export async function deleteLead(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteLeadAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete lead" };
  }
}

// ─── Get Assignable Users (for dropdown) ─────────────────

export async function getAssignableUsers() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getUsersAPI({ limit: 100, role: "SALES_MANAGER" }, token);
    // We also need OWNER and ADMIN, so let's get all and filter
    const allRes = await getUsersAPI({ limit: 100 }, token);
    if (allRes.success) {
      return allRes.data.users
        .filter((u) => ["OWNER", "ADMIN", "SALES_MANAGER"].includes(u.role))
        .map((u) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          email: u.email,
        }));
    }
    return [];
  } catch {
    return [];
  }
}
