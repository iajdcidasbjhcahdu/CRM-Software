import teamService from "./team.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class TeamController {
  /**
   * POST /api/teams
   * Create a new team
   */
  createTeam = catchAsync(async (req, res) => {
    const team = await teamService.createTeam(req.body);
    return created(res, "Team created successfully", team);
  });

  /**
   * GET /api/teams
   * List teams with pagination and filters
   */
  listTeams = catchAsync(async (req, res) => {
    const result = await teamService.listTeams(req.query);
    return ok(res, "Teams retrieved", result);
  });

  /**
   * GET /api/teams/:id
   * Get team by ID
   */
  getTeamById = catchAsync(async (req, res) => {
    const team = await teamService.getTeamById(req.params.id);
    return ok(res, "Team retrieved", team);
  });

  /**
   * PATCH /api/teams/:id
   * Update team
   */
  updateTeam = catchAsync(async (req, res) => {
    const team = await teamService.updateTeam(req.params.id, req.body);
    return ok(res, "Team updated successfully", team);
  });

  /**
   * DELETE /api/teams/:id
   * Delete team
   */
  deleteTeam = catchAsync(async (req, res) => {
    await teamService.deleteTeam(req.params.id);
    return ok(res, "Team deleted successfully");
  });

  /**
   * POST /api/teams/:id/members
   * Add member to team
   */
  addMember = catchAsync(async (req, res) => {
    const { userId, permissions } = req.body;
    const member = await teamService.addMember(
      req.params.id,
      userId,
      permissions
    );
    return created(res, "Member added to team", member);
  });

  /**
   * DELETE /api/teams/:id/members/:userId
   * Remove member from team
   */
  removeMember = catchAsync(async (req, res) => {
    await teamService.removeMember(req.params.id, req.params.userId);
    return ok(res, "Member removed from team");
  });

  /**
   * PATCH /api/teams/:id/members/:userId
   * Update member permissions
   */
  updateMemberPermissions = catchAsync(async (req, res) => {
    const member = await teamService.updateMemberPermissions(
      req.params.id,
      req.params.userId,
      req.body.permissions
    );
    return ok(res, "Member permissions updated", member);
  });

  /**
   * GET /api/teams/dropdown
   * Get teams dropdown list
   */
  getTeamsDropdown = catchAsync(async (req, res) => {
    const teams = await teamService.getTeamsDropdown();
    return ok(res, "Teams dropdown retrieved", teams);
  });
}

export default new TeamController();
