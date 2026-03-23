import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Owner account
  const ownerPassword = await bcrypt.hash("Owner@123", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@omnicore.com" },
    update: {},
    create: {
      email: "owner@omnicore.com",
      password: ownerPassword,
      firstName: "OmniCore",
      lastName: "Owner",
      role: "OWNER",
      status: "ACTIVE",
      isEmailVerified: true,
    },
  });
  console.log(`  ✅ Owner created: ${owner.email}`);

  // Create Admin account
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@omnicore.com" },
    update: {},
    create: {
      email: "admin@omnicore.com",
      password: adminPassword,
      firstName: "OmniCore",
      lastName: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
    },
  });
  console.log(`  ✅ Admin created: ${admin.email}`);

  console.log("\n🎉 Seeding completed!");
  console.log("\n📋 Default Credentials:");
  console.log("   Owner  → owner@omnicore.com / Owner@123");
  console.log("   Admin  → admin@omnicore.com / Admin@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
