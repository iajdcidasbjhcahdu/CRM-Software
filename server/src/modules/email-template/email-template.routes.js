import { Router } from "express";
import emailTemplateController from "./email-template.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  updateEmailTemplateSchema,
  getEmailTemplateSchema,
} from "./email-template.validation.js";

const router = Router();

// All routes require OWNER role
router.use(authenticate);
router.use(authorize("OWNER"));

router.get("/", emailTemplateController.listTemplates);
router.get("/:id", validate(getEmailTemplateSchema), emailTemplateController.getTemplate);
router.patch("/:id", validate(getEmailTemplateSchema.merge(updateEmailTemplateSchema)), emailTemplateController.updateTemplate);

export default router;
