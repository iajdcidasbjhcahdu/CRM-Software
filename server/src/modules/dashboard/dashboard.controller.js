import { getDashboardStats, getClientDashboardStats } from "./dashboard.service.js";
import { ok } from "../../utils/apiResponse.js";
import prisma from "../../utils/prisma.js";

/**
 * GET /api/dashboard/stats?period=month|year|today|all
 * Returns aggregated dashboard statistics for the selected period.
 */
export async function getStats(req, res, next) {
  try {
    const period = req.query.period || "month";
    const allowed = ["all", "year", "today", "month"];
    const safePeriod = allowed.includes(period) ? period : "month";

    const stats = await getDashboardStats(safePeriod);
    return ok(res, "Dashboard statistics fetched successfully", stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dashboard/client-stats
 * Returns dashboard statistics scoped to the CLIENT user's company.
 */
export async function getClientStats(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { clientId: true },
    });

    if (!user?.clientId) {
      return ok(res, "Client stats fetched", {
        projects: { total: 0, active: 0 },
        tasks: { total: 0, completed: 0, inReview: 0 },
        upcomingMilestones: [],
        recentDocuments: [],
        upcomingMeetings: [],
        projectsList: [],
      });
    }

    const stats = await getClientDashboardStats(user.clientId);
    return ok(res, "Client dashboard statistics fetched", stats);
  } catch (error) {
    next(error);
  }
}
