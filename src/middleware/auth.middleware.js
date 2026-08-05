import jwt from "jsonwebtoken";

export async function authenticateUser(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) throw new Error("Authorization header missing");

  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Token missing from authorization header");

  return jwt.verify(token, process.env.JWT_SECRET);
}
