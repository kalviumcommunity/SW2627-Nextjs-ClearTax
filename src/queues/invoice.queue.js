import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export const invoiceQueue =
  globalThis.invoiceQueue ||
  (globalThis.invoiceQueue = new Queue("invoice-processing", {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    },
  }));
