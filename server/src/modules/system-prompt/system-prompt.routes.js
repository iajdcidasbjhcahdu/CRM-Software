import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import controller from "./system-prompt.controller.js";
import {
  createPromptSchema,
  updatePromptSchema,
  promptIdSchema,
} from "./system-prompt.validation.js";

const router = Router();

router.use(authenticate, authorize("OWNER", "ADMIN"));

router.get("/", controller.listPrompts);
router.get("/:id", validate(promptIdSchema), controller.getPrompt);
router.post("/", validate(createPromptSchema), controller.createPrompt);
router.patch("/:id", validate(updatePromptSchema), controller.updatePrompt);
router.delete("/:id", validate(promptIdSchema), controller.deletePrompt);

export default router;
