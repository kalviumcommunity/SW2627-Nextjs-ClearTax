import { otpStore } from "../../../../services/auth.service.js";

export async function GET(request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const storedData = otpStore.get(email);

  if (!storedData) {
    return Response.json({ success: false, message: "No OTP found" }, { status: 404 });
  }

  return Response.json({ success: true, otp: storedData.otp });
}
