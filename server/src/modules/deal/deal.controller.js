import dealService from "./deal.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class DealController {
  /**
   * POST /api/deals
   */
  createDeal = catchAsync(async (req, res) => {
    const deal = await dealService.createDeal(req.body, req.user.id);
    return created(res, "Deal created from lead successfully", deal);
  });

  /**
   * GET /api/deals
   */
  listDeals = catchAsync(async (req, res) => {
    const result = await dealService.listDeals(req.query);
    return ok(res, "Deals retrieved", result);
  });

  /**
   * GET /api/deals/:id
   */
  getDealById = catchAsync(async (req, res) => {
    const deal = await dealService.getDealById(req.params.id);
    return ok(res, "Deal retrieved", deal);
  });

  /**
   * PATCH /api/deals/:id
   */
  updateDeal = catchAsync(async (req, res) => {
    const deal = await dealService.updateDeal(req.params.id, req.body);
    return ok(res, "Deal updated successfully", deal);
  });

  /**
   * PATCH /api/deals/:id/stage
   */
  updateDealStage = catchAsync(async (req, res) => {
    const { stage, lostReason, accountManagerId } = req.body;
    const result = await dealService.updateDealStage(req.params.id, stage, lostReason, accountManagerId);

    const message = stage === "WON"
      ? "Deal won — Client and Project created automatically"
      : `Deal stage updated to ${stage}`;

    return ok(res, message, result);
  });

  /**
   * DELETE /api/deals/:id
   */
  deleteDeal = catchAsync(async (req, res) => {
    await dealService.deleteDeal(req.params.id);
    return ok(res, "Deal deleted and lead reverted to qualified");
  });
}

export default new DealController();
