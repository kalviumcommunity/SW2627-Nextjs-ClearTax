import { PrismaClient } from "@prisma/client";

const logLevel = process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

const options = { log: logLevel };
if (process.env.DATABASE_URL) {
  options.datasources = { db: { url: process.env.DATABASE_URL } };
}

export const prisma =
  globalThis.prisma || (globalThis.prisma = new PrismaClient(options));

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
