import { NextResponse } from "next/server";
import { searchQuerySchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/security/utils";
import { searchService } from "@/services/search.service";
import type { ApiResponse, SearchEntityType, SearchResult } from "@/types";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`search:${ip}`, { limit: 60, windowMs: 60_000 });

  if (!limit.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many search requests." },
      },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? "all",
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid search query." },
      },
      { status: 400 }
    );
  }

  try {
    const { q, type, limit } = parsed.data as {
      q: string;
      type: string;
      limit: number;
    };
    const results = await searchService.search({
      query: q,
      type: type as SearchEntityType,
      limit,
    });
    return NextResponse.json<
      ApiResponse<{ results: SearchResult[]; total: number }>
    >({
      success: true,
      data: { results, total: results.length },
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Search failed." },
      },
      { status: 500 }
    );
  }
}
