import { Router } from "express";
import meetingController from "./meeting.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createMeetingSchema,
  updateMeetingSchema,
  listMeetingsSchema,
  getMeetingSchema,
  deleteMeetingSchema,
  completePostProductionSchema,
} from "./meeting.validation.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", validate(listMeetingsSchema), meetingController.list);
router.get("/lead/:leadId", meetingController.getByLead);
router.get("/deal/:dealId", meetingController.getByDeal);
router.get("/project/:projectId", meetingController.getByProject);
router.get("/:id", validate(getMeetingSchema), meetingController.getById);

router.post(
  "/",
  authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"),
  validate(createMeetingSchema),
  meetingController.create
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"),
  validate(updateMeetingSchema),
  meetingController.update
);

router.delete(
  "/:id",
  authorize("OWNER", "ADMIN"),
  validate(deleteMeetingSchema),
  meetingController.delete
);

// Complete a POST_PRODUCTION meeting with structured per-task feedback
router.post(
  "/:id/complete-post-production",
  authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER"),
  validate(completePostProductionSchema),
  meetingController.completePostProduction
);

export default router;
