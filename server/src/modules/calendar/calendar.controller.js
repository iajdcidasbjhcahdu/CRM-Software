import calendarService from "./calendar.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class CalendarController {
  getEvents = catchAsync(async (req, res) => {
    const events = await calendarService.getEvents(req.query);
    return ok(res, "Calendar events retrieved successfully", events);
  });
}

export default new CalendarController();
