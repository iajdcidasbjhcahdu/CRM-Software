import prisma from "../../utils/prisma.js";

class CalendarService {
  async getEvents(query) {
    const { start, end } = query;
    const dateFilter = {};
    if (start && end) {
      dateFilter.gte = new Date(start);
      dateFilter.lte = new Date(end);
    }

    const [projects, tasks, meetings, milestones, planningSteps, followUps] = await Promise.all([
      prisma.project.findMany({
        where: dateFilter.gte ? { OR: [{ startDate: dateFilter }, { endDate: dateFilter }, { nextBillingDate: dateFilter }] } : {},
        select: { id: true, name: true, startDate: true, endDate: true, nextBillingDate: true, status: true, budget: true, clientId: true },
      }),
      prisma.task.findMany({
        where: dateFilter.gte ? { dueDate: dateFilter } : {},
        select: { id: true, title: true, dueDate: true, status: true, priority: true, projectId: true },
      }),
      prisma.meeting.findMany({
        where: dateFilter.gte ? { scheduledAt: dateFilter } : {},
        select: { id: true, title: true, scheduledAt: true, duration: true, mode: true, status: true },
      }),
      prisma.milestone.findMany({
        where: dateFilter.gte ? { dueDate: dateFilter } : {},
        select: { id: true, title: true, dueDate: true, status: true, projectId: true },
      }),
      prisma.planningStep.findMany({
        where: dateFilter.gte ? { OR: [{ startDate: dateFilter }, { endDate: dateFilter }] } : {},
        select: { id: true, title: true, startDate: true, endDate: true, status: true, projectId: true },
      }),
      prisma.followUp.findMany({
        where: dateFilter.gte ? { dueAt: dateFilter } : {},
        select: { id: true, title: true, type: true, dueAt: true, status: true, leadId: true },
      })
    ]);

    const events = [];

    projects.forEach((p) => {
      if (p.startDate) events.push({ id: `proj_start_${p.id}`, entityId: p.id, title: `Start: ${p.name}`, date: p.startDate, type: "Project Phase", entityType: "PROJECT", status: p.status, details: p });
      if (p.endDate) events.push({ id: `proj_end_${p.id}`, entityId: p.id, title: `Deadline: ${p.name}`, date: p.endDate, type: "Project Phase", entityType: "PROJECT", status: p.status, details: p });
      if (p.nextBillingDate) events.push({ id: `proj_bill_${p.id}`, entityId: p.id, title: `Billing: ${p.name}`, date: p.nextBillingDate, type: "Billing", entityType: "PROJECT", status: p.status, details: p });
    });

    tasks.forEach((t) => {
      if (t.dueDate) events.push({ id: `task_${t.id}`, entityId: t.id, title: t.title, date: t.dueDate, type: "Task", entityType: "TASK", status: t.status, priority: t.priority, details: t });
    });

    meetings.forEach((m) => {
      if (m.scheduledAt) events.push({ id: `meet_${m.id}`, entityId: m.id, title: m.title, date: m.scheduledAt, type: "Meeting", entityType: "MEETING", status: m.status, details: m });
    });

    milestones.forEach((m) => {
      if (m.dueDate) events.push({ id: `ms_${m.id}`, entityId: m.id, title: m.title, date: m.dueDate, type: "Milestone", entityType: "MILESTONE", status: m.status, details: m });
    });

    planningSteps.forEach((p) => {
      if (p.startDate) events.push({ id: `plan_start_${p.id}`, entityId: p.id, title: `Start Phase: ${p.title}`, date: p.startDate, type: "Planning Phase", entityType: "PLANNING_STEP", status: p.status, details: p });
      if (p.endDate) events.push({ id: `plan_end_${p.id}`, entityId: p.id, title: `End Phase: ${p.title}`, date: p.endDate, type: "Planning Phase", entityType: "PLANNING_STEP", status: p.status, details: p });
    });

    followUps.forEach((f) => {
      if (f.dueAt) events.push({ id: `fu_${f.id}`, entityId: f.id, title: f.title, date: f.dueAt, type: "Follow Up", entityType: "FOLLOW_UP", status: f.status, details: f });
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events;
  }
}

export default new CalendarService();
