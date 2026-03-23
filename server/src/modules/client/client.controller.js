import clientService from "./client.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class ClientController {
  createClient = catchAsync(async (req, res) => {
    const client = await clientService.createClient(req.body);
    return created(res, "Client created successfully", client);
  });

  listClients = catchAsync(async (req, res) => {
    const result = await clientService.listClients(req.query);
    return ok(res, "Clients retrieved", result);
  });

  getClientById = catchAsync(async (req, res) => {
    const client = await clientService.getClientById(req.params.id);
    return ok(res, "Client retrieved", client);
  });

  updateClient = catchAsync(async (req, res) => {
    const client = await clientService.updateClient(req.params.id, req.body);
    return ok(res, "Client updated successfully", client);
  });

  deleteClient = catchAsync(async (req, res) => {
    await clientService.deleteClient(req.params.id);
    return ok(res, "Client deleted successfully");
  });
}

export default new ClientController();
