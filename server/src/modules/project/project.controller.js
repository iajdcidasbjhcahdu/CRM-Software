import projectService from "./project.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class ProjectController {
  createProject = catchAsync(async (req, res) => {
    const project = await projectService.createProject(req.body, req.user.id);
    return created(res, "Project created successfully", project);
  });

  listProjects = catchAsync(async (req, res) => {
    const result = await projectService.listProjects(req.query);
    return ok(res, "Projects retrieved", result);
  });

  getProjectById = catchAsync(async (req, res) => {
    const project = await projectService.getProjectById(req.params.id);
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
