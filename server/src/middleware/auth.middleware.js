import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Standard request validator for JWT authentication.
 */
export async function verifyToken(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET);

    return decoded;
  } catch (err) {
    throw new Error("Invalid Token");
  }
}

/**
 * Express wrapper for mock request headers mapping.
 */
export async function verifyTokenExpress(req) {
  const requestMock = {
    headers: {
      get: (headerName) => req.headers[headerName.toLowerCase()],
    },
  };
  return await verifyToken(requestMock);
}

/**
 * Express middleware to guard routes and verify sessions.
 */
export async function authenticateUser(req, res, next) {
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