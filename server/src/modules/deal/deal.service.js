import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const STAGE_TRANSITIONS = {
  DISCOVERY: ["PROPOSAL", "LOST"],
  PROPOSAL: ["NEGOTIATION", "LOST"],
  NEGOTIATION: ["WON", "LOST"],
  WON: [],    // terminal
  LOST: ["DISCOVERY"], // allow re-opening
};

const DEAL_INCLUDE = {
  lead: {
    select: { id: true, companyName: true, contactName: true, email: true, source: true },
  },
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  client: {
    select: { id: true, companyName: true, status: true },
  },
  project: {
    select: { id: true, name: true, status: true },
  },
};

class DealService {
  /**
   * Create deal from a qualified lead
   */
  async createDeal(data, createdById) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });

    if (!lead) {
      throw ApiError.notFound("Lead not found");
    }

    if (lead.status !== "QUALIFIED") {
      throw ApiError.badRequest("Only qualified leads can be converted to deals");
    }

    // Check if lead already has a deal
    const existingDeal = await prisma.deal.findUnique({ where: { leadId: data.leadId } });
    if (existingDeal) {
      throw ApiError.conflict("This lead already has a deal");
    }

    // Validate assignee
    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!assignee) throw ApiError.badRequest("Assigned user not found");
      if (!["OWNER", "ADMIN", "SALES_MANAGER"].includes(assignee.role)) {
        throw ApiError.badRequest("Deals can only be assigned to Owner, Admin, or Sales Manager");
      }
    }

    // Create deal + mark lead as CONVERTED in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: data.leadId },
        data: { status: "CONVERTED", convertedAt: new Date() },
      });

      return tx.deal.create({
        data: {
          title: data.title,
          value: data.value,
          expectedCloseAt: data.expectedCloseAt,
          notes: data.notes,
          leadId: data.leadId,
          assigneeId: data.assigneeId || lead.assigneeId,
          createdById,
        },
        include: DEAL_INCLUDE,
      });
    });

    return deal;
  }

  /**
   * List deals with pagination, filters, search, sort
   */
  async listDeals({ page, limit, stage, assigneeId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (stage) where.stage = stage;
    if (assigneeId) where.assigneeId = assigneeId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { lead: { companyName: { contains: search, mode: "insensitive" } } },
        { lead: { contactName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: DEAL_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      deals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single deal
   */
  async getDealById(id) {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: DEAL_INCLUDE,
    });

    if (!deal) throw ApiError.notFound("Deal not found");
    return deal;
  }

  /**
   * Update deal details (not stage)
   */
  async updateDeal(id, data) {
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) throw ApiError.notFound("Deal not found");

    if (deal.stage === "WON") {
      throw ApiError.badRequest("Cannot edit a won deal");
    }

    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!assignee) throw ApiError.badRequest("Assigned user not found");
      if (!["OWNER", "ADMIN", "SALES_MANAGER"].includes(assignee.role)) {
        throw ApiError.badRequest("Deals can only be assigned to Owner, Admin, or Sales Manager");
      }
    }

    return prisma.deal.update({
      where: { id },
      data,
      include: DEAL_INCLUDE,
    });
  }

  /**
   * Update deal stage with transition validation
   * WON triggers: auto-create Client + Project
   */
  async updateDealStage(id, stage, lostReason, accountManagerId) {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!deal) throw ApiError.notFound("Deal not found");

    const allowed = STAGE_TRANSITIONS[deal.stage];
    if (!allowed.includes(stage)) {
      throw ApiError.badRequest(
        `Cannot transition from '${deal.stage}' to '${stage}'. Allowed: ${allowed.join(", ") || "none (terminal)"}`
      );
    }

    if (stage === "LOST" && !lostReason) {
      throw ApiError.badRequest("Lost reason is required when marking a deal as lost");
    }

    // ── WON: auto-create Client + Project in one transaction ──
    if (stage === "WON") {
      // Validate account manager if provided
      if (accountManagerId) {
        const am = await prisma.user.findUnique({ where: { id: accountManagerId } });
        if (!am) throw ApiError.badRequest("Account manager not found");
        if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
          throw ApiError.badRequest("Account manager must have Owner, Admin, or Account Manager role");
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        // Check if client already exists with this email
        let client = null;
        if (deal.lead.email) {
          client = await tx.client.findUnique({ where: { email: deal.lead.email } });
        }

        // Create client if doesn't exist
        if (!client) {
          client = await tx.client.create({
            data: {
              companyName: deal.lead.companyName,
              contactName: deal.lead.contactName,
              email: deal.lead.email,
              phone: deal.lead.phone,
              dealId: deal.id,
              accountManagerId: accountManagerId || null,
            },
          });
        }

        // Create project
        const project = await tx.project.create({
          data: {
            name: deal.title,
            clientId: client.id,
            dealId: deal.id,
            accountManagerId: accountManagerId || null,
            createdById: deal.createdById,
            budget: deal.value,
          },
        });

        // Update deal
        const updatedDeal = await tx.deal.update({
          where: { id },
          data: { stage: "WON", wonAt: new Date() },
          include: DEAL_INCLUDE,
        });

        return { deal: updatedDeal, client, project };
      });

      return result;
    }

    // ── LOST or stage change ──
    const updateData = { stage };
    if (stage === "LOST") updateData.lostReason = lostReason;
    if (stage === "DISCOVERY" && deal.stage === "LOST") updateData.lostReason = null;

    const updated = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: DEAL_INCLUDE,
    });

    return { deal: updated };
  }

  /**
   * Delete a deal (only DISCOVERY or LOST)
   */
  async deleteDeal(id) {
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) throw ApiError.notFound("Deal not found");

    if (!["DISCOVERY", "LOST"].includes(deal.stage)) {
      throw ApiError.badRequest("Only deals in DISCOVERY or LOST stage can be deleted");
    }

    // Revert lead status back to QUALIFIED
    await prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: deal.leadId },
        data: { status: "QUALIFIED", convertedAt: null },
      });
      await tx.deal.delete({ where: { id } });
    });
  }
}

export default new DealService();
