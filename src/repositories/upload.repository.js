import { prisma } from "../lib/prisma.js";

const USER_FIELDS = { id: true, name: true, email: true, role: true };

export async function createUploadBatch(data) {
  return prisma.uploadBatch.create({
    data: {
      fileName: data.fileName,
      originalFileName: data.originalFileName,
      totalRows: data.totalRows || 0,
      status: "PENDING",
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      userId: data.userId ? Number(data.userId) : null,
    },
    include: { user: { select: USER_FIELDS } },
  });
}

export async function saveInvoices(uploadBatchId, invoices = []) {
  if (!invoices.length) return [];

  const batchId = Number(uploadBatchId);
  const invoiceRecords = invoices.map((inv) => ({
    invoiceNumber: String(inv.invoiceNumber || inv.invoice_number || inv.id || `INV-${Date.now()}`),
    vendor: String(inv.vendor || inv.customer || "Unknown Vendor"),
    amount: parseFloat(inv.amount) || 0,
    status: ["MATCHED", "MISMATCHED"].includes(inv.status?.toUpperCase()) ? inv.status.toUpperCase() : "PENDING",
    errorMessage: inv.error || null,
    uploadBatchId: batchId,
  }));

  await prisma.invoice.createMany({ data: invoiceRecords });
  return prisma.invoice.findMany({ where: { uploadBatchId: batchId } });
}

export async function getUploadBatchById(id) {
  return prisma.uploadBatch.findUnique({
    where: { id: Number(id) },
    include: { invoices: true, user: { select: USER_FIELDS } },
  });
}

export async function getAllUploadBatches(userId) {
  if (!userId) throw new Error("User ID is required to retrieve upload batches");
  return prisma.uploadBatch.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: "desc" },
    include: { invoices: true, user: { select: USER_FIELDS } },
  });
}

export async function createInvoice(data) {
  return prisma.invoice.create({
    data: {
      invoiceNumber: String(data.invoiceNumber),
      vendor: String(data.vendor),
      amount: parseFloat(data.amount) || 0,
      status: data.status || "PENDING",
      errorMessage: data.errorMessage || null,
      uploadBatchId: Number(data.uploadBatchId),
    },
  });
}

export async function updateUploadBatchProgress(id, progressData) {
  return prisma.uploadBatch.update({
    where: { id: Number(id) },
    data: progressData,
  });
}

export async function getUploadBatchesWithPagination(opts = {}) {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", status, search, userId } = opts;
  if (!userId) throw new Error("User ID is required for retrieving paginated upload batches");

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const validSorts = ["createdAt", "updatedAt", "totalRows", "processedRows", "status"];
  const sortField = validSorts.includes(sortBy) ? sortBy : "createdAt";

  const where = {
    userId: Number(userId),
    ...(status && { status }),
    ...(search && {
      OR: [
        { fileName: { contains: search, mode: "insensitive" } },
        { originalFileName: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.uploadBatch.findMany({
      where,
      orderBy: { [sortField]: sortOrder?.toLowerCase() === "asc" ? "asc" : "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: { invoices: true },
    }),
    prisma.uploadBatch.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}

export async function getInvoicesWithPagination(opts = {}) {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", status, uploadBatchId, search, userId } = opts;
  if (!userId) throw new Error("User ID is required for retrieving paginated invoices");

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const validSorts = ["createdAt", "updatedAt", "amount", "invoiceNumber", "vendor", "status"];
  const sortField = validSorts.includes(sortBy) ? sortBy : "createdAt";

  const where = {
    uploadBatch: { userId: Number(userId) },
    ...(status && { status }),
    ...(uploadBatchId && { uploadBatchId: Number(uploadBatchId) }),
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { vendor: { contains: search, mode: "insensitive" } },
        { errorMessage: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { [sortField]: sortOrder?.toLowerCase() === "asc" ? "asc" : "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
}

export async function deleteInvoicesByBatchId(batchId) {
  return prisma.invoice.deleteMany({
    where: { uploadBatchId: Number(batchId) },
  });
}
