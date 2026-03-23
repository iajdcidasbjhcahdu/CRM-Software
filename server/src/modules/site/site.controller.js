import siteService from "./site.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class SiteController {
  /**
   * GET /api/site
   * Public — returns site name, logo, contact, mode flags
   */
  getSiteInfo = catchAsync(async (_req, res) => {
    const site = await siteService.getSiteInfo();
    return ok(res, "Site info retrieved", site);
  });
}

export default new SiteController();
