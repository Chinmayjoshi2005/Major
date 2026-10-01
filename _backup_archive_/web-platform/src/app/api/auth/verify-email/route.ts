import { NextRequest, NextResponse } from "next/server";
import { verifyEmailByToken } from "@/lib/auth/user-security";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=false", request.url));
  }

  const success = await verifyEmailByToken(token);
  if (success) {
    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } else {
    return NextResponse.redirect(new URL("/login?verified=false", request.url));
  }
}
