import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables from root directory if running from server folder
const envPath = fs.existsSync(path.join(process.cwd(), ".env"))
  ? path.join(process.cwd(), ".env")
  : path.join(process.cwd(), "../.env");
dotenv.config({ path: envPath });

import { verifyToken } from "./middleware/auth.middleware.js";
import { signup, login, getCurrentUser, updateUserProfile } from "./services/auth.service.js";
import { signupSchema, loginSchema } from "./validations/auth.validation.js";
import uploadService from "./services/upload.service.js";
import { prisma } from "./lib/prisma.js";
import { createInvoiceWorker } from "./workers/invoice.worker.js";

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve avatars folder statically
app.use("/avatars", express.static(path.join(process.cwd(), "public/avatars")));

// Setup multer for memory storage uploads
const upload = multer({ storage: multer.memoryStorage() });

// Express JWT validation wrapper
async function verifyTokenExpress(req) {
  const requestMock = {
    headers: {
      get: (headerName) => req.headers[headerName.toLowerCase()]
    }
  };
  return await verifyToken(requestMock);
}

// Authentication middleware to guard protected routes
async function authenticateUser(req, res, next) {
  try {
    const decoded = await verifyTokenExpress(req);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || "Unauthorized: Invalid or expired token",
    });
  }
}

// Start BullMQ Worker
const worker = createInvoiceWorker();
console.log("[Worker] Background Invoice Worker registered and listening.");

// --- REST API ENDPOINTS ---

// GET /api/health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "backend-api", timestamp: new Date().toISOString() });
});

// GET /api/test-db
app.get("/api/test-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: "Database Connected Successfully 🚀",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const validateData = signupSchema.parse(req.body);
    const user = await signup(validateData);
    res.status(201).json({
      success: true,
      message: "User registered Successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const validateData = loginSchema.parse(req.body);
    const result = await login(validateData);
    res.json({
      success: true,
      message: "User loginned Successfully",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/auth/me
app.get("/api/auth/me", authenticateUser, async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

// PUT /api/auth/me
app.put("/api/auth/me", authenticateUser, upload.single("profilePicture"), async (req, res) => {
  try {
    let updateData = {};

    if (req.file) {
      const originalFileName = req.file.originalname;
      const extension = path.extname(originalFileName) || ".png";
      const fileName = `avatar_${req.user.id}_${Date.now()}${extension}`;

      const avatarsDir = path.join(process.cwd(), "public/avatars");
      if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
      }

      const filePath = path.join(avatarsDir, fileName);
      await fs.promises.writeFile(filePath, req.file.buffer);

      updateData.profilePicture = `/avatars/${fileName}`;
    }

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.oldPassword && req.body.newPassword) {
      updateData.oldPassword = req.body.oldPassword;
      updateData.newPassword = req.body.newPassword;
    }

    if (!req.file && Object.keys(req.body).length > 0) {
      updateData = { ...updateData, ...req.body };
    }

    const updatedUser = await updateUserProfile(req.user.id, updateData);
    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT Profile Update Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
});

// GET /api/invoices
app.get("/api/invoices", authenticateUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const status = req.query.status;
    const uploadBatchId = req.query.uploadBatchId;
    const search = req.query.search;

    const result = await uploadService.getInvoicesPaged({
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      uploadBatchId: uploadBatchId ? parseInt(uploadBatchId) : undefined,
      search,
      userId: req.user.id,
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET Invoices List Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve invoices list",
    });
  }
});

// GET /api/uploads
app.get("/api/uploads", authenticateUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";
    const status = req.query.status;
    const search = req.query.search;

    const result = await uploadService.getUploadsPaged({
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      search,
      userId: req.user.id,
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET Uploads List Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve uploads list",
    });
  }
});

// GET /api/upload
app.get("/api/upload", authenticateUser, async (req, res) => {
  try {
    const uploads = await uploadService.getAllUploads(req.user.id);
    res.json({ success: true, data: uploads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/upload
app.post("/api/upload", authenticateUser, upload.single("file"), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No valid file found in request. Please upload a file.",
      });
    }

    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype || "text/csv",
    });

    const result = await uploadService.processFileUpload(file, userId);

    if (!result.batch) {
      return res.status(400).json({
        success: false,
        message: "Failed to create upload batch",
      });
    }

    res.status(201).json({
      success: true,
      message: "File uploaded and processed successfully!",
      data: result,
    });
  } catch (error) {
    console.error("API Upload Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process file upload.",
    });
  }
});

// GET /api/upload/:id
// GET /api/uploads/:id
app.get(["/api/upload/:id", "/api/uploads/:id"], authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await uploadService.getUploadStatus(parseInt(id), req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    console.error("GET Upload Details Error:", error);
    let status = 500;
    if (error.message === "Forbidden") {
      status = 403;
    } else if (error.message === "Upload batch not found") {
      status = 404;
    }
    res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch upload batch details",
    });
  }
});

// GET /api/uploads/:id/progress
app.get("/api/uploads/:id/progress", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await uploadService.getUploadStatus(parseInt(id), req.user.id);
    const percentage = data.totalRows > 0
      ? Math.round((data.processedRows / data.totalRows) * 100)
      : 0;

    res.json({
      status: data.status,
      totalRows: data.totalRows,
      processedRows: data.processedRows,
      successfulRows: data.successfulRows,
      failedRows: data.failedRows,
      percentage,
    });
  } catch (error) {
    console.error("GET Upload Progress Error:", error);
    let status = 500;
    if (error.message === "Forbidden") {
      status = 403;
    } else if (error.message === "Upload batch not found") {
      status = 404;
    }
    res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch progress metrics",
    });
  }
});

// POST /api/uploads/:id/retry
app.post("/api/uploads/:id/retry", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await uploadService.retryUploadBatch(parseInt(id), req.user.id);
    res.json(result);
  } catch (error) {
    console.error("POST Upload Retry Error:", error);
    let status = 500;
    if (error.message === "Forbidden") {
      status = 403;
    } else if (error.message === "Upload batch not found") {
      status = 404;
    }
    res.status(status).json({
      success: false,
      message: error.message || "Failed to trigger retry processing",
    });
  }
});

// GET /api/progress (placeholder)
app.get("/api/progress", (req, res) => {
  res.json({ ok: true, message: "Progress API placeholder" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] REST API Server running on port ${PORT}`);
});
