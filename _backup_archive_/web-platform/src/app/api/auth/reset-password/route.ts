import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { resetPasswordWithToken } from "@/lib/auth/user-security";
import { rateLimit, getClientIp } from "@/lib/security/utils";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`reset-pass:${ip}`, { limit: 5, windowMs: 60_000 });

  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request data. Password must be at least 8 characters." } },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  try {
    const success = await resetPasswordWithToken(token, password);
    if (!success) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_TOKEN", message: "The password reset token is invalid or has expired." } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Reset failed due to an internal error." } },
      { status: 500 }
    );
  }
}
