import { Router } from "express";
import clientController from "./client.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createClientSchema,
  updateClientSchema,
  listClientsSchema,
  getClientSchema,
} from "./client.validation.js";

const router = Router();

router.use(authenticate);

const clientAccess = authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER", "SALES_MANAGER");

router.post("/", authorize("OWNER", "ADMIN"), validate(createClientSchema), clientController.createClient);
router.get("/", clientAccess, validate(listClientsSchema), clientController.listClients);
router.get("/:id", clientAccess, validate(getClientSchema), clientController.getClientById);
router.patch("/:id", authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER"), validate(updateClientSchema), clientController.updateClient);
router.delete("/:id", authorize("OWNER"), validate(getClientSchema), clientController.deleteClient);

export default router;
