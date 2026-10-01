import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export interface UserSecurityFields {
  failedLoginAttempts?: number;
  lockoutUntil?: Date | null;
  emailVerified?: Date | null;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
}

export async function checkLockout(email: string): Promise<{ locked: boolean; remainingMs: number }> {
  const db = await getDb();
  const user = await db.collection(COLLECTIONS.users).findOne({ email: email.trim().toLowerCase() });
  
  if (!user || !user.lockoutUntil) {
    return { locked: false, remainingMs: 0 };
  }

  const now = Date.now();
  const lockoutUntilTime = new Date(user.lockoutUntil).getTime();

  if (now < lockoutUntilTime) {
    return { locked: true, remainingMs: lockoutUntilTime - now };
  }

  // Lockout expired, clean it up
  await db.collection(COLLECTIONS.users).updateOne(
    { _id: user._id },
    { $set: { lockoutUntil: null, failedLoginAttempts: 0 } }
  );

  return { locked: false, remainingMs: 0 };
}

export async function handleFailedLogin(email: string): Promise<{ attempts: number; locked: boolean }> {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.collection(COLLECTIONS.users).findOne({ email: normalizedEmail });

  if (!user) {
    return { attempts: 0, locked: false };
  }

  const currentAttempts = (user.failedLoginAttempts || 0) + 1;
  const updates: Partial<UserSecurityFields> & { updatedAt: Date } = {
    failedLoginAttempts: currentAttempts,
    updatedAt: new Date(),
  };

  let locked = false;
  if (currentAttempts >= LOCKOUT_ATTEMPTS) {
    updates.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    locked = true;
  }

  await db.collection(COLLECTIONS.users).updateOne({ _id: user._id }, { $set: updates });
  return { attempts: currentAttempts, locked };
}

export async function resetFailedLoginAttempts(email: string): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTIONS.users).updateOne(
    { email: email.trim().toLowerCase() },
    { $set: { failedLoginAttempts: 0, lockoutUntil: null, updatedAt: new Date() } }
  );
}

export async function generateVerificationToken(email: string): Promise<string> {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await db.collection(COLLECTIONS.users).updateOne(
    { email: email.trim().toLowerCase() },
    {
      $set: {
        verificationToken: token,
        verificationTokenExpires: expires,
        updatedAt: new Date(),
      },
    }
  );

  return token;
}

export async function verifyEmailByToken(token: string): Promise<boolean> {
  const db = await getDb();
  const user = await db.collection(COLLECTIONS.users).findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return false;
  }

  await db.collection(COLLECTIONS.users).updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
        updatedAt: new Date(),
      },
    }
  );

  return true;
}

export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.collection(COLLECTIONS.users).findOne({ email: normalizedEmail });

  if (!user) {
    return null;
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await db.collection(COLLECTIONS.users).updateOne(
    { _id: user._id },
    {
      $set: {
        resetToken: token,
        resetTokenExpires: expires,
        updatedAt: new Date(),
      },
    }
  );

  return token;
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const db = await getDb();
  const user = await db.collection(COLLECTIONS.users).findOne({
    resetToken: token,
    resetTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return false;
  }

  const passwordHash = await hash(newPassword, 12);

  await db.collection(COLLECTIONS.users).updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        updatedAt: new Date(),
      },
    }
  );

  return true;
}

export async function sendMockEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  console.log("-----------------------------------------");
  console.log(`📧 MOCK EMAIL SENT`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body (approx HTML):`);
  console.log(htmlContent.replace(/<[^>]*>/g, " ").trim());
  console.log("-----------------------------------------");
}

export async function changeUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(userId)) return false;

  await db.collection(COLLECTIONS.users).updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        passwordHash: newPasswordHash,
        requiresPasswordChange: false,
        updatedAt: new Date(),
      },
    }
  );
  return true;
}

export async function logSecurityAction(
  userId: string,
  action: string,
  resource: string,
  targetId: string | null,
  ip: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const db = await getDb();
  await db.collection(COLLECTIONS.auditLogs).insertOne({
    userId,
    action,
    resource,
    targetId,
    timestamp: new Date(),
    ip,
    metadata,
  });
}
