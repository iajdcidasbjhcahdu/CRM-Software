import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import notificationService from "../notification/notification.service.js";
import { toDateOnly } from "../attendance/attendance.service.js";

const REQUEST_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true } },
  leaveType: { select: { id: true, name: true, code: true, isPaid: true, color: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true } },
};

const BALANCE_INCLUDE = {
  leaveType: { select: { id: true, name: true, code: true, isPaid: true, color: true, defaultQuota: true } },
  user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true } },
};

const DEFAULT_LEAVE_TYPES = [
  { name: "Paid Leave", code: "PAID", isPaid: true, defaultQuota: 12, color: "#10B981" },
  { name: "Sick Leave", code: "SICK", isPaid: true, defaultQuota: 8, color: "#F59E0B" },
  { name: "Casual Leave", code: "CASUAL", isPaid: true, defaultQuota: 6, color: "#3B82F6" },
  { name: "Unpaid Leave", code: "UNPAID", isPaid: false, defaultQuota: null, color: "#EF4444" },
];

/**
 * Count days between two dates inclusive (calendar days).
 */
function countDays(fromDate, toDate) {
  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDate);
  const diff = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  return Math.floor(diff) + 1;
}

/**
 * Compute total leave days consumed based on range + half-day flags on from/to.
 * FIRST_HALF or SECOND_HALF on the boundary subtracts 0.5.
 */
function computeTotalDays(fromDate, toDate, fromDayType, toDayType) {
  let days = countDays(fromDate, toDate);
  if (days <= 0) return 0;

  if (days === 1) {
    // Single-day leave: if either endpoint is half-day, it's 0.5; full = 1
    if (fromDayType !== "FULL_DAY" || toDayType !== "FULL_DAY") return 0.5;
    return 1;
  }

  if (fromDayType === "FIRST_HALF" || fromDayType === "SECOND_HALF") days -= 0.5;
  if (toDayType === "FIRST_HALF" || toDayType === "SECOND_HALF") days -= 0.5;

  return days;
}

/**
 * Iterate over dates from `from` to `to` inclusive (UTC date parts).
 */
function* dateRange(fromDate, toDate) {
  const from = toDateOnly(fromDate);
  const to = toDateOnly(toDate);
  const cursor = new Date(from.getTime());
  while (cursor.getTime() <= to.getTime()) {
    yield new Date(cursor.getTime());
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

/**
 * Map a leave day-type on a specific date (first or last) to the Attendance status
 * that should be saved for that day.
 *
 * FULL_DAY leave → Attendance.ON_LEAVE
 * FIRST_HALF leave (morning off) → Attendance.HALF_DAY_SECOND (worked second half)
 * SECOND_HALF leave (afternoon off) → Attendance.HALF_DAY_FIRST (worked first half)
 */
function dayTypeToAttendanceStatus(dayType) {
  if (dayType === "FIRST_HALF") return "HALF_DAY_SECOND";
  if (dayType === "SECOND_HALF") return "HALF_DAY_FIRST";
  return "ON_LEAVE";
}

class LeaveService {
  // ═══════ Leave Types ═══════

  async seedDefaultTypesIfEmpty() {
    const count = await prisma.leaveType.count();
    if (count > 0) return;
    await prisma.leaveType.createMany({
      data: DEFAULT_LEAVE_TYPES,
      skipDuplicates: true,
    });
  }

  async listLeaveTypes() {
    await this.seedDefaultTypesIfEmpty();
    return prisma.leaveType.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  }

  async createLeaveType(data) {
    // Uniqueness check
    const existing = await prisma.leaveType.findFirst({
      where: { OR: [{ name: data.name }, { code: data.code }] },
    });
    if (existing) throw ApiError.conflict("A leave type with that name or code already exists");

    return prisma.leaveType.create({ data });
  }

  async updateLeaveType(id, data) {
    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Leave type not found");
    return prisma.leaveType.update({ where: { id }, data });
  }

  async deleteLeaveType(id) {
    const inUse = await prisma.leaveRequest.count({ where: { leaveTypeId: id } });
    if (inUse > 0) {
      // Soft-delete instead: mark inactive
      return prisma.leaveType.update({ where: { id }, data: { isActive: false } });
    }
    await prisma.leaveType.delete({ where: { id } });
    return null;
  }

  // ═══════ Leave Balances ═══════

  async getMyBalances(userId, year) {
    const targetYear = year || new Date().getFullYear();

    // Ensure a balance row exists for every active leave type for this user+year
    await this.ensureUserBalancesForYear(userId, targetYear);

    return prisma.leaveBalance.findMany({
      where: { userId, year: targetYear },
      include: { leaveType: { select: { id: true, name: true, code: true, isPaid: true, color: true, defaultQuota: true } } },
      orderBy: { leaveType: { name: "asc" } },
    });
  }

  async getUserBalances(userId, year) {
    return this.getMyBalances(userId, year);
  }

  /**
   * Create balance rows for a user/year from active leave types' defaultQuota.
   * Idempotent — skips existing (userId, leaveTypeId, year) rows.
   */
  async ensureUserBalancesForYear(userId, year) {
    await this.seedDefaultTypesIfEmpty();

    const types = await prisma.leaveType.findMany({ where: { isActive: true } });
    const existing = await prisma.leaveBalance.findMany({
      where: { userId, year, leaveTypeId: { in: types.map((t) => t.id) } },
      select: { leaveTypeId: true },
    });
    const existingTypeIds = new Set(existing.map((b) => b.leaveTypeId));

    const toCreate = types
      .filter((t) => !existingTypeIds.has(t.id))
      .map((t) => ({
        userId,
        leaveTypeId: t.id,
        year,
        allocated: t.defaultQuota ?? 0,
        used: 0,
      }));

    if (toCreate.length) {
      await prisma.leaveBalance.createMany({ data: toCreate, skipDuplicates: true });
    }
  }

  /**
   * Seed balances for EVERY active non-CLIENT user for the given year.
   * Used by HR to bootstrap a new year.
   */
  async seedAllBalancesForYear(year) {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "CLIENT" } },
      select: { id: true },
    });
    for (const u of users) {
      await this.ensureUserBalancesForYear(u.id, year);
    }
    return { seededForUsers: users.length, year };
  }

  async updateBalance(id, data) {
    const existing = await prisma.leaveBalance.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Leave balance not found");
    return prisma.leaveBalance.update({
      where: { id },
      data,
      include: BALANCE_INCLUDE,
    });
  }

  // ═══════ Leave Requests ═══════

  async createRequest(data, userId) {
    const leaveType = await prisma.leaveType.findUnique({ where: { id: data.leaveTypeId } });
    if (!leaveType || !leaveType.isActive) {
      throw ApiError.badRequest("Leave type not found or inactive");
    }

    const fromDate = toDateOnly(data.fromDate);
    const toDate = toDateOnly(data.toDate);
    if (!fromDate || !toDate) throw ApiError.badRequest("Invalid date(s)");
    if (toDate.getTime() < fromDate.getTime()) {
      throw ApiError.badRequest("toDate must be on or after fromDate");
    }

    const totalDays = computeTotalDays(fromDate, toDate, data.fromDayType, data.toDayType);
    if (totalDays <= 0) throw ApiError.badRequest("Invalid leave duration");

    // Balance check (skip if leaveType has unlimited quota)
    if (leaveType.defaultQuota !== null) {
      const year = fromDate.getUTCFullYear();
      await this.ensureUserBalancesForYear(userId, year);
      const balance = await prisma.leaveBalance.findUnique({
        where: { userId_leaveTypeId_year: { userId, leaveTypeId: leaveType.id, year } },
      });
      if (balance && balance.allocated - balance.used < totalDays) {
        throw ApiError.badRequest(
          `Insufficient ${leaveType.name} balance. Available: ${balance.allocated - balance.used}, requested: ${totalDays}`
        );
      }
    }

    // Check for overlap with other PENDING/APPROVED requests
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        fromDate: { lte: toDate },
        toDate: { gte: fromDate },
      },
    });
    if (overlap) {
      throw ApiError.badRequest("You already have a pending or approved leave request overlapping these dates");
    }

    const request = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId: leaveType.id,
        fromDate,
        toDate,
        fromDayType: data.fromDayType || "FULL_DAY",
        toDayType: data.toDayType || "FULL_DAY",
        totalDays,
        reason: data.reason,
      },
      include: REQUEST_INCLUDE,
    });

    // Notify approvers (OWNER, ADMIN, HR) — fire-and-forget
    this.notifyApprovers(request).catch((err) =>
      console.error("[LeaveService] notify approvers failed:", err.message)
    );

    return request;
  }

  async getMyRequests(userId) {
    return prisma.leaveRequest.findMany({
      where: { userId },
      include: REQUEST_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async listRequests({ status, userId, year }) {
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year, 11, 31));
      where.fromDate = { gte: start, lte: end };
    }
    return prisma.leaveRequest.findMany({
      where,
      include: REQUEST_INCLUDE,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  async getRequestById(id, requestingUserId, requesterRole) {
    const req = await prisma.leaveRequest.findUnique({
      where: { id },
      include: REQUEST_INCLUDE,
    });
    if (!req) throw ApiError.notFound("Leave request not found");

    // Non-admins can only see their own
    if (!["OWNER", "ADMIN", "HR"].includes(requesterRole) && req.userId !== requestingUserId) {
      throw ApiError.forbidden("You do not have access to this leave request");
    }
    return req;
  }

  async approveRequest(id, reviewerId, reviewNotes) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });
    if (!request) throw ApiError.notFound("Leave request not found");
    if (request.status !== "PENDING") {
      throw ApiError.badRequest(`Cannot approve a ${request.status.toLowerCase()} request`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark request approved
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null,
        },
        include: REQUEST_INCLUDE,
      });

      // 2. Bump the balance (if leaveType has quota)
      if (request.leaveType.defaultQuota !== null) {
        const year = request.fromDate.getUTCFullYear();
        await tx.leaveBalance.upsert({
          where: { userId_leaveTypeId_year: { userId: request.userId, leaveTypeId: request.leaveTypeId, year } },
          update: { used: { increment: request.totalDays } },
          create: {
            userId: request.userId,
            leaveTypeId: request.leaveTypeId,
            year,
            allocated: request.leaveType.defaultQuota ?? 0,
            used: request.totalDays,
          },
        });
      }

      // 3. Create attendance rows for each day
      const fromTime = request.fromDate.getTime();
      const toTime = request.toDate.getTime();
      for (const day of dateRange(request.fromDate, request.toDate)) {
        const isFirst = day.getTime() === fromTime;
        const isLast = day.getTime() === toTime;
        const status = isFirst
          ? dayTypeToAttendanceStatus(request.fromDayType)
          : isLast
            ? dayTypeToAttendanceStatus(request.toDayType)
            : "ON_LEAVE";

        await tx.attendance.upsert({
          where: { userId_date: { userId: request.userId, date: day } },
          update: {
            status,
            leaveRequestId: request.id,
            markedById: reviewerId,
          },
          create: {
            userId: request.userId,
            date: day,
            status,
            leaveRequestId: request.id,
            markedById: reviewerId,
          },
        });
      }

      return updated;
    }).then((updated) => {
      // Notify requestor — fire-and-forget
      notificationService
        .send({
          userId: request.userId,
          title: "Leave request approved",
          description: `Your ${request.leaveType.name} request (${request.totalDays} day${request.totalDays !== 1 ? "s" : ""}) has been approved.`,
          type: "SUCCESS",
          channel: "IN_APP",
        })
        .catch((err) => console.error("[LeaveService] notify requestor failed:", err.message));
      return updated;
    });
  }

  async rejectRequest(id, reviewerId, reviewNotes) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });
    if (!request) throw ApiError.notFound("Leave request not found");
    if (request.status !== "PENDING") {
      throw ApiError.badRequest(`Cannot reject a ${request.status.toLowerCase()} request`);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
      include: REQUEST_INCLUDE,
    });

    notificationService
      .send({
        userId: request.userId,
        title: "Leave request rejected",
        description: `Your ${request.leaveType.name} request has been rejected.${reviewNotes ? " Reason: " + reviewNotes : ""}`,
        type: "WARNING",
        channel: "IN_APP",
      })
      .catch((err) => console.error("[LeaveService] notify requestor failed:", err.message));

    return updated;
  }

  async cancelRequest(id, cancellerId, cancellerRole) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });
    if (!request) throw ApiError.notFound("Leave request not found");

    const isOwner = request.userId === cancellerId;
    const isAdmin = ["OWNER", "ADMIN", "HR"].includes(cancellerRole);
    if (!isOwner && !isAdmin) throw ApiError.forbidden("You cannot cancel this leave request");

    if (request.status === "CANCELLED") return request;
    if (request.status === "REJECTED") {
      throw ApiError.badRequest("Cannot cancel a rejected request");
    }

    return prisma.$transaction(async (tx) => {
      // If was APPROVED, reverse the balance + delete attendance rows tied to it
      if (request.status === "APPROVED") {
        if (request.leaveType.defaultQuota !== null) {
          const year = request.fromDate.getUTCFullYear();
          await tx.leaveBalance.update({
            where: { userId_leaveTypeId_year: { userId: request.userId, leaveTypeId: request.leaveTypeId, year } },
            data: { used: { decrement: request.totalDays } },
          });
        }
        await tx.attendance.deleteMany({ where: { leaveRequestId: request.id } });
      }

      return tx.leaveRequest.update({
        where: { id },
        data: {
          status: "CANCELLED",
          reviewedById: cancellerId,
          reviewedAt: new Date(),
        },
        include: REQUEST_INCLUDE,
      });
    });
  }

  // ── helpers ──
  async notifyApprovers(request) {
    const approvers = await prisma.user.findMany({
      where: { role: { in: ["OWNER", "ADMIN", "HR"] }, status: "ACTIVE" },
      select: { id: true },
    });
    const recipientIds = approvers.map((a) => a.id).filter((id) => id !== request.userId);
    if (!recipientIds.length) return;

    await notificationService.sendBulk({
      userIds: recipientIds,
      title: "New leave request",
      description: `${request.user.firstName} ${request.user.lastName} requested ${request.totalDays} day${request.totalDays !== 1 ? "s" : ""} of ${request.leaveType.name}.`,
      type: "INFO",
      channel: "IN_APP",
    });
  }
}

export default new LeaveService();
