import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { getStats, getClientStats, getEmployeeStats } from "./dashboard.controller.js";

const router = Router();

// Only OWNER and ADMIN can view dashboard stats
router.get("/stats", authenticate, authorize("OWNER", "ADMIN"), getStats);

// CLIENT portal dashboard stats
router.get("/client-stats", authenticate, authorize("CLIENT"), getClientStats);

// EMPLOYEE portal dashboard stats
router.get("/employee-stats", authenticate, authorize("EMPLOYEE"), getEmployeeStats);

export default router;
