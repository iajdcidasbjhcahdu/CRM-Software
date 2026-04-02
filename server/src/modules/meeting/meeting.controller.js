import meetingService from "./meeting.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class MeetingController {
  create = catchAsync(async (req, res) => {
    const meeting = await meetingService.createMeeting(req.body, req.user.id);
    return created(res, "Meeting created successfully", meeting);
  });

  list = catchAsync(async (req, res) => {
    const result = await meetingService.listMeetings(req.query);
    return ok(res, "Meetings retrieved", result);
  });

  getById = catchAsync(async (req, res) => {
    const meeting = await meetingService.getMeetingById(req.params.id);
    return ok(res, "Meeting retrieved", meeting);
  });

  update = catchAsync(async (req, res) => {
    const meeting = await meetingService.updateMeeting(req.params.id, req.body);
    return ok(res, "Meeting updated successfully", meeting);
  });

  delete = catchAsync(async (req, res) => {
    await meetingService.deleteMeeting(req.params.id);
    return ok(res, "Meeting deleted successfully");
  });

  getByLead = catchAsync(async (req, res) => {
    const meetings = await meetingService.getMeetingsByLead(req.params.leadId);
    return ok(res, "Meetings retrieved", meetings);
  });

  getByDeal = catchAsync(async (req, res) => {
    const meetings = await meetingService.getMeetingsByDeal(req.params.dealId);
    return ok(res, "Meetings retrieved", meetings);
  });

  getByProject = catchAsync(async (req, res) => {
    const meetings = await meetingService.getMeetingsByProject(req.params.projectId);
    return ok(res, "Meetings retrieved", meetings);
  });
}

export default new MeetingController();
