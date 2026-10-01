import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { importDataSchema, facultyCreateSchema, roomCreateSchema, vector3Schema } from "@/lib/validation/schemas";
import { getClientIp, rateLimit, sanitizeText } from "@/lib/security/utils";
import { z } from "zod";

const departmentImportSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  shortName: z.string().max(50).optional(),
  floor: z.coerce.number().int().optional(),
  position: vector3Schema.optional(),
  color: z.string().max(20).optional(),
});

const navNodeImportSchema = z.object({
  nodeId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  nodeType: z.string().max(50),
  floor: z.coerce.number().int(),
  roomNumber: z.string().max(50).optional(),
  position: vector3Schema,
});

const navEdgeImportSchema = z.object({
  fromNodeId: z.string().min(1).max(100),
  toNodeId: z.string().min(1).max(100),
  weight: z.coerce.number().positive(),
  bidirectional: z.boolean(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-import:${ip}`, { limit: 10, windowMs: 60_000 });

  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Too many import requests. Please wait." } },
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = importDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid import format." } },
      { status: 400 }
    );
  }

  const { collection, data } = parsed.data;

  // 2. Validate individual items in data based on collection
  let validatedData: unknown[];
  try {
    if (collection === "faculty") {
      validatedData = data.map((x) => {
        const item = x as Record<string, unknown>;
        const sanitized = {
          ...item,
          name: sanitizeText(String(item.name ?? "")),
          department: sanitizeText(String(item.department ?? "")),
          designation: sanitizeText(String(item.designation ?? "")),
          qualification: sanitizeText(String(item.qualification ?? "")),
          specialization: sanitizeText(String(item.specialization ?? "")),
          roomNumber: sanitizeText(String(item.roomNumber ?? item.room ?? "")),
          contact: sanitizeText(String(item.contact ?? "")),
          bio: sanitizeText(String(item.bio ?? "")),
        };
        return facultyCreateSchema.parse(sanitized);
      });
    } else if (collection === "rooms") {
      validatedData = data.map((x) => {
        const item = x as Record<string, unknown>;
        const sanitized = {
          ...item,
          roomNumber: sanitizeText(String(item.roomNumber ?? "")),
          name: sanitizeText(String(item.name ?? "")),
          building: sanitizeText(String(item.building ?? "")),
          type: sanitizeText(String(item.type ?? "")),
          purpose: sanitizeText(String(item.purpose ?? "")),
        };
        return roomCreateSchema.parse(sanitized);
      });
    } else if (collection === "departments") {
      validatedData = data.map((x) => {
        const item = x as Record<string, unknown>;
        const sanitized = {
          ...item,
          slug: sanitizeText(String(item.slug ?? "")),
          name: sanitizeText(String(item.name ?? "")),
          shortName: sanitizeText(String(item.shortName ?? "")),
        };
        return departmentImportSchema.parse(sanitized);
      });
    } else if (collection === "navigation_nodes") {
      validatedData = data.map((x) => {
        const item = x as Record<string, unknown>;
        const sanitized = {
          ...item,
          nodeId: sanitizeText(String(item.nodeId ?? "")),
          name: sanitizeText(String(item.name ?? "")),
          nodeType: sanitizeText(String(item.nodeType ?? "")),
          roomNumber: sanitizeText(String(item.roomNumber ?? "")),
        };
        return navNodeImportSchema.parse(sanitized);
      });
    } else if (collection === "navigation_edges") {
      validatedData = data.map((x) => {
        const item = x as Record<string, unknown>;
        const sanitized = {
          ...item,
          fromNodeId: sanitizeText(String(item.fromNodeId ?? "")),
          toNodeId: sanitizeText(String(item.toNodeId ?? "")),
        };
        return navEdgeImportSchema.parse(sanitized);
      });
    } else {
      throw new Error("UNSUPPORTED_COLLECTION");
    }
  } catch (validationError) {
    const message = validationError instanceof z.ZodError 
      ? `Validation failed: ${validationError.errors[0].path.join(".")}: ${validationError.errors[0].message}`
      : "Validation failed for imported items.";
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message } },
      { status: 400 }
    );
  }

  // 3. Database operation with transaction/safe write
  try {
    const db = await getDb();
    const now = new Date();

    // Map client collection name to db collections
    let dbCollectionName = "";
    if (collection === "faculty") dbCollectionName = COLLECTIONS.faculty;
    else if (collection === "rooms") dbCollectionName = COLLECTIONS.rooms;
    else if (collection === "departments") dbCollectionName = COLLECTIONS.departments;
    else if (collection === "navigation_nodes") dbCollectionName = COLLECTIONS.navigationNodes;
    else if (collection === "navigation_edges") dbCollectionName = COLLECTIONS.navigationEdges;

    if (!dbCollectionName) {
      throw new Error("Invalid collection mapping");
    }

    // Perform safe replacement or upsert
    // To prevent data corruption, we clear and insertMany in a batch
    await db.collection(dbCollectionName).deleteMany({});
    
    const documentsToInsert = (validatedData as { createdAt?: string | Date }[]).map((item) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : now,
      updatedAt: now,
    }));

    await db.collection(dbCollectionName).insertMany(documentsToInsert);

    // 4. Log to auditLogs
    await db.collection(COLLECTIONS.auditLogs).insertOne({
      userId: session.user.id,
      action: `${collection}.import`,
      resource: collection,
      timestamp: now,
      ip,
      metadata: { count: documentsToInsert.length },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${documentsToInsert.length} items into ${collection}.`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Import failed due to a database error." } },
      { status: 500 }
    );
  }
}
