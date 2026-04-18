import leaveService from "./leave.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class LeaveController {
  // ── Leave Types ──
  listTypes = catchAsync(async (_req, res) => {
    const types = await leaveService.listLeaveTypes();
    return ok(res, "Leave types", types);
  });

  createType = catchAsync(async (req, res) => {
    const type = await leaveService.createLeaveType(req.body);
    return created(res, "Leave type created", type);
  });

  updateType = catchAsync(async (req, res) => {
    const type = await leaveService.updateLeaveType(req.params.id, req.body);
    return ok(res, "Leave type updated", type);
  });

  deleteType = catchAsync(async (req, res) => {
    const result = await leaveService.deleteLeaveType(req.params.id);
    return ok(res, result ? "Leave type deactivated (was in use)" : "Leave type deleted");
  });

  // ── Balances ──
  getMyBalances = catchAsync(async (req, res) => {
    const balances = await leaveService.getMyBalances(req.user.id, req.query.year ? Number(req.query.year) : undefined);
    return ok(res, "My leave balances", balances);
  });

  getUserBalances = catchAsync(async (req, res) => {
    const balances = await leaveService.getUserBalances(req.params.userId, req.query.year ? Number(req.query.year) : undefined);
    return ok(res, "User leave balances", balances);
  });

  updateBalance = catchAsync(async (req, res) => {
    const balance = await leaveService.updateBalance(req.params.id, req.body);
    return ok(res, "Leave balance updated", balance);
  });

  seedBalances = catchAsync(async (req, res) => {
    const result = await leaveService.seedAllBalancesForYear(Number(req.query.year));
    return ok(res, "Leave balances seeded", result);
  });

  // ── Requests ──
  createRequest = catchAsync(async (req, res) => {
    const request = await leaveService.createRequest(req.body, req.user.id);
    return created(res, "Leave request submitted", request);
  });

  getMyRequests = catchAsync(async (req, res) => {
    const requests = await leaveService.getMyRequests(req.user.id);
    return ok(res, "My leave requests", requests);
  });

  listRequests = catchAsync(async (req, res) => {
    const q = { ...req.query };
    if (q.year) q.year = Number(q.year);
    const requests = await leaveService.listRequests(q);
    return ok(res, "Leave requests", requests);
  });

  getRequestById = catchAsync(async (req, res) => {
    const request = await leaveService.getRequestById(req.params.id, req.user.id, req.user.role);
    return ok(res, "Leave request", request);
  });

  approveRequest = catchAsync(async (req, res) => {
    const request = await leaveService.approveRequest(req.params.id, req.user.id, req.body?.reviewNotes);
    return ok(res, "Leave request approved", request);
  });

  rejectRequest = catchAsync(async (req, res) => {
    const request = await leaveService.rejectRequest(req.params.id, req.user.id, req.body?.reviewNotes);
    return ok(res, "Leave request rejected", request);
  });

  cancelRequest = catchAsync(async (req, res) => {
    const request = await leaveService.cancelRequest(req.params.id, req.user.id, req.user.role);
    return ok(res, "Leave request cancelled", request);
  });
}

export default new LeaveController();
