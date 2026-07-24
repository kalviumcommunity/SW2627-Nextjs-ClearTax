import { NextResponse } from "next/server";
import { verifyToken } from "@/middleware/auth.middleware";
import uploadService from "@/services/upload.service";

/**
 * GET /api/uploads/:id/progress
 * Retrieves the real-time processing progress of a specific upload batch.
 */
export async function GET(request, { params }) {
  try {
    // 1. Authenticate user session
    await verifyToken(request);

    // 2. Resolve dynamic route parameters
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

    // 4. Calculate progress percentage
    const percentage = data.totalRows > 0
      ? Math.round((data.processedRows / data.totalRows) * 100)
      : 0;

    return NextResponse.json({
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
    if (error.message === "Invalid Token" || error.message === "Authorization header missing") {
      status = 401;
    } else if (error.message === "Upload batch not found") {
      status = 404;
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch progress metrics",
      },
      { status }
    );
  }
}
