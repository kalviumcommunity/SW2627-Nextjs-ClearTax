import fs from "fs";
import path from "path";
import {
  createUploadBatch,
  getUploadBatchById,
  getAllUploadBatches,
  getUploadBatchesWithPagination,
  getInvoicesWithPagination,
  deleteInvoicesByBatchId,
  updateUploadBatchProgress,
} from "../repositories/upload.repository.js";
import { invoiceQueue } from "../queues/invoice.queue.js";

const uploadService = {
  /**
   * Processes a File Object received from request.formData()
   * @param {File} file - Standard Web API File object
   * @param {number|string|null} userId - Optional User ID
   */
  async processFileUpload(file, userId = null) {
    if (!file || typeof file.text !== "function") {
      throw new Error("Invalid file object provided. Expected standard File object.");
    }

    const originalFileName = file.name;
    const fileName = `${Date.now()}_${originalFileName}`;

    // 1. Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 2. Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadsDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    // 3. Create initial UploadBatch in database (in PENDING status, 0 rows processed/saved)
    const batchResult = await createUploadBatch({
      fileName,
      originalFileName,
      totalRows: 0,
      userId,
    });

    // 4. Add job to BullMQ queue
    const job = await invoiceQueue.add("process-upload", {
      uploadBatchId: batchResult.id,
      filePath,
      userId,
    });

    console.log("Job Added:", job.id, job.name, "for batch:", batchResult.id);

    return {
      success: true,
      message: "File uploaded and queued for background processing successfully",
      batch: batchResult,
    };
  },

  async getUploadStatus(uploadId, userId) {
    const batch = await getUploadBatchById(uploadId);
    if (!batch) {
      throw new Error("Upload batch not found");
    }
    if (userId && batch.userId !== parseInt(userId)) {
      throw new Error("Forbidden");
    }
    return {
      uploadId: batch.id,
      fileName: batch.originalFileName,
      status: batch.status,
      totalRows: batch.totalRows,
      processedRows: batch.processedRows,
      successfulRows: batch.successfulRows,
      failedRows: batch.failedRows,
      invoices: batch.invoices,
      createdAt: batch.createdAt,
    };
  },

  async getAllUploads(userId) {
    return await getAllUploadBatches(userId);
  },

  /**
   * Retrieves upload batches with pagination, sorting, search, and filtering
   */
  async getUploadsPaged(options) {
    return await getUploadBatchesWithPagination(options);
  },

  /**
   * Retrieves invoices with pagination, sorting, search, and filtering
   */
  async getInvoicesPaged(options) {
    return await getInvoicesWithPagination(options);
  },

  /**
   * Deletes old invoice records, resets progress metrics, and re-triggers background processing.
   */
  async retryUploadBatch(uploadBatchId, userId) {
    const batch = await getUploadBatchById(uploadBatchId);
    if (!batch) {
      throw new Error("Upload batch not found");
    }
    if (userId && batch.userId !== parseInt(userId)) {
      throw new Error("Forbidden");
    }

    // 1. Delete associated invoices
    await deleteInvoicesByBatchId(batch.id);

    // 2. Reset progress counters
    const resetBatch = await updateUploadBatchProgress(batch.id, {
      status: "PENDING",
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
    });

    // 3. Re-queue the job in BullMQ
    const filePath = path.join(process.cwd(), "uploads", batch.fileName);
    const job = await invoiceQueue.add("process-upload", {
      uploadBatchId: batch.id,
      filePath,
      userId: batch.userId,
    });

    console.log(`[Service] Retried job ${job.id} added for Batch ${batch.id}`);

    return {
      success: true,
      message: "Job successfully queued for retry processing.",
      batch: resetBatch,
    };
  },
};

export default uploadService;