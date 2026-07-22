import { NextResponse } from "next/server";
import { verifyToken } from "@/middleware/auth.middleware";
import uploadService from "@/services/upload.service";

/**
 * POST /api/uploads/:id/retry
 * Re-triggers background processing for a failed upload batch or a batch with errors.
 * Resets the batch counts, deletes old invoice records, and adds a new job to BullMQ.
 */
export async function POST(request, { params }) {
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

    // 3. Call service to trigger retry
    const result = await uploadService.retryUploadBatch(parseInt(id));

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST Upload Retry Error:", error);
    
    let status = 500;
    if (error.message === "Invalid Token" || error.message === "Authorization header missing") {
      status = 401;
    } else if (error.message === "Upload batch not found") {
      status = 404;
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to trigger retry processing",
      },
      { status }
    );
  }
}
