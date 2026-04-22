import express from "express";
import calendarController from "./calendar.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";

const router = express.Router();

router.use(authenticate);

// Only allow Owners (or standard roles) to view global calendar for now
// You can adjust authorize(['OWNER', 'ADMIN']) based on exact needs
router.get("/events", authorize("OWNER", "ADMIN"), calendarController.getEvents);

export default router;
