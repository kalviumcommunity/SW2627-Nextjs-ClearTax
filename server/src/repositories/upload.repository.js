import { prisma } from "../config/prisma.js";

/**
 * Creates a new UploadBatch record in the database.
 */
export async function createUploadBatch(data) {
  const { fileName, originalFileName, totalRows = 0, userId = null } = data;

  return await prisma.uploadBatch.create({
    data: {
      fileName,
      originalFileName,
      totalRows,
      status: "PENDING",
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      userId: userId ? parseInt(userId) : null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Creates invoice records associated with an UploadBatch.
 */
export async function saveInvoices(uploadBatchId, invoices) {
  if (!invoices || invoices.length === 0) return [];

  const invoiceRecords = invoices.map((inv) => ({
    invoiceNumber: String(inv.invoiceNumber || inv.invoice_number || inv.id || `INV-${Date.now()}`),
    vendor: String(inv.vendor || inv.customer || "Unknown Vendor"),
    amount: parseFloat(inv.amount) || 0,
    status: inv.status?.toUpperCase() === "MATCHED" ? "MATCHED" : inv.status?.toUpperCase() === "MISMATCHED" ? "MISMATCHED" : "PENDING",
    errorMessage: inv.error || null,
    uploadBatchId: parseInt(uploadBatchId),
  }));

  await prisma.invoice.createMany({
    data: invoiceRecords,
  });

  return await prisma.invoice.findMany({
    where: { uploadBatchId: parseInt(uploadBatchId) },
  });
}

/**
 * Creates an UploadBatch and all parsed invoices in a transaction.
 */
export async function createUploadBatchWithInvoices(batchData, invoices = []) {
  const batch = await createUploadBatch(batchData);
  let savedInvoices = [];

  if (invoices && invoices.length > 0) {
    savedInvoices = await saveInvoices(batch.id, invoices);
  }

  return { ...batch, invoices: savedInvoices };
}

/**
 * Retrieves an UploadBatch by ID with its invoices and user.
 */
export async function getUploadBatchById(id) {
  return await prisma.uploadBatch.findUnique({
    where: { id: parseInt(id) },
    include: {
      invoices: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Retrieves all UploadBatches with invoices and associated user details.
 */
export async function getAllUploadBatches(userId) {
  if (!userId) {
    throw new Error("User ID is required to retrieve upload batches");
  }
  return await prisma.uploadBatch.findMany({
    where: { userId: parseInt(userId) },
    orderBy: { createdAt: "desc" },
    include: {
      invoices: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Creates a single invoice record.
 */
export async function createInvoice(data) {
  return await prisma.invoice.create({
    data: {
      invoiceNumber: String(data.invoiceNumber),
      vendor: String(data.vendor),
      amount: parseFloat(data.amount) || 0,
      status: data.status || "PENDING",
      errorMessage: data.errorMessage || null,
      uploadBatchId: parseInt(data.uploadBatchId),
    },
  });
}

/**
 * Updates progress metrics and status of an UploadBatch.
 */
export async function updateUploadBatchProgress(id, progressData) {
  return await prisma.uploadBatch.update({
    where: { id: parseInt(id) },
    data: progressData,
  });
}

/**
 * Retrieves UploadBatches with pagination, sorting, search, and status filtering.
 */
export async function getUploadBatchesWithPagination(options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
    search,
    userId,
  } = options;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};
  
  if (!userId) {
    throw new Error("User ID is required for retrieving paginated upload batches");
  }
  where.userId = parseInt(userId);
  
  if (status) {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { fileName: { contains: search, mode: "insensitive" } },
      { originalFileName: { contains: search, mode: "insensitive" } },
    ];
  }

  // Ensure sortBy is a valid column name
  const validSortFields = ["createdAt", "updatedAt", "totalRows", "processedRows", "status"];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const finalSortOrder = ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : "desc";

  const [data, total] = await Promise.all([
    prisma.uploadBatch.findMany({
      where,
      orderBy: { [finalSortBy]: finalSortOrder },
      skip,
      take,
      include: {
        invoices: true,
      },
    }),
    prisma.uploadBatch.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Retrieves Invoices with pagination, sorting, search, and status filtering.
 */
export async function getInvoicesWithPagination(options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    status,
    uploadBatchId,
    search,
    userId,
  } = options;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (uploadBatchId) {
    where.uploadBatchId = parseInt(uploadBatchId);
  }

  if (!userId) {
    throw new Error("User ID is required for retrieving paginated invoices");
  }
  where.uploadBatch = {
    userId: parseInt(userId),
  };

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { vendor: { contains: search, mode: "insensitive" } },
      { errorMessage: { contains: search, mode: "insensitive" } },
    ];
  }

  // Ensure sortBy is a valid column name
  const validSortFields = ["createdAt", "updatedAt", "amount", "invoiceNumber", "vendor", "status"];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  const finalSortOrder = ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : "desc";

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { [finalSortBy]: finalSortOrder },
      skip,
      take,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Deletes all invoices associated with an UploadBatch.
 */
export async function deleteInvoicesByBatchId(batchId) {
  return await prisma.invoice.deleteMany({
    where: { uploadBatchId: parseInt(batchId) },
  });
}
