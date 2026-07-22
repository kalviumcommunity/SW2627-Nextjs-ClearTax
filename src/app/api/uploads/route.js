import { NextResponse } from "next/server";
import { verifyToken } from "@/middleware/auth.middleware";
import uploadService from "@/services/upload.service";

/**
 * GET /api/uploads
 * Retrieves a paginated list of upload batches for the logged-in user.
 * Supports sorting, search by filename, and status filtering.
 */
export async function GET(request) {
  try {
    // 1. Authenticate user session
    const decoded = await verifyToken(request);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // 3. Retrieve paginated list from service
    const result = await uploadService.getUploadsPaged({
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      search,
      userId: decoded.id,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    console.error("GET Uploads List Error:", error);
    
    let status = 500;
    if (error.message === "Invalid Token" || error.message === "Authorization header missing") {
      status = 401;
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to retrieve uploads list",
      },
      { status }
    );
  }
}
