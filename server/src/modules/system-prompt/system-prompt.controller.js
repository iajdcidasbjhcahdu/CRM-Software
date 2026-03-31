import systemPromptService from "./system-prompt.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class SystemPromptController {
  listPrompts = catchAsync(async (req, res) => {
    const prompts = await systemPromptService.listPrompts();
    return ok(res, "System prompts retrieved", prompts);
  });

  getPrompt = catchAsync(async (req, res) => {
    const prompt = await systemPromptService.getPrompt(req.params.id);
    return ok(res, "System prompt retrieved", prompt);
  });

  createPrompt = catchAsync(async (req, res) => {
    const prompt = await systemPromptService.createPrompt(req.body);
    return ok(res, "System prompt created", prompt);
  });

  updatePrompt = catchAsync(async (req, res) => {
    const prompt = await systemPromptService.updatePrompt(req.params.id, req.body);
    return ok(res, "System prompt updated", prompt);
  });

  deletePrompt = catchAsync(async (req, res) => {
    await systemPromptService.deletePrompt(req.params.id);
    return ok(res, "System prompt deleted");
  });
}

export default new SystemPromptController();
