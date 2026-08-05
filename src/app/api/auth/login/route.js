import { login } from "../../../../services/auth.service.js";
import { loginSchema } from "../../../../validations/auth.validation.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);
    const result = await login(data);
    return Response.json({
      success: true,
      message: "User loginned Successfully",
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 401 });
  }
}
