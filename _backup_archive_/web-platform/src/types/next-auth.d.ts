import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      requiresPasswordChange?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    requiresPasswordChange?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    requiresPasswordChange?: boolean;
  }
}
