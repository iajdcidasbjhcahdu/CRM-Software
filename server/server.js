import app from "./src/app.js";
import config from "./src/config/index.js";
import prisma from "./src/utils/prisma.js";

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} [${config.env}]`);
      console.log(`📍 Health check: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🔄 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
