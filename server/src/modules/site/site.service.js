import prisma from "../../utils/prisma.js";

class SiteService {
  /**
   * Get site info (public — no auth needed)
   * Auto-creates default record if none exists
   */
  async getSiteInfo() {
    let site = await prisma.site.findUnique({ where: { id: "default" } });

    if (!site) {
      site = await prisma.site.create({ data: { id: "default" } });
    }

    // Strip timestamps for public response
    const { createdAt, updatedAt, ...publicData } = site;
    return publicData;
  }
}

export default new SiteService();
