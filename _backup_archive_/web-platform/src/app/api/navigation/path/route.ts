import { NextResponse } from "next/server";
import { navigationPathSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/security/utils";
import { navigationService } from "@/services/navigation.service";
import type { ApiResponse, NavigationRoute } from "@/types";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`nav:${ip}`, { limit: 30, windowMs: 60_000 });

  if (!limit.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many navigation requests." },
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." },
      },
      { status: 400 }
    );
  }

  const parsed = navigationPathSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid navigation request." },
      },
      { status: 400 }
    );
  }

  try {
    const route = await navigationService.generatePath(
      parsed.data.from,
      parsed.data.to
    );
    return NextResponse.json<ApiResponse<NavigationRoute>>({
      success: true,
      data: route,
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Path generation failed." },
      },
      { status: 500 }
    );
  }
}
