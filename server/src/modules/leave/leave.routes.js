import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import leaveController from "./leave.controller.js";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  leaveTypeIdSchema,
  myBalancesSchema,
  userBalancesSchema,
  updateBalanceSchema,
  seedBalancesSchema,
  createRequestSchema,
  listRequestsSchema,
  requestIdSchema,
  reviewRequestSchema,
} from "./leave.validation.js";

const router = Router();

router.use(authenticate);

const blockClient = (req, res, next) => {
  if (req.user.role === "CLIENT") {
    return res.status(403).json({ success: false, message: "Not available for client users" });
  }
  next();
};

const admin = authorize("OWNER", "ADMIN", "HR");

// ═══════ Leave Types ═══════
router.get("/types", blockClient, leaveController.listTypes);
router.post("/types", admin, validate(createLeaveTypeSchema), leaveController.createType);
router.patch("/types/:id", admin, validate(updateLeaveTypeSchema), leaveController.updateType);
router.delete("/types/:id", admin, validate(leaveTypeIdSchema), leaveController.deleteType);

// ═══════ Balances ═══════
router.get("/balances/my", blockClient, validate(myBalancesSchema), leaveController.getMyBalances);
router.get("/balances/user/:userId", admin, validate(userBalancesSchema), leaveController.getUserBalances);
router.patch("/balances/:id", admin, validate(updateBalanceSchema), leaveController.updateBalance);
router.post("/balances/seed", admin, validate(seedBalancesSchema), leaveController.seedBalances);

// ═══════ Requests ═══════
router.post("/requests", blockClient, validate(createRequestSchema), leaveController.createRequest);
router.get("/requests/my", blockClient, leaveController.getMyRequests);
router.get("/requests", admin, validate(listRequestsSchema), leaveController.listRequests);
router.get("/requests/:id", blockClient, validate(requestIdSchema), leaveController.getRequestById);
router.patch("/requests/:id/approve", admin, validate(reviewRequestSchema), leaveController.approveRequest);
router.patch("/requests/:id/reject", admin, validate(reviewRequestSchema), leaveController.rejectRequest);
router.patch("/requests/:id/cancel", blockClient, validate(requestIdSchema), leaveController.cancelRequest);

export default router;
