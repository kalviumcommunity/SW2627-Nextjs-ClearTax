import { signup } from "../../../../services/auth.service.js";
import { signupSchema } from "../../../../validations/auth.validation.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const data = signupSchema.parse(body);
    const user = await signup(data);
    return Response.json(
      {
        success: true,
        message: "User registered Successfully",
        user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
