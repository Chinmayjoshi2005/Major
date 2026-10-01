import { type NextAuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { loginSchema } from "@/lib/validation/schemas";
import type { UserRole } from "@/types";

import { checkLockout, handleFailedLogin, resetFailedLoginAttempts } from "./user-security";

import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // set default maxAge to 30 days, we'll enforce dynamic session timeout in jwt/session callbacks
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-google-client-secret",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();

        // 1. Check lockout status first
        const lockoutStatus = await checkLockout(email);
        if (lockoutStatus.locked) {
          throw new Error("ACCOUNT_LOCKED");
        }

        const db = await getDb();
        const user = await db.collection(COLLECTIONS.users).findOne({
          email,
        });

        if (!user || !user.passwordHash) {
          throw new Error("INVALID_CREDENTIALS");
        }

        // 2. Check user account status (suspended / active)
        if (user.status === "suspended") {
          throw new Error("ACCOUNT_SUSPENDED");
        }

        // 3. Validate password
        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          const failed = await handleFailedLogin(email);
          if (failed.locked) {
            throw new Error("ACCOUNT_LOCKED");
          }
          throw new Error("INVALID_CREDENTIALS");
        }

        // 4. Check email verification (only for non-superadmins, or for all)
        if (user.role !== "superadmin" && !user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        // 5. Success - reset failed attempts
        await resetFailedLoginAttempts(email);

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          image: user.image,
          requiresPasswordChange: !!user.requiresPasswordChange,
          rememberMe: credentials?.rememberMe === "true" ? "true" : "false",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const db = await getDb();
        const existing = await db.collection(COLLECTIONS.users).findOne({
          email: user.email?.trim().toLowerCase(),
        });
        
        if (existing) {
          if (existing.status === "suspended") {
            throw new Error("ACCOUNT_SUSPENDED");
          }
          user.id = existing._id.toString();
          user.role = existing.role as UserRole;
          user.requiresPasswordChange = !!existing.requiresPasswordChange;
        } else {
          // Auto-create student user for Google sign-in
          const now = new Date();
          const newUser = {
            name: user.name || "Google User",
            email: user.email?.trim().toLowerCase(),
            role: "student",
            status: "active",
            emailVerified: now,
            requiresPasswordChange: false,
            createdAt: now,
            updatedAt: now,
          };
          const res = await db.collection(COLLECTIONS.users).insertOne(newUser);
          user.id = res.insertedId.toString();
          user.role = "student";
          user.requiresPasswordChange = false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: UserRole }).role;
        token.id = user.id;
        token.requiresPasswordChange = user.requiresPasswordChange;
        // Expire token in 2 hours if rememberMe is false, otherwise 30 days
        token.maxAge = (user as { rememberMe?: string }).rememberMe === "true" ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
        token.iatTime = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    async session({ session, token }) {
      // Dynamic Session Expiration check (enforcing rememberMe)
      const iat = (token.iatTime as number) || (token.iat as number);
      const maxAge = (token.maxAge as number) || 24 * 60 * 60;
      if (Date.now() / 1000 > iat + maxAge) {
        // Force session expire
        return {
          ...session,
          user: undefined as unknown as Session["user"],
          expires: new Date(0).toISOString(),
        };
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.requiresPasswordChange = !!token.requiresPasswordChange;
      }
      return session;
    },
  },
};

export function hasRole(
  userRole: UserRole | undefined,
  required: UserRole | UserRole[]
): boolean {
  if (!userRole) return false;
  const roles = Array.isArray(required) ? required : [required];
  if (userRole === "superadmin") return true;
  return roles.includes(userRole);
}
