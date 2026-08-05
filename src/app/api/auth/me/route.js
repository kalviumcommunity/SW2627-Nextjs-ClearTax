import path from "path";
import fs from "fs";
import { getCurrentUser, updateUserProfile } from "@/services/auth.service.js";
import { authenticateUser } from "@/middleware/auth.middleware.js";

export async function GET(request) {
  try {
    const authUser = await authenticateUser(request);
    const user = await getCurrentUser(authUser.id);
    return Response.json({ success: true, user });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    const authUser = await authenticateUser(request);
    const contentType = request.headers.get("content-type") || "";
    const updateData = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("profilePicture");
      const name = formData.get("name");
      const oldPassword = formData.get("oldPassword");
      const newPassword = formData.get("newPassword");

      if (file && typeof file === "object" && file.name) {
        const ext = path.extname(file.name) || ".png";
        const fileName = `avatar_${authUser.id}_${Date.now()}${ext}`;
        const avatarsDir = path.join(process.cwd(), "public/avatars");

        if (!fs.existsSync(avatarsDir)) {
          fs.mkdirSync(avatarsDir, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.promises.writeFile(path.join(avatarsDir, fileName), buffer);
        updateData.profilePicture = `/avatars/${fileName}`;
      }

      if (name) updateData.name = name;
      if (oldPassword && newPassword) {
        updateData.oldPassword = oldPassword;
        updateData.newPassword = newPassword;
      }
    } else {
      const body = await request.json();
      if (body.name) updateData.name = body.name;
      if (body.oldPassword && body.newPassword) {
        updateData.oldPassword = body.oldPassword;
        updateData.newPassword = body.newPassword;
      }
    }

    const updatedUser = await updateUserProfile(authUser.id, updateData);
    return Response.json({ success: true, user: updatedUser });
  } catch (error) {
    return Response.json({ success: false, message: error.message || "Failed to update profile" }, { status: 400 });
  }
}
