import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { generatePasswordResetToken, sendMockEmail } from "@/lib/auth/user-security";
import { rateLimit, getClientIp } from "@/lib/security/utils";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`forgot-pass:${ip}`, { limit: 3, windowMs: 60_000 });

  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many forgot password requests. Please try again later." } },
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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid email address." } },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const token = await generatePasswordResetToken(normalizedEmail);

    // If the token is generated (user exists), send the email.
    // If not, we still return a generic success message to prevent email harvesting.
    if (token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      await sendMockEmail(
        normalizedEmail,
        "Reset your Campus Guide 3D Password",
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #ffe600; color: #0a0a0a; border: 3px solid #0a0a0a; padding: 12px 24px; font-weight: bold; text-decoration: none; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>If you did not make this request, you can safely ignore this email.</p>
          <p>This password reset link will expire in 1 hour.</p>
        </div>`
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Request failed due to an internal error." } },
      { status: 500 }
    );
  }
}
