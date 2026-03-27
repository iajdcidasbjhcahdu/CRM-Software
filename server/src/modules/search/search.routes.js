import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import searchController from "./search.controller.js";

const router = Router();

router.get("/", authenticate, authorize("OWNER", "ADMIN"), searchController.globalSearch);

export default router;
