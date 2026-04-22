"use server";

import { cookies } from "next/headers";
import { getCalendarEventsAPI } from "@/lib/api";

export async function getCalendarEventsAction(start, end) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) throw new Error("Unauthorized");

    const data = await getCalendarEventsAPI(token, start, end);
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}
