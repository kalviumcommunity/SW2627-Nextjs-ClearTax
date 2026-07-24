import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

export const invoiceQueue = new Queue("invoice-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,                 // Retries the job up to 3 times on connection failures or crashes
    backoff: {
      type: "exponential",
      delay: 1000,               // Delay starts at 1s and doubles per attempt
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});