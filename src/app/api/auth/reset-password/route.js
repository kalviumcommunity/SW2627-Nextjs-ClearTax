import { resetPassword } from "../../../../services/auth.service.js";

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();
    if (!email || !otp || !newPassword) {
      return Response.json(
        { success: false, message: "Email, reset code (OTP), and new password are required" },
        { status: 400 }
      );
    }
    await resetPassword(email, otp, newPassword);
    return Response.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
