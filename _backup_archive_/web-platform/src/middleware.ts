import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We match /admin, /api/admin, and we also need to allow /reset-password if requiresPasswordChange is active
  // Wait, /reset-password is not under /admin, but we want to intercept requests globally if they require password change!
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 1. Force password change check
  // If authenticated and requires password change, restrict them only to /reset-password, /login, or NextAuth API endpoints
  if (token && token.requiresPasswordChange) {
    const isResetPage = pathname === "/reset-password";
    const isAuthApi = pathname.startsWith("/api/auth");
    const isSignOutApi = pathname === "/api/admin/change-password"; // allow the password change api itself!

    if (!isResetPage && !isAuthApi && !isSignOutApi) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: { code: "FORCE_PASSWORD_CHANGE", message: "Password change is required on first login." } },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/reset-password", request.url));
    }
  }

  // 2. Standard Admin Route Protection
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated." } },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = token.role as string;
  
  // Guard admin routes (must be superadmin or subadmin)
  if (!["superadmin", "subadmin"].includes(role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Insufficient permissions." } },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Sub Admin Restrictions
  // Sub Admin is blocked from: Import/Export, User Management, Navigation settings
  const isSuperAdminOnlyPath = 
    pathname.startsWith("/admin/import") || 
    pathname.startsWith("/api/admin/import") ||
    pathname.startsWith("/api/admin/export") ||
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/api/admin/users") ||
    pathname.startsWith("/admin/navigation");

  if (role === "subadmin" && isSuperAdminOnlyPath) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Super Admin privileges required." } },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Let middleware run on all administrative routes, plus reset-password to handle redirects properly
  matcher: ["/admin/:path*", "/api/admin/:path*", "/reset-password"],
};
