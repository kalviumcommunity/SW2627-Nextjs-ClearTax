import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { signup, login, getCurrentUser, updateUserProfile } from "../services/auth.service.js";
import { signupSchema, loginSchema } from "../validations/auth.validation.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
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
router.post("/login", async (req, res) => {
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
router.get("/me", authenticateUser, async (req, res) => {
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
router.put("/me", authenticateUser, upload.single("profilePicture"), async (req, res) => {
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

export default router;
