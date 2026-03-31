"use server";

import { cookies } from "next/headers";
import { aiGenerateAPI, aiSearchAPI } from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

/**
 * Generate AI content using a system prompt.
 * @param {string} systemPromptSlug — e.g. "proposal-generator"
 * @param {string} userPrompt — the user's input
 * @param {Object} [context] — additional context data
 * @param {boolean} [structured] — whether to request structured JSON output
 */
export async function aiGenerate(systemPromptSlug, userPrompt, context = {}, structured = true) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await aiGenerateAPI({ systemPromptSlug, userPrompt, context, structured }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * AI-powered CRM search — ask a question, get an intelligent answer.
 */
export async function aiSearch(question) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await aiSearchAPI(question, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
