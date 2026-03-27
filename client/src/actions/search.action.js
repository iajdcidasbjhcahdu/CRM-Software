"use server";

import { cookies } from "next/headers";
import { globalSearchAPI } from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

export async function globalSearch(query) {
  const token = await getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await globalSearchAPI({ q: query, limit: 5 }, token);
    if (res.success) {
      return { success: true, data: res.data };
    }
    return { success: false, data: null };
  } catch {
    return { success: false, data: null };
  }
}
