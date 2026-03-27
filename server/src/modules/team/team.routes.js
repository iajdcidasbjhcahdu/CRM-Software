import { Router } from "express";
import teamController from "./team.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createTeamSchema,
  listTeamsSchema,
  getTeamSchema,
  updateTeamSchema,
  addMemberSchema,
  removeMemberSchema,
  updateMemberPermissionsSchema,
} from "./team.validation.js";

const router = Router();

router.use(authenticate);

const teamAccess = authorize(
  "OWNER",
  "ADMIN",
  "SALES_MANAGER",
  "ACCOUNT_MANAGER",
  "HR"
);

// Dropdown (must be before /:id to avoid conflict)
router.get("/dropdown", teamAccess, teamController.getTeamsDropdown);

// CRUD
router.post(
  "/",
  authorize("OWNER", "ADMIN", "HR"),
  validate(createTeamSchema),
  teamController.createTeam
);

router.get("/", teamAccess, validate(listTeamsSchema), teamController.listTeams);

router.get(
  "/:id",
  teamAccess,
  validate(getTeamSchema),
  teamController.getTeamById
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "HR"),
  validate(updateTeamSchema),
  teamController.updateTeam
);

router.delete(
  "/:id",
  authorize("OWNER"),
  validate(getTeamSchema),
  teamController.deleteTeam
);

// Members
router.post(
  "/:id/members",
  authorize("OWNER", "ADMIN", "HR"),
  validate(addMemberSchema),
  teamController.addMember
);

router.delete(
  "/:id/members/:userId",
  authorize("OWNER", "ADMIN", "HR"),
  validate(removeMemberSchema),
  teamController.removeMember
);

router.patch(
  "/:id/members/:userId",
  authorize("OWNER", "ADMIN", "HR"),
  validate(updateMemberPermissionsSchema),
  teamController.updateMemberPermissions
);

export default router;
