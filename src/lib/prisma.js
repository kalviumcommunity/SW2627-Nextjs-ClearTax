import { PrismaClient } from "@prisma/client";

const logLevel = process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: logLevel,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
