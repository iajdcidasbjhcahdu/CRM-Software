import projectService from "./project.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { getUserProjectIds } from "../../utils/projectPermission.js";

class ProjectController {
  createProject = catchAsync(async (req, res) => {
    const project = await projectService.createProject(req.body, req.user.id);
    return created(res, "Project created successfully", project);
  });

  listProjects = catchAsync(async (req, res) => {
    const query = { ...req.query };

    // CLIENT users can only see their own company's projects
    if (req.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { clientId: true },
      });
      if (!user?.clientId) {
        return ok(res, "Projects retrieved", {
          projects: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }
      query.clientId = user.clientId;
    }

    // EMPLOYEE users can only see projects they're assigned to via team membership
    if (req.user.role === "EMPLOYEE") {
      const pIds = await getUserProjectIds(req.user.id);
      if (pIds.length === 0) {
        return ok(res, "Projects retrieved", {
          projects: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }
      query.projectIds = pIds;
    }

    const result = await projectService.listProjects(query);
    return ok(res, "Projects retrieved", result);
  });

  getProjectById = catchAsync(async (req, res) => {
    const project = await projectService.getProjectById(req.params.id);

    // CLIENT users can only view their own company's projects
    if (req.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { clientId: true },
      });
      if (!user?.clientId || project.clientId !== user.clientId) {
        throw ApiError.forbidden("You do not have access to this project");
      }
    }

    // EMPLOYEE users can only view projects they're assigned to via team
    if (req.user.role === "EMPLOYEE") {
      const pIds = await getUserProjectIds(req.user.id);
      if (!pIds.includes(req.params.id)) {
        throw ApiError.forbidden("You do not have access to this project");
      }
    }

    return ok(res, "Project retrieved", project);
  });

  updateProject = catchAsync(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body);
    return ok(res, "Project updated successfully", project);
  });

  deleteProject = catchAsync(async (req, res) => {
    await projectService.deleteProject(req.params.id);
    return ok(res, "Project deleted successfully");
  });
}

export default new ProjectController();
