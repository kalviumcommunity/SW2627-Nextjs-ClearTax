import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";

export function createInvoiceWorker() {
  const worker = new Worker(
    "invoice-processing",
    async (job) => {
      const { uploadBatchId } = job.data;
      console.log(`[Worker] Started processing batch ${uploadBatchId}`);

      try {
        // 1. Fetch the batch with its invoices
        const batch = await prisma.uploadBatch.findUnique({
          where: { id: parseInt(uploadBatchId) },
          include: { invoices: true },
        });

        if (!batch) {
          console.error(`[Worker] Batch ${uploadBatchId} not found`);
          return;
        }

        // 2. Set batch status to PROCESSING
        await prisma.uploadBatch.update({
          where: { id: batch.id },
          data: { status: "PROCESSING" },
        });

        let successfulCount = 0;
        let failedCount = 0;

        // 3. Process each invoice
        for (let i = 0; i < batch.invoices.length; i++) {
          const inv = batch.invoices[i];
          let status = "MATCHED";
          let errorMessage = null;

          // Perform validation and classification rules
          if (!inv.invoiceNumber || inv.invoiceNumber.trim() === "") {
            status = "FAILED";
            errorMessage = "Missing invoice number";
          } else if (!inv.vendor || inv.vendor.trim() === "" || inv.vendor.toLowerCase() === "default vendor") {
            status = "FAILED";
            errorMessage = "Missing vendor name";
          } else if (inv.amount <= 0) {
            status = "FAILED";
            errorMessage = "Amount must be greater than 0";
          } else if (inv.vendor.toLowerCase().includes("initech")) {
            status = "FAILED";
            errorMessage = "Invalid invoice format";
          } else if (inv.vendor.toLowerCase().includes("globex")) {
            status = "MISMATCHED";
            errorMessage = "Amount difference detected";
          }

          if (status === "FAILED") {
            failedCount++;
          } else {
            successfulCount++;
          }

          // Update invoice status in database
          await prisma.invoice.update({
            where: { id: inv.id },
            data: { status, errorMessage },
          });

          // Update batch progress row-by-row
          await prisma.uploadBatch.update({
            where: { id: batch.id },
            data: {
              processedRows: i + 1,
              successfulRows: successfulCount,
              failedRows: failedCount,
            },
          });

          // Simulate processing latency to show progress transition
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // 4. Update final batch status to COMPLETED
        await prisma.uploadBatch.update({
          where: { id: batch.id },
          data: { status: "COMPLETED" },
        });

        console.log(`[Worker] Finished processing batch ${uploadBatchId}. Success: ${successfulCount}, Failed: ${failedCount}`);
      } catch (error) {
        console.error(`[Worker] Error processing batch ${uploadBatchId}:`, error);
        await prisma.uploadBatch.update({
          where: { id: parseInt(uploadBatchId) },
          data: { status: "FAILED" },
        }).catch(() => {});
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job completed: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job failed: ${job?.id || "unknown"}, Error: ${err.message}`);
  });

  return worker;
}
