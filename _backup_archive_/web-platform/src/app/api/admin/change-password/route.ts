import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { requireAuth } from "@/lib/auth/session";
import { passwordChangeSchema } from "@/lib/validation/schemas";
import { compare, hash } from "bcryptjs";
import { logSecurityAction } from "@/lib/auth/user-security";
import { getClientIp } from "@/lib/security/utils";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in to change your password." } },
      { status: 401 }
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

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      { status: 400 }
    );
  }

  const { oldPassword, newPassword, confirmNewPassword } = parsed.data;

  if (newPassword !== confirmNewPassword) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "New passwords do not match." } },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const userObjectId = new ObjectId(session.user.id);
    const user = await db.collection(COLLECTIONS.users).findOne({ _id: userObjectId });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 }
      );
    }

    // Verify old password
    const valid = await compare(oldPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Current password is incorrect." } },
        { status: 400 }
      );
    }

    // Hash and update new password
    const newPasswordHash = await hash(newPassword, 12);
    await db.collection(COLLECTIONS.users).updateOne(
      { _id: userObjectId },
      {
        $set: {
          passwordHash: newPasswordHash,
          requiresPasswordChange: false,
          updatedAt: new Date(),
        },
      }
    );

    // Log action to audit logs
    await logSecurityAction(
      session.user.id,
      "user.passwordChange",
      "user",
      session.user.id,
      ip,
      { forcedChange: !!user.requiresPasswordChange }
    );

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update password." } },
      { status: 500 }
    );
  }
}
