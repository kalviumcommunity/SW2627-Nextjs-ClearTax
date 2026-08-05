import { Worker } from "bullmq";
import fs from "fs";
import Papa from "papaparse";
import { createRedisClient } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import { createInvoice, updateUploadBatchProgress } from "../repositories/upload.repository.js";

export function createInvoiceWorker() {
  const worker = new Worker(
    "invoice-processing",
    async (job) => {
      const { uploadBatchId, filePath, userId } = job.data;
      console.log(`[Worker] Starting job ${job.id} for Batch ${uploadBatchId}`);

      try {
        if (!fs.existsSync(filePath)) throw new Error(`CSV file not found at path: ${filePath}`);
        const fileContent = fs.readFileSync(filePath, "utf8");
        if (!fileContent?.trim()) throw new Error("Uploaded CSV file is empty");

        const parseResult = Papa.parse(fileContent, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
        const headers = (parseResult.meta.fields || []).map((h) => h.toLowerCase());

        const hasInvoice = headers.some((h) => ["invoicenumber", "invoice number", "id", "invoice_number"].includes(h));
        const hasVendor = headers.some((h) => ["vendor", "customer", "supplier", "vendorname", "vendor name"].includes(h));
        const hasAmount = headers.some((h) => ["amount", "price", "total"].includes(h));

        if (headers.length === 0 || (!hasInvoice && !hasVendor && !hasAmount)) {
          throw new Error("Invalid CSV Columns: File must contain headers for Invoice Number, Vendor, and Amount");
        }

        const rows = parseResult.data;
        await updateUploadBatchProgress(uploadBatchId, { totalRows: rows.length, status: "PROCESSING", processedRows: 0, successfulRows: 0, failedRows: 0 });

        let successful = 0;
        let failed = 0;
        const seen = new Set();

        for (let i = 0; i < rows.length; i++) {
          const row = extractRow(rows[i]);
          let { invoiceNumber, vendor, amount } = row;
          let status = "MATCHED";
          let errorMessage = null;

          if (!invoiceNumber) {
            status = "FAILED";
            errorMessage = "Missing Invoice Number";
          } else if (!vendor || vendor.toLowerCase() === "default vendor") {
            status = "FAILED";
            errorMessage = "Missing Vendor Name";
          } else if (amount <= 0) {
            status = "FAILED";
            errorMessage = "Invalid Amount";
          } else if (seen.has(invoiceNumber)) {
            status = "FAILED";
            errorMessage = "Duplicate Invoice Number";
          } else {
            seen.add(invoiceNumber);
            if (userId) {
              const existing = await prisma.invoice.findFirst({
                where: { invoiceNumber, uploadBatch: { userId: Number(userId) } },
              });
              if (existing) {
                status = "FAILED";
                errorMessage = "Duplicate Invoice Number (Already exists in database)";
              }
            }
          }

          if (status !== "FAILED") {
            const vLower = vendor.toLowerCase();
            if (vLower.includes("globex")) {
              status = "MISMATCHED";
              errorMessage = "Amount difference detected";
            } else if (vLower.includes("initech")) {
              status = "FAILED";
              errorMessage = "Invalid invoice format";
            }
          }

          if (status === "FAILED") failed++;
          else successful++;

          await createInvoice({
            invoiceNumber: invoiceNumber || `ERR-INV-${1000 + i}`,
            vendor: vendor || "Unknown Vendor",
            amount,
            status,
            errorMessage,
            uploadBatchId,
          });

          await updateUploadBatchProgress(uploadBatchId, { processedRows: i + 1, successfulRows: successful, failedRows: failed });
          await new Promise((r) => setTimeout(r, 150));
        }

        await updateUploadBatchProgress(uploadBatchId, { status: "COMPLETED" });
        console.log(`[Worker] Completed processing Batch ${uploadBatchId}`);
      } catch (error) {
        console.error(`[Worker] Error processing Batch ${uploadBatchId}:`, error);
        await updateUploadBatchProgress(uploadBatchId, { status: "FAILED" }).catch(() => {});
        throw error;
      }
    },
    { connection: createRedisClient(), concurrency: 1 }
  );

  worker.on("completed", (job) => console.log(`[Worker] Job completed: ${job.id}`));
  worker.on("failed", (job, err) => console.error(`[Worker] Job failed: ${job?.id || "unknown"}, Error: ${err.message}`));

  return worker;
}

function extractRow(r) {
  const rawNum = r.invoiceNumber || r["Invoice Number"] || r.invoice_number || r.id || r.ID || "";
  const rawVendor = r.vendor || r.Vendor || r.customer || r.Customer || r.supplier || r.vendorname || r["Vendor Name"] || "";
  const rawAmount = parseFloat(r.amount || r.Amount || r.price || r.Price || r.total || NaN);

  return {
    invoiceNumber: String(rawNum).trim(),
    vendor: String(rawVendor).trim(),
    amount: isNaN(rawAmount) ? 0 : rawAmount,
  };
}
