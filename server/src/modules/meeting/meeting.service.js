import prisma from "../../utils/prisma.js";
import notificationService from "../notification/notification.service.js";
import { ApiError } from "../../utils/apiError.js";

const MEETING_INCLUDE = {
  lead: {
    select: { id: true, companyName: true, contactName: true },
  },
  deal: {
    select: { id: true, title: true, stage: true },
  },
  project: {
    select: { id: true, name: true, status: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  parentMeeting: {
    select: { id: true, title: true, scheduledAt: true },
  },
  followUpMeetings: {
    select: { id: true, title: true, scheduledAt: true, status: true },
    orderBy: { scheduledAt: "asc" },
  },
};

class MeetingService {
  async createMeeting(data, createdById) {
    // Validate at least one entity is linked
    if (!data.leadId && !data.dealId && !data.projectId) {
      throw ApiError.badRequest("Meeting must be linked to a lead, deal, or project");
    }

    // Validate the linked entity exists
    if (data.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      if (!lead) throw ApiError.notFound("Lead not found");
    }
    if (data.dealId) {
      const deal = await prisma.deal.findUnique({ where: { id: data.dealId } });
      if (!deal) throw ApiError.notFound("Deal not found");
    }
    if (data.projectId) {
      const project = await prisma.project.findUnique({ where: { id: data.projectId } });
      if (!project) throw ApiError.notFound("Project not found");
    }

    // Validate parent meeting exists if isFollowUp
    if (data.parentMeetingId) {
      const parent = await prisma.meeting.findUnique({ where: { id: data.parentMeetingId } });
      if (!parent) throw ApiError.notFound("Parent meeting not found");
      data.isFollowUp = true;
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description || null,
        mode: data.mode || "VIRTUAL",
        status: data.status || "SCHEDULED",
        link: data.link || null,
        scheduledAt: data.scheduledAt,
        duration: data.duration || null,
        notes: data.notes || null,
        outcome: data.outcome || null,
        isFollowUp: data.isFollowUp || false,
        parentMeetingId: data.parentMeetingId || null,
        leadId: data.leadId || null,
        dealId: data.dealId || null,
        projectId: data.projectId || null,
        createdById,
      },
      include: MEETING_INCLUDE,
    });

    // ── Send in-app notifications ──
    // Collect all user IDs that should be notified (deduplicated, excluding creator)
    try {
      const notifyUserIds = new Set();

      // 1. All users with OWNER role
      const owners = await prisma.user.findMany({
        where: { role: "OWNER", status: "ACTIVE" },
        select: { id: true },
      });
      owners.forEach((u) => notifyUserIds.add(u.id));

      // 2-4. Creator, Assignee (Sales Manager), and Account Manager of the linked entity
      if (data.leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: data.leadId },
          select: { createdById: true, assigneeId: true },
        });
        if (lead?.createdById) notifyUserIds.add(lead.createdById);
        if (lead?.assigneeId) notifyUserIds.add(lead.assigneeId);
      }

      if (data.dealId) {
        const deal = await prisma.deal.findUnique({
          where: { id: data.dealId },
          select: { createdById: true, assigneeId: true },
        });
        if (deal?.createdById) notifyUserIds.add(deal.createdById);
        if (deal?.assigneeId) notifyUserIds.add(deal.assigneeId);
      }

      if (data.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
          select: { createdById: true, accountManagerId: true },
        });
        if (project?.createdById) notifyUserIds.add(project.createdById);
        if (project?.accountManagerId) notifyUserIds.add(project.accountManagerId);

        // 5. Team Leads of teams assigned to the project
        const projectTeams = await prisma.projectTeam.findMany({
          where: { projectId: data.projectId },
          select: {
            team: {
              select: { leadId: true },
            },
          },
        });
        projectTeams.forEach((pt) => {
          if (pt.team?.leadId) notifyUserIds.add(pt.team.leadId);
        });
      }

      // Remove the creator — they already know about the meeting
      // notifyUserIds.delete(createdById);

      if (notifyUserIds.size > 0) {
        // Build context-aware description
        const entityName = meeting.lead?.companyName
          || meeting.deal?.title
          || meeting.project?.name
          || "";
        const entityType = data.leadId ? "Lead" : data.dealId ? "Deal" : "Project";
        const modeLabel = data.mode === "VIRTUAL" ? "Virtual" : data.mode === "IN_PERSON" ? "In-Person" : "Phone Call";
        const scheduledStr = new Date(data.scheduledAt).toLocaleString("en-IN", {
          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        });

        const linkUrl = data.leadId
          ? `/owner/leads/${data.leadId}`
          : data.dealId
            ? `/owner/deals/${data.dealId}`
            : `/owner/projects/${data.projectId}`;

        await notificationService.sendBulk({
          userIds: Array.from(notifyUserIds),
          title: `New Meeting: ${meeting.title}`,
          description: `A ${modeLabel.toLowerCase()} meeting "${meeting.title}" has been scheduled for ${scheduledStr} on ${entityType}: ${entityName}.`,
          type: data.leadId ? "LEAD" : data.dealId ? "DEAL" : "PROJECT",
          channel: "IN_APP",
          linkUrl,
        });
      }
    } catch (err) {
      // Notification failure should never block meeting creation
      console.error("[MeetingService] Notification send failed:", err.message);
    }

    return meeting;
  }

  async listMeetings({ page, limit, mode, status, leadId, dealId, projectId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (mode) where.mode = mode;
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;
    if (dealId) where.dealId = dealId;
    if (projectId) where.projectId = projectId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: MEETING_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      meetings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMeetingById(id) {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: MEETING_INCLUDE,
    });

    if (!meeting) throw ApiError.notFound("Meeting not found");
    return meeting;
  }

  async updateMeeting(id, data) {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw ApiError.notFound("Meeting not found");

    return prisma.meeting.update({
      where: { id },
      data,
      include: MEETING_INCLUDE,
    });
  }

  async deleteMeeting(id) {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw ApiError.notFound("Meeting not found");

    await prisma.meeting.delete({ where: { id } });
  }

  async getMeetingsByLead(leadId) {
    return prisma.meeting.findMany({
      where: { leadId },
      include: MEETING_INCLUDE,
      orderBy: { scheduledAt: "desc" },
    });
  }

  async getMeetingsByDeal(dealId) {
    return prisma.meeting.findMany({
      where: { dealId },
      include: MEETING_INCLUDE,
      orderBy: { scheduledAt: "desc" },
    });
  }

  async getMeetingsByProject(projectId) {
    return prisma.meeting.findMany({
      where: { projectId },
      include: MEETING_INCLUDE,
      orderBy: { scheduledAt: "desc" },
    });
  }
}

export default new MeetingService();
