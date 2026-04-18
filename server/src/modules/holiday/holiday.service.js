import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { toDateOnly } from "../attendance/attendance.service.js";

class HolidayService {
  async list(year) {
    const where = {};
    if (year) {
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year, 11, 31));
      where.date = { gte: start, lte: end };
    }
    return prisma.holiday.findMany({ where, orderBy: { date: "asc" } });
  }

  async create(data) {
    const date = toDateOnly(data.date);
    const existing = await prisma.holiday.findUnique({ where: { date } });
    if (existing) throw ApiError.conflict("A holiday already exists for that date");
    return prisma.holiday.create({
      data: {
        name: data.name,
        date,
        isOptional: data.isOptional || false,
        notes: data.notes || null,
      },
    });
  }

  async update(id, data) {
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Holiday not found");

    const updateData = { ...data };
    if (data.date) updateData.date = toDateOnly(data.date);
    return prisma.holiday.update({ where: { id }, data: updateData });
  }

  async delete(id) {
    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Holiday not found");
    await prisma.holiday.delete({ where: { id } });
  }
}

export default new HolidayService();
