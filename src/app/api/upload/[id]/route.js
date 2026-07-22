import { NextResponse } from "next/server";
import { verifyToken } from "@/middleware/auth.middleware";
import uploadService from "@/services/upload.service";

export async function GET(request, { params }) {
  try {
    // 1. Authenticate user
    await verifyToken(request);

    // 2. Await dynamic route params (required in Next.js 15+)
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Upload ID is required" },
        { status: 400 }
      );
    }

    // 3. Retrieve upload batch status from services
    const data = await uploadService.getUploadStatus(parseInt(id));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET Upload Status Error:", error);
    
    let status = 500;
    if (error.message === "Invalid Token" || error.message === "Authorization header missing") {
      status = 401;
    } else if (error.message === "Upload batch not found") {
      status = 404;
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch upload status",
      },
      { status }
    );
  }
}
