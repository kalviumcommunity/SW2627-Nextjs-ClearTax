
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyToken } from "@/middleware/auth.middleware";
import { getCurrentUser, updateUserProfile } from "@/services/auth.service";

export async function GET(request) {
  try {
    const decoded = await verifyToken(request);

    const user = await getCurrentUser(decoded.id);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 401,
      }
    );
  }
}

export async function PUT(request) {
  try {
    const decoded = await verifyToken(request);

    let updateData = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = formData.get("name");
      const oldPassword = formData.get("oldPassword");
      const newPassword = formData.get("newPassword");
      const file = formData.get("profilePicture");

      if (name) updateData.name = name;
      if (oldPassword && newPassword) {
        updateData.oldPassword = oldPassword;
        updateData.newPassword = newPassword;
      }

      if (file && typeof file === "object" && file.size > 0) {
        const originalFileName = file.name;
        const extension = path.extname(originalFileName) || ".png";
        const fileName = `avatar_${decoded.id}_${Date.now()}${extension}`;

        const avatarsDir = path.join(process.cwd(), "public", "avatars");
        if (!fs.existsSync(avatarsDir)) {
          fs.mkdirSync(avatarsDir, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(avatarsDir, fileName);
        await fs.promises.writeFile(filePath, buffer);

        updateData.profilePicture = `/avatars/${fileName}`;
      }
    } else {
      const body = await request.json();
      updateData = body;
    }

    const updatedUser = await updateUserProfile(decoded.id, updateData);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("PUT Profile Update Error:", error);
    
    let status = 400;
    if (error.message === "Invalid Token" || error.message === "Authorization header missing") {
      status = 401;
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update profile",
      },
      { status }
    );
  }
}