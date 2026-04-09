import meetingService from "./meeting.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import prisma from "../../utils/prisma.js";
import { getUserProjectIds } from "../../utils/projectPermission.js";

class MeetingController {
  create = catchAsync(async (req, res) => {
    const meeting = await meetingService.createMeeting(req.body, req.user.id);
    return created(res, "Meeting created successfully", meeting);
  });

  list = catchAsync(async (req, res) => {
    const query = { ...req.query };

    // CLIENT users only see meetings from their own projects
    if (req.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { clientId: true },
      });
      if (user?.clientId) {
        // Get project IDs belonging to this client
        const projects = await prisma.project.findMany({
          where: { clientId: user.clientId },
          select: { id: true },
        });
        query.projectIds = projects.map((p) => p.id);
      }
    }

    // EMPLOYEE users only see meetings from their team's projects
    if (req.user.role === "EMPLOYEE") {
      const pIds = await getUserProjectIds(req.user.id);
      if (pIds.length > 0) {
        query.projectIds = pIds;
      }
    }

    const result = await meetingService.listMeetings(query);
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
