import { prisma } from "./src/config/prisma.js";

async function checkColumns() {
  try {
    const columns = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'User'"
    );
    console.log("Database Columns:", columns);
  } catch (err) {
    console.error("Error checking columns:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
