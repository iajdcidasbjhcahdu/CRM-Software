import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const PROJECT_INCLUDE = {
  client: {
    select: { id: true, companyName: true, contactName: true, email: true, status: true },
  },
  deal: {
    select: { id: true, title: true, value: true },
  },
  accountManager: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
};

class ProjectService {
  /**
   * Create project manually under a client
   */
  async createProject(data, createdById) {
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) throw ApiError.notFound("Client not found");

    if (client.status !== "ACTIVE") {
      throw ApiError.badRequest("Cannot create project for an inactive client");
    }

    if (data.accountManagerId) {
      const am = await prisma.user.findUnique({ where: { id: data.accountManagerId } });
      if (!am) throw ApiError.badRequest("Account manager not found");
      if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
        throw ApiError.badRequest("Must be Owner, Admin, or Account Manager role");
      }
    }

    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      throw ApiError.badRequest("Start date cannot be after end date");
    }

    return prisma.project.create({
      data: { ...data, createdById },
      include: PROJECT_INCLUDE,
    });
  }

  /**
   * List projects with pagination, filters, search
   */
  async listProjects({ page, limit, status, clientId, accountManagerId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (accountManagerId) where.accountManagerId = accountManagerId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { client: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single project
   */
  async getProjectById(id) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });

    if (!project) throw ApiError.notFound("Project not found");
    return project;
  }

  /**
   * Update project
   */
  async updateProject(id, data) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw ApiError.notFound("Project not found");

    if (["COMPLETED", "CANCELLED"].includes(project.status) && data.status === undefined) {
      throw ApiError.badRequest("Cannot edit a completed or cancelled project without changing status");
    }

    if (data.accountManagerId) {
      const am = await prisma.user.findUnique({ where: { id: data.accountManagerId } });
      if (!am) throw ApiError.badRequest("Account manager not found");
      if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
        throw ApiError.badRequest("Must be Owner, Admin, or Account Manager role");
      }
    }

    const startDate = data.startDate ? new Date(data.startDate) : project.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : project.endDate;
    if (startDate && endDate && startDate > endDate) {
      throw ApiError.badRequest("Start date cannot be after end date");
    }

    return prisma.project.update({
      where: { id },
      data,
      include: PROJECT_INCLUDE,
    });
  }

  /**
   * Delete project (only NOT_STARTED or CANCELLED)
   */
  async deleteProject(id) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw ApiError.notFound("Project not found");

    if (!["NOT_STARTED", "CANCELLED"].includes(project.status)) {
      throw ApiError.badRequest("Only projects with status NOT_STARTED or CANCELLED can be deleted");
    }

    await prisma.project.delete({ where: { id } });
  }
}

export default new ProjectService();
