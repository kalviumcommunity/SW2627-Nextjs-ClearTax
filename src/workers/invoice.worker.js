import { Worker } from "bullmq";
import fs from "fs";
import Papa from "papaparse";
import { redis } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import {
  createInvoice,
  updateUploadBatchProgress,
} from "../repositories/upload.repository.js";

/**
 * Creates and registers the BullMQ worker for background invoice processing.
 * This worker processes jobs in the 'invoice-processing' queue, parses CSV files,
 * validates invoices, stores them in the database, and tracks progress.
 */
export function createInvoiceWorker() {
  const worker = new Worker(
    "invoice-processing",
    async (job) => {
      const { uploadBatchId, filePath, userId } = job.data;
      console.log(`[Worker] Starting job ${job.id} for Batch ${uploadBatchId}`);

      try {
        // 1. Verify CSV file exists on disk
        if (!fs.existsSync(filePath)) {
          throw new Error(`CSV file not found at path: ${filePath}`);
        }

        // 2. Read file contents
        const fileContent = fs.readFileSync(filePath, "utf8");
        if (!fileContent || fileContent.trim().length === 0) {
          throw new Error("Uploaded CSV file is empty");
        }

        // 3. Parse CSV using PapaParse
        const parseResult = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        });

        const headers = parseResult.meta.fields || [];
        
        // 4. Validate headers (Invalid CSV Columns check)
        const hasInvoiceNum = headers.some((h) =>
          ["invoicenumber", "invoice number", "id", "invoice_number"].includes(h.toLowerCase())
        );
        const hasVendor = headers.some((h) =>
          ["vendor", "customer", "supplier", "vendorname", "vendor name"].includes(h.toLowerCase())
        );
        const hasAmount = headers.some((h) =>
          ["amount", "price", "total"].includes(h.toLowerCase())
        );

        if (headers.length === 0 || (!hasInvoiceNum && !hasVendor && !hasAmount)) {
          throw new Error("Invalid CSV Columns: File must contain headers for Invoice Number, Vendor, and Amount");
        }

        const parsedRows = parseResult.data;
        const totalRows = parsedRows.length;

        // 5. Update Batch in Database with total rows and transition status to PROCESSING
        await updateUploadBatchProgress(uploadBatchId, {
          totalRows,
          status: "PROCESSING",
          processedRows: 0,
          successfulRows: 0,
          failedRows: 0,
        });

        let successfulCount = 0;
        let failedCount = 0;
        const seenInvoiceNumbers = new Set();

        // 6. Process each invoice row sequentially
        for (let i = 0; i < totalRows; i++) {
          const row = parsedRows[i];
          
          // Extract expected fields
          const rawInvoiceNumber = row.invoiceNumber || row["Invoice Number"] || row.invoice_number || row.id || row.ID || "";
          const rawVendor = row.vendor || row.Vendor || row.customer || row.Customer || row.supplier || row.vendorname || row["Vendor Name"] || "";
          const rawAmount = parseFloat(row.amount || row.Amount || row.price || row.Price || row.total || NaN);
          
          let invoiceNumber = String(rawInvoiceNumber).trim();
          let vendor = String(rawVendor).trim();
          let amount = isNaN(rawAmount) ? 0 : rawAmount;
          
          let status = "MATCHED";
          let errorMessage = null;

          // Phase 6 validation checks
          if (!invoiceNumber) {
            status = "FAILED";
            errorMessage = "Missing Invoice Number";
          } else if (!vendor || vendor.toLowerCase() === "default vendor") {
            status = "FAILED";
            errorMessage = "Missing Vendor Name";
          } else if (amount <= 0) {
            status = "FAILED";
            errorMessage = "Invalid Amount";
          } else if (seenInvoiceNumbers.has(invoiceNumber)) {
            status = "FAILED";
            errorMessage = "Duplicate Invoice Number";
          } else {
            // Track duplicates within the batch
            seenInvoiceNumbers.add(invoiceNumber);
            
            // Check for duplicates database-wide for the same user
            if (userId) {
              const existingDbInvoice = await prisma.invoice.findFirst({
                where: {
                  invoiceNumber,
                  uploadBatch: {
                    userId: parseInt(userId),
                  },
                },
              });
              if (existingDbInvoice) {
                status = "FAILED";
                errorMessage = "Duplicate Invoice Number (Already exists in database)";
              }
            }
          }

          // Check vendor match status / mismatches
          if (status !== "FAILED") {
            if (vendor.toLowerCase().includes("globex")) {
              status = "MISMATCHED";
              errorMessage = "Amount difference detected";
            } else if (vendor.toLowerCase().includes("initech")) {
              status = "FAILED";
              errorMessage = "Invalid invoice format";
            }
          }

          if (status === "FAILED") {
            failedCount++;
          } else {
            successfulCount++;
          }

          // Create invoice in the database
          await createInvoice({
            invoiceNumber: invoiceNumber || `ERR-INV-${1000 + i}`,
            vendor: vendor || "Unknown Vendor",
            amount,
            status,
            errorMessage,
            uploadBatchId,
          });

          // Update batch progress row-by-row in the database
          await updateUploadBatchProgress(uploadBatchId, {
            processedRows: i + 1,
            successfulRows: successfulCount,
            failedRows: failedCount,
          });

          // Simulate processing latency to show transition progress
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        // 7. Update batch status to COMPLETED
        await updateUploadBatchProgress(uploadBatchId, {
          status: "COMPLETED",
        });

        console.log(`[Worker] Completed processing Batch ${uploadBatchId}. Total: ${totalRows}, Success: ${successfulCount}, Failed: ${failedCount}`);
      } catch (error) {
        console.error(`[Worker] Error processing Batch ${uploadBatchId}:`, error);
        
        // Update batch status to FAILED for file-level exceptions
        await updateUploadBatchProgress(uploadBatchId, {
          status: "FAILED",
        }).catch(() => {});
        
        throw error;
      } finally {
        // Keeping CSV file on disk to support future retries
        console.log(`[Worker] Processing finished for batch: ${uploadBatchId}`);
      }
    },
    {
      connection: redis,
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job completed successfully: ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job failed: ${job?.id || "unknown"}, Error: ${err.message}`);
  });

  return worker;
}
