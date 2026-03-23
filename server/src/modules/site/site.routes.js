import { Router } from "express";
import siteController from "./site.controller.js";

const router = Router();

// Public route — no auth required
router.get("/", siteController.getSiteInfo);

export default router;
