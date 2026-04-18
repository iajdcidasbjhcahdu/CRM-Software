import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const ATTENDANCE_INCLUDE = {
  user: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
  },
  markedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  leaveRequest: {
    select: {
      id: true,
      leaveType: { select: { id: true, name: true, code: true, color: true } },
      fromDate: true,
      toDate: true,
    },
  },
};

/**
 * Convert a date string (YYYY-MM-DD) or Date → Date at UTC midnight.
 * Used for @db.Date columns so comparisons are on the calendar day.
 */
function toDateOnly(input) {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : new Date(input.getTime());
  // Use the date parts in local time, then convert to UTC midnight
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function todayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function computeWorkedMinutes(checkInAt, checkOutAt) {
  if (!checkInAt || !checkOutAt) return null;
  const diffMs = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60000);
}

class AttendanceService {
  async checkIn(userId, notes) {
    const date = todayDateOnly();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    const now = new Date();

    if (existing) {
      if (existing.checkInAt) {
        throw ApiError.badRequest("You have already checked in today");
      }
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInAt: now,
          status: existing.status === "ABSENT" ? "PRESENT" : existing.status,
          notes: notes ?? existing.notes,
        },
        include: ATTENDANCE_INCLUDE,
      });
    }

    return prisma.attendance.create({
      data: {
        userId,
        date,
        status: "PRESENT",
        checkInAt: now,
        notes: notes || null,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async checkOut(userId, notes) {
    const date = todayDateOnly();
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!existing || !existing.checkInAt) {
      throw ApiError.badRequest("You haven't checked in yet today");
    }
    if (existing.checkOutAt) {
      throw ApiError.badRequest("You have already checked out today");
    }

    const now = new Date();
    const workedMinutes = computeWorkedMinutes(existing.checkInAt, now);

    // Auto-adjust to half-day if <4 hours worked and status was PRESENT
    let status = existing.status;
    if (status === "PRESENT" && workedMinutes !== null && workedMinutes < 240) {
      status = "HALF_DAY_FIRST";
    }

    return prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutAt: now,
        workedMinutes,
        status,
        notes: notes ?? existing.notes,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async getTodayForUser(userId) {
    const date = todayDateOnly();
    return prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async getMyAttendance(userId, { year, month, from, to }) {
    const where = { userId };
    if (from && to) {
      where.date = { gte: toDateOnly(from), lte: toDateOnly(to) };
    } else if (year && month) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0));
      where.date = { gte: start, lte: end };
    } else if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year, 11, 31));
      where.date = { gte: start, lte: end };
    }

    return prisma.attendance.findMany({
      where,
      include: ATTENDANCE_INCLUDE,
      orderBy: { date: "desc" },
    });
  }

  /**
   * Daily attendance sheet: every active non-CLIENT user, joined with their
   * attendance record for the given date (if any).
   */
  async getDailySheet(dateStr) {
    const date = toDateOnly(dateStr);

    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "CLIENT" } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });

    const records = await prisma.attendance.findMany({
      where: { date, userId: { in: users.map((u) => u.id) } },
      include: ATTENDANCE_INCLUDE,
    });
    const recordByUserId = new Map(records.map((r) => [r.userId, r]));

    return users.map((u) => ({
      user: u,
      attendance: recordByUserId.get(u.id) || null,
    }));
  }

  async getUserAttendance(userId, { year, month, from, to }) {
    return this.getMyAttendance(userId, { year, month, from, to });
  }

  /**
   * HR manually marks/updates a user's attendance for a date (upsert by user+date).
   */
  async manualMark(data, markerUserId) {
    const date = toDateOnly(data.date);
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: data.userId, date } },
    });

    const checkInAt = data.checkInAt ? new Date(data.checkInAt) : undefined;
    const checkOutAt = data.checkOutAt ? new Date(data.checkOutAt) : undefined;
    const workedMinutes = checkInAt && checkOutAt ? computeWorkedMinutes(checkInAt, checkOutAt) : undefined;

    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          checkInAt: data.checkInAt === null ? null : checkInAt,
          checkOutAt: data.checkOutAt === null ? null : checkOutAt,
          workedMinutes: workedMinutes ?? null,
          notes: data.notes ?? existing.notes,
          markedById: markerUserId,
        },
        include: ATTENDANCE_INCLUDE,
      });
    }

    return prisma.attendance.create({
      data: {
        userId: data.userId,
        date,
        status: data.status,
        checkInAt: checkInAt || null,
        checkOutAt: checkOutAt || null,
        workedMinutes: workedMinutes ?? null,
        notes: data.notes || null,
        markedById: markerUserId,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async updateAttendance(id, data, markerUserId) {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Attendance record not found");

    const checkInAt = data.checkInAt !== undefined
      ? (data.checkInAt ? new Date(data.checkInAt) : null)
      : existing.checkInAt;
    const checkOutAt = data.checkOutAt !== undefined
      ? (data.checkOutAt ? new Date(data.checkOutAt) : null)
      : existing.checkOutAt;
    const workedMinutes = checkInAt && checkOutAt ? computeWorkedMinutes(checkInAt, checkOutAt) : null;

    return prisma.attendance.update({
      where: { id },
      data: {
        status: data.status ?? existing.status,
        checkInAt,
        checkOutAt,
        workedMinutes,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        markedById: markerUserId,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async deleteAttendance(id) {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Attendance record not found");
    await prisma.attendance.delete({ where: { id } });
  }
}

export default new AttendanceService();
export { toDateOnly, todayDateOnly };
