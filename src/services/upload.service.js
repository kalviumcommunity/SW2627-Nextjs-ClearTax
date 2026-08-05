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
import { prisma } from "../lib/prisma.js";

const uploadService = {
  async processFileUpload(file, userId = null) {
    if (!file || typeof file.text !== "function") {
      throw new Error("Invalid file object provided. Expected standard File object.");
    }

    const originalFileName = file.name;
    const fileName = `${Date.now()}_${originalFileName}`;
    const uploadsDir = path.join(process.cwd(), "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadsDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    const batchResult = await createUploadBatch({ fileName, originalFileName, totalRows: 0, userId });
    const job = await invoiceQueue.add("process-upload", { uploadBatchId: batchResult.id, filePath, userId });

    console.log("Job Added:", job.id, job.name, "for batch:", batchResult.id);

    return {
      success: true,
      message: "File uploaded and queued for background processing successfully",
      batch: batchResult,
    };
  },

  async getUploadStatus(uploadId, userId) {
    const batch = await getUploadBatchById(uploadId);
    if (!batch) throw new Error("Upload batch not found");
    if (userId && batch.userId !== Number(userId)) throw new Error("Forbidden");

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
    return getAllUploadBatches(userId);
  },

  async getUploadsPaged(options) {
    return getUploadBatchesWithPagination(options);
  },

  async getInvoicesPaged(options) {
    return getInvoicesWithPagination(options);
  },

  async retryUploadBatch(uploadBatchId, userId) {
    const batch = await getUploadBatchById(uploadBatchId);
    if (!batch) throw new Error("Upload batch not found");
    if (userId && batch.userId !== Number(userId)) throw new Error("Forbidden");

    await deleteInvoicesByBatchId(batch.id);
    const resetBatch = await updateUploadBatchProgress(batch.id, {
      status: "PENDING",
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
    });

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

  async getReportsStatistics(userId, dateRange) {
    const now = new Date();
    const ranges = getDateRanges(dateRange, now);
    const uid = Number(userId);

    const [curInvoices, curBatches, prevInvoices, prevBatches] = await Promise.all([
      prisma.invoice.findMany({
        where: { uploadBatch: { userId: uid }, createdAt: { gte: ranges.startDate, lte: ranges.endDate } },
        select: { status: true, createdAt: true },
      }),
      prisma.uploadBatch.findMany({
        where: { userId: uid, status: "COMPLETED", createdAt: { gte: ranges.startDate, lte: ranges.endDate } },
        select: { createdAt: true, updatedAt: true, totalRows: true },
      }),
      prisma.invoice.findMany({
        where: { uploadBatch: { userId: uid }, createdAt: { gte: ranges.previousStartDate, lte: ranges.previousEndDate } },
        select: { status: true, createdAt: true },
      }),
      prisma.uploadBatch.findMany({
        where: { userId: uid, status: "COMPLETED", createdAt: { gte: ranges.previousStartDate, lte: ranges.previousEndDate } },
        select: { createdAt: true, updatedAt: true, totalRows: true },
      }),
    ]);

    const cur = calcStats(curInvoices, curBatches);
    const prev = calcStats(prevInvoices, prevBatches);

    const slots = getChartSlots(dateRange, now);
    for (const inv of curInvoices) {
      const time = inv.createdAt.getTime();
      const slot = slots.find((s) => time >= s.start.getTime() && time <= s.end.getTime());
      if (slot) {
        if (inv.status === "FAILED") slot.errors++;
        else slot.processed++;
      }
    }

    return {
      stats: {
        totalProcessed: {
          value: cur.total.toLocaleString(),
          change: formatPct(cur.total, prev.total),
          positive: cur.total >= prev.total,
        },
        matchRate: {
          value: `${cur.matchRate.toFixed(1)}%`,
          change: formatPct(cur.matchRate, prev.matchRate),
          positive: cur.matchRate >= prev.matchRate,
        },
        avgProcessingTime: {
          value: `${cur.avgTime.toFixed(2)}s`,
          change: `${cur.avgTime - prev.avgTime >= 0 ? "+" : ""}${(cur.avgTime - prev.avgTime).toFixed(2)}s`,
          positive: cur.avgTime <= prev.avgTime,
        },
        criticalErrors: {
          value: cur.failed.toLocaleString(),
          change: `${cur.failed - prev.failed >= 0 ? "+" : ""}${cur.failed - prev.failed}`,
          positive: cur.failed <= prev.failed,
        },
      },
      barData: slots.map((s) => ({ name: s.label, processed: s.processed, errors: s.errors })),
      pieData: [
        { name: "Matches", value: cur.matched },
        { name: "Mismatches", value: cur.mismatched },
        { name: "Failed", value: cur.failed },
      ],
    };
  },
};

function calcStats(invoices, batches) {
  const total = invoices.length;
  let matched = 0, mismatched = 0, failed = 0;
  for (const inv of invoices) {
    if (inv.status === "MATCHED") matched++;
    else if (inv.status === "MISMATCHED") mismatched++;
    else if (inv.status === "FAILED") failed++;
  }

  const matchRate = total > 0 ? (matched / total) * 100 : 0;
  let timeMs = 0, rowsSum = 0;
  for (const b of batches) {
    const d = b.updatedAt.getTime() - b.createdAt.getTime();
    if (d > 0 && b.totalRows > 0) {
      timeMs += d;
      rowsSum += b.totalRows;
    }
  }

  const avgTime = rowsSum > 0 ? timeMs / rowsSum / 1000 : 0.15;
  return { total, matched, mismatched, failed, matchRate, avgTime };
}

function formatPct(cur, prev) {
  let pct = prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function getDateRanges(dateRange, now) {
  const endDate = new Date(now);
  let startDate, previousStartDate, previousEndDate;

  if (dateRange === "Last 7 Days") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
    previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);
  } else if (dateRange === "Last 30 Days") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59);
    previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 23, 59, 59, 999);
  } else if (dateRange === "Year to Date") {
    startDate = new Date(now.getFullYear(), 0, 1);
    previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
    previousEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    previousStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    previousEndDate = new Date(now.getFullYear(), now.getMonth() - 5, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate, previousStartDate, previousEndDate };
}

function getChartSlots(dateRange, now) {
  const slots = [];
  if (dateRange === "Last 7 Days") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      slots.push(makeSlot(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), d, d));
    }
  } else if (dateRange === "Last 30 Days") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      slots.push(makeSlot(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), d, d));
    }
  } else if (dateRange === "Year to Date") {
    for (let i = 0; i <= now.getMonth(); i++) {
      const start = new Date(now.getFullYear(), i, 1);
      const end = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59, 999);
      slots.push(makeSlot(start.toLocaleDateString("en-US", { month: "short" }), start, end));
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      slots.push(makeSlot(start.toLocaleDateString("en-US", { month: "short" }), start, end));
    }
  }
  return slots;
}

function makeSlot(label, startDate, endDate) {
  return {
    label,
    start: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0),
    end: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999),
    processed: 0,
    errors: 0,
  };
}

export default uploadService;
