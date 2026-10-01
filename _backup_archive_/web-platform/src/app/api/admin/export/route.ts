import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/security/utils";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-export:${ip}`, { limit: 10, windowMs: 60_000 });

  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many export requests. Please wait." } },
      { status: 429 }
    );
  }

  // 1. Authorize via Server Session (Backend guard)
  let session;
  try {
    session = await requireRole(["admin", "superadmin"]);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "UNAUTHORIZED";
    return NextResponse.json(
      { success: false, error: { code: errorMsg, message: "Unauthorized access." } },
      { status: errorMsg === "FORBIDDEN" ? 403 : 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection");

  const validCollections = ["faculty", "rooms", "departments", "navigation_nodes", "navigation_edges"];
  if (!collection || !validCollections.includes(collection)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid or missing collection parameter." } },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    let dbCollectionName = "";

    if (collection === "faculty") dbCollectionName = COLLECTIONS.faculty;
    else if (collection === "rooms") dbCollectionName = COLLECTIONS.rooms;
    else if (collection === "departments") dbCollectionName = COLLECTIONS.departments;
    else if (collection === "navigation_nodes") dbCollectionName = COLLECTIONS.navigationNodes;
    else if (collection === "navigation_edges") dbCollectionName = COLLECTIONS.navigationEdges;

    const data = await db.collection(dbCollectionName).find({}).toArray();

    // Map data to omit internal MongoDB fields if necessary, or just format them nicely
    const cleanData = data.map((doc) => {
      const { _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = doc;
      return rest; // omit internal fields to match standard seed format
    });

    // 2. Log to auditLogs
    await db.collection(COLLECTIONS.auditLogs).insertOne({
      userId: session.user.id,
      action: `${collection}.export`,
      resource: collection,
      timestamp: new Date(),
      ip,
      metadata: { count: cleanData.length },
    });

    // Return as downloadable attachment
    return new NextResponse(JSON.stringify(cleanData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${collection}-export.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Export failed due to a database error." } },
      { status: 500 }
    );
  }
}
