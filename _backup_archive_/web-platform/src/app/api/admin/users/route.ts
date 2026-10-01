import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { subAdminSchema } from "@/lib/validation/schemas";
import { hash } from "bcryptjs";
import { logSecurityAction } from "@/lib/auth/user-security";
import { getClientIp, sanitizeText } from "@/lib/security/utils";
import { ObjectId } from "mongodb";

// GET: List all Sub Admins and recent Audit Logs
export async function GET(request: Request) {
  const _ip = getClientIp(request);
  
  let _session;
  try {
    _session = await requireRole("superadmin");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "UNAUTHORIZED";
    return NextResponse.json(
      { success: false, error: { code: errorMsg, message: "Super Admin authorization required." } },
      { status: errorMsg === "FORBIDDEN" ? 403 : 401 }
    );
  }

  try {
    const db = await getDb();

    // Fetch administrative users (superadmin and subadmin)
    const users = await db
      .collection(COLLECTIONS.users)
      .find({ role: { $in: ["superadmin", "subadmin"] } })
      .project({ passwordHash: 0 }) // safety: never expose password hashes
      .sort({ role: 1, email: 1 })
      .toArray();

    // Fetch recent audit logs (last 50 logs)
    const auditLogs = await db
      .collection(COLLECTIONS.auditLogs)
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        users: users.map(u => ({ ...u, id: u._id.toString() })),
        auditLogs: auditLogs.map(l => ({ ...l, id: l._id.toString() })),
      },
    });
  } catch (error) {
    console.error("List users/logs error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch accounts and logs." } },
      { status: 500 }
    );
  }
}

// POST: Create a new Sub Admin
export async function POST(request: Request) {
  const ip = getClientIp(request);

  let session;
  try {
    session = await requireRole("superadmin");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "UNAUTHORIZED";
    return NextResponse.json(
      { success: false, error: { code: errorMsg, message: "Super Admin authorization required." } },
      { status: errorMsg === "FORBIDDEN" ? 403 : 401 }
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

  const parsed = subAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      { status: 400 }
    );
  }

  const { name, email, password, permissions, status } = parsed.data;
  const sanitizedName = sanitizeText(name);
  const normalizedEmail = sanitizeText(email).trim().toLowerCase();

  if (!password) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Password is required to create a new account." } },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    
    // Check if user exists
    const existing = await db.collection(COLLECTIONS.users).findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_EXISTS", message: "An account with this email already exists." } },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);
    const now = new Date();

    const newSubAdmin = {
      name: sanitizedName,
      email: normalizedEmail,
      passwordHash,
      role: "subadmin",
      status,
      permissions,
      requiresPasswordChange: false,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      emailVerified: now, // Pre-verified since it is admin-created
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTIONS.users).insertOne(newSubAdmin);
    const newId = result.insertedId.toString();

    // Log action to audit logs
    await logSecurityAction(
      session.user.id,
      "user.create",
      "user",
      newId,
      ip,
      { email: normalizedEmail, role: "subadmin", permissions }
    );

    return NextResponse.json({
      success: true,
      message: `Sub Admin ${name} created successfully.`,
      data: { id: newId, name, email: normalizedEmail, role: "subadmin", status, permissions },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create Sub Admin account." } },
      { status: 500 }
    );
  }
}

// PUT: Modify Sub Admin status, permissions, or details
export async function PUT(request: Request) {
  const ip = getClientIp(request);

  let session;
  try {
    session = await requireRole("superadmin");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "UNAUTHORIZED";
    return NextResponse.json(
      { success: false, error: { code: errorMsg, message: "Super Admin authorization required." } },
      { status: errorMsg === "FORBIDDEN" ? 403 : 401 }
    );
  }

  let body: { id?: string } & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const { id, ...rest } = body;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "A valid user ID is required." } },
      { status: 400 }
    );
  }

  const parsed = subAdminSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.errors[0].message } },
      { status: 400 }
    );
  }

  const { name, email, password, permissions, status } = parsed.data;
  const sanitizedName = sanitizeText(name);
  const normalizedEmail = sanitizeText(email).trim().toLowerCase();

  try {
    const db = await getDb();
    
    // Find target user
    const userObjectId = new ObjectId(id);
    const existing = await db.collection(COLLECTIONS.users).findOne({ _id: userObjectId });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Account not found." } },
        { status: 404 }
      );
    }

    // Prevent modifying other superadmins unless you are self or own system
    if (existing.role === "superadmin" && existing._id.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot modify other Super Admin accounts." } },
        { status: 403 }
      );
    }

    const updates: Record<string, unknown> = {
      name: sanitizedName,
      email: normalizedEmail,
      status,
      permissions,
      updatedAt: new Date(),
    };

    if (password && password.trim() !== "") {
      updates.passwordHash = await hash(password, 12);
      // If updating another user's password, we can choose to reset lockout/failed attempts
      updates.failedLoginAttempts = 0;
      updates.lockoutUntil = null;
    }

    await db.collection(COLLECTIONS.users).updateOne({ _id: userObjectId }, { $set: updates });

    // Log updates
    await logSecurityAction(
      session.user.id,
      "user.update",
      "user",
      id,
      ip,
      {
        email: normalizedEmail,
        statusChanged: existing.status !== status,
        permissionsChanged: JSON.stringify(existing.permissions) !== JSON.stringify(permissions),
      }
    );

    return NextResponse.json({
      success: true,
      message: `Account for ${name} updated successfully.`,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update account." } },
      { status: 500 }
    );
  }
}

// DELETE: Delete a Sub Admin account
export async function DELETE(request: Request) {
  const ip = getClientIp(request);

  let session;
  try {
    session = await requireRole("superadmin");
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "UNAUTHORIZED";
    return NextResponse.json(
      { success: false, error: { code: errorMsg, message: "Super Admin authorization required." } },
      { status: errorMsg === "FORBIDDEN" ? 403 : 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "A valid user ID is required." } },
      { status: 400 }
    );
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You cannot delete your own account." } },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const userObjectId = new ObjectId(id);
    const existing = await db.collection(COLLECTIONS.users).findOne({ _id: userObjectId });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Account not found." } },
        { status: 404 }
      );
    }

    if (existing.role === "superadmin") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Super Admin accounts cannot be deleted." } },
        { status: 403 }
      );
    }

    await db.collection(COLLECTIONS.users).deleteOne({ _id: userObjectId });

    // Log deletion
    await logSecurityAction(
      session.user.id,
      "user.delete",
      "user",
      id,
      ip,
      { email: existing.email }
    );

    return NextResponse.json({
      success: true,
      message: `Account ${existing.name} has been deleted.`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete account." } },
      { status: 500 }
    );
  }
}
