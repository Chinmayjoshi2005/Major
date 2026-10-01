import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { registerSchema } from "@/lib/validation/schemas";
import { hash } from "bcryptjs";
import { generateVerificationToken, sendMockEmail } from "@/lib/auth/user-security";
import { rateLimit, getClientIp } from "@/lib/security/utils";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 });

  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many registration attempts. Please try again later." } },
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid registration details." } },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.collection(COLLECTIONS.users).findOne({ email: normalizedEmail });
    if (existingUser) {
      // Return a generic success or a generic error to prevent email harvesting.
      // But for registration, it's normal to say email already in use.
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_EXISTS", message: "An account with this email already exists." } },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);
    const now = new Date();

    const newUser = {
      name,
      email: normalizedEmail,
      passwordHash,
      role: "student", // default role, preventing privilege escalation
      failedLoginAttempts: 0,
      lockoutUntil: null,
      emailVerified: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.users).insertOne(newUser);

    // Generate email verification token
    const token = await generateVerificationToken(normalizedEmail);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    await sendMockEmail(
      normalizedEmail,
      "Verify your Campus Guide 3D Account",
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Welcome to Campus Guide 3D, ${name}!</h2>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background-color: #ffe600; color: #0a0a0a; border: 3px solid #0a0a0a; padding: 12px 24px; font-weight: bold; text-decoration: none; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>This verification link will expire in 1 hour.</p>
      </div>`
    );

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Registration failed due to an internal error." } },
      { status: 500 }
    );
  }
}
