import holidayService from "./holiday.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class HolidayController {
  list = catchAsync(async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const holidays = await holidayService.list(year);
    return ok(res, "Holidays", holidays);
  });

  create = catchAsync(async (req, res) => {
    const holiday = await holidayService.create(req.body);
    return created(res, "Holiday created", holiday);
  });

  update = catchAsync(async (req, res) => {
    const holiday = await holidayService.update(req.params.id, req.body);
    return ok(res, "Holiday updated", holiday);
  });

  delete = catchAsync(async (req, res) => {
    await holidayService.delete(req.params.id);
    return ok(res, "Holiday deleted");
  });
}

export default new HolidayController();
