import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import serviceService from "./service.service.js";

const createService = catchAsync(async (req, res) => {
  const service = await serviceService.createService(req.body);
  return created(res, "Service created successfully", service);
});

const listServices = catchAsync(async (req, res) => {
  const result = await serviceService.listServices(req.query);
  return ok(res, "Services retrieved", result);
});

const getService = catchAsync(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.id);
  return ok(res, "Service retrieved", service);
});

const updateService = catchAsync(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  return ok(res, "Service updated successfully", service);
});

const deleteService = catchAsync(async (req, res) => {
  await serviceService.deleteService(req.params.id);
  return ok(res, "Service deleted successfully");
});

const getActiveServices = catchAsync(async (req, res) => {
  const services = await serviceService.getActiveServices();
  return ok(res, "Active services retrieved", services);
});

export default { createService, listServices, getService, updateService, deleteService, getActiveServices };
