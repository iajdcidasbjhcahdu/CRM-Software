import authService from "./auth.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class AuthController {
  /**
   * POST /api/auth/register
   */
  register = catchAsync(async (req, res) => {
    const result = await authService.register(req.body);
    return created(res, "User registered successfully", result);
  });

  /**
   * POST /api/auth/login
   */
  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return ok(res, "Login successful", result);
  });

  /**
   * POST /api/auth/refresh-token
   */
  refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    return ok(res, "Token refreshed successfully", tokens);
  });

  /**
   * POST /api/auth/logout
   */
  logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return ok(res, "Logged out successfully");
  });

  /**
   * POST /api/auth/change-password
   */
  changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return ok(res, "Password changed successfully");
  });

  /**
   * GET /api/auth/me
   */
  getMe = catchAsync(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    return ok(res, "User profile retrieved", user);
  });
}

export default new AuthController();
