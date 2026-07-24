import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Verifies database connection.
 */
export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log("✅ Database Connected");
  } catch (error) {
    console.error("❌ Database Connection Error:", error.message);
    throw error;
  }
}

/**
 * Closes the Prisma database client connection gracefully.
 */
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    console.log("🔌 Database Disconnected Gracefully");
  } catch (error) {
    console.error("❌ Database Disconnection Error:", error.message);
  }
}
