import searchService from "./search.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class SearchController {
  globalSearch = catchAsync(async (req, res) => {
    const { q, limit } = req.query;
    const result = await searchService.globalSearch(q, limit ? parseInt(limit) : 5);
    return ok(res, "Search results", result);
  });
}

export default new SearchController();
