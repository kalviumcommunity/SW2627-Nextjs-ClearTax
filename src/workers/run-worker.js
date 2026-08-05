import dotenv from "dotenv";
dotenv.config();

import { createInvoiceWorker } from "./invoice.worker.js";

console.log("[Worker Runner] Starting standalone BullMQ worker process...");
const worker = createInvoiceWorker();

process.on("SIGINT", async () => {
  console.log("[Worker Runner] Shutting down...");
  await worker.close();
  process.exit(0);
});
