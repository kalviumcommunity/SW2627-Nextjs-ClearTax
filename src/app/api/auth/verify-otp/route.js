import { verifyOTP } from "../../../../services/auth.service.js";

export async function POST(request) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return Response.json({ success: false, message: "Email and verification code (OTP) are required" }, { status: 400 });
    }
    await verifyOTP(email, otp);
    return Response.json({ success: true, message: "Verification code verified successfully" });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
