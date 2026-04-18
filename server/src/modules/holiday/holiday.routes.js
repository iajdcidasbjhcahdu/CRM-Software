import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import holidayController from "./holiday.controller.js";
import {
  listHolidaysSchema,
  createHolidaySchema,
  updateHolidaySchema,
  holidayIdSchema,
} from "./holiday.validation.js";

const router = Router();

router.use(authenticate);

const admin = authorize("OWNER", "ADMIN", "HR");

// Read: any authenticated internal role (also clients technically, but keep simple)
router.get("/", validate(listHolidaysSchema), holidayController.list);

router.post("/", admin, validate(createHolidaySchema), holidayController.create);
router.patch("/:id", admin, validate(updateHolidaySchema), holidayController.update);
router.delete("/:id", admin, validate(holidayIdSchema), holidayController.delete);

export default router;
