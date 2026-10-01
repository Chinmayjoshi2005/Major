import { getServerSession } from "next-auth";
import { authOptions, hasRole } from "./auth.config";
import type { UserRole } from "@/types";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireAuth();
  if (!hasRole(session.user.role, role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
