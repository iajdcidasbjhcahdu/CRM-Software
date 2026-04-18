import attendanceService from "./attendance.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

class AttendanceController {
  checkIn = catchAsync(async (req, res) => {
    const record = await attendanceService.checkIn(req.user.id, req.body?.notes);
    return created(res, "Checked in", record);
  });

  checkOut = catchAsync(async (req, res) => {
    const record = await attendanceService.checkOut(req.user.id, req.body?.notes);
    return ok(res, "Checked out", record);
  });

  getToday = catchAsync(async (req, res) => {
    const record = await attendanceService.getTodayForUser(req.user.id);
    return ok(res, "Today's attendance", record);
  });

  getMy = catchAsync(async (req, res) => {
    const records = await attendanceService.getMyAttendance(req.user.id, req.query);
    return ok(res, "My attendance", records);
  });

  getDailySheet = catchAsync(async (req, res) => {
    const rows = await attendanceService.getDailySheet(req.query.date);
    return ok(res, "Daily attendance sheet", rows);
  });

  getUserAttendance = catchAsync(async (req, res) => {
    const records = await attendanceService.getUserAttendance(req.params.userId, req.query);
    return ok(res, "User attendance", records);
  });

  manualMark = catchAsync(async (req, res) => {
    const record = await attendanceService.manualMark(req.body, req.user.id);
    return created(res, "Attendance saved", record);
  });

  update = catchAsync(async (req, res) => {
    const record = await attendanceService.updateAttendance(req.params.id, req.body, req.user.id);
    return ok(res, "Attendance updated", record);
  });

  delete = catchAsync(async (req, res) => {
    await attendanceService.deleteAttendance(req.params.id);
    return ok(res, "Attendance deleted");
  });
}

export default new AttendanceController();
