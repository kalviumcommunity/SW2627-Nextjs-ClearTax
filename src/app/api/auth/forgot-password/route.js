import { requestPasswordReset } from "@/services/auth.service.js";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.email) {
      return Response.json({ success: false, message: "Email is required" }, { status: 400 });
    }
    await requestPasswordReset(body.email);
    return Response.json({ success: true, message: "Reset code generated and sent to email" });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
