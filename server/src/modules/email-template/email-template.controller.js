import emailTemplateService from "./email-template.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class EmailTemplateController {
  /**
   * GET /api/email-templates
   */
  listTemplates = catchAsync(async (_req, res) => {
    const templates = await emailTemplateService.listTemplates();
    return ok(res, "Email templates retrieved", templates);
  });

  /**
   * GET /api/email-templates/:id
   */
  getTemplate = catchAsync(async (req, res) => {
    const template = await emailTemplateService.getTemplate(req.params.id);
    return ok(res, "Email template retrieved", template);
  });

  /**
   * PATCH /api/email-templates/:id
   */
  updateTemplate = catchAsync(async (req, res) => {
    const template = await emailTemplateService.updateTemplate(req.params.id, req.body);
    return ok(res, "Email template updated", template);
  });
}

export default new EmailTemplateController();
