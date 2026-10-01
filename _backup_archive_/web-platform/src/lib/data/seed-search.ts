import { readFileSync } from "fs";
import { join } from "path";
import type { SearchEntityType, SearchResult } from "@/types";

function loadData<T>(filename: string): T {
  return JSON.parse(
    readFileSync(join(process.cwd(), "../data", filename), "utf-8")
  ) as T;
}

function matchesQuery(text: string | undefined | null, query: string): boolean {
  if (!text) return false;
  return String(text).toLowerCase().includes(query.toLowerCase());
}

export function searchSeedData(
  query: unknown,
  type: SearchEntityType = "all",
  limit = 20
): SearchResult[] {
  const q = String(query ?? "").trim();
  if (q.length < 1) return [];
  query = q;
  const results: SearchResult[] = [];

  if (type === "all" || type === "faculty") {
    const facultyData = loadData<
      Array<{
        id: string;
        name: string;
        department: string;
        specialization?: string;
        room: string;
        floor: number;
        position: { x: number; y: number; z: number };
        status?: string;
      }>
    >("faculty.json");

    for (const f of facultyData) {
      if (
        matchesQuery(f.name, query as string) ||
        matchesQuery(f.department, query as string) ||
        matchesQuery(f.specialization ?? "", query as string) ||
        matchesQuery(f.room, query as string)
      ) {
        results.push({
          id: f.id,
          type: "faculty",
          title: f.name,
          subtitle: [f.department, f.room, `Floor ${f.floor}`].join(" · "),
          department: f.department,
          roomNumber: f.room,
          floor: f.floor,
          position: f.position,
          status: (f.status as "available") ?? "available",
        });
      }
    }
  }

  if (type === "all" || type === "room" || type === "lab" || type === "office") {
    const roomsData = loadData<
      Array<{
        roomNumber: string;
        meshName?: string;
        name?: string;
        roomType: string;
        floor: number;
        position: { x: number; y: number; z: number };
      }>
    >("rooms.json");

    for (const r of roomsData) {
      const isLab = r.roomType === "lab";
      const isOffice = r.roomType === "office";
      if (type === "lab" && !isLab) continue;
      if (type === "office" && !isOffice) continue;

      if (matchesQuery(r.name ?? "", query as string) || matchesQuery(r.roomNumber, query as string)) {
        const resultType = isLab ? "lab" : isOffice ? "office" : "room";
        results.push({
          id: r.roomNumber,
          type: resultType,
          title: r.name ?? `Room ${r.roomNumber}`,
          subtitle: `${r.roomType} · Floor ${r.floor}`,
          roomNumber: r.roomNumber,
          floor: r.floor,
          position: r.position,
          meshNames: r.meshName ? [r.meshName] : undefined,
          roomType: r.roomType as "classroom",
        });
      }
    }
  }

  if (type === "all" || type === "department") {
    const departmentsData = loadData<
      Array<{
        slug: string;
        name: string;
        shortName?: string;
        floor?: number;
        position?: { x: number; y: number; z: number };
        color?: string;
      }>
    >("departments.json");

    for (const d of departmentsData) {
      if (matchesQuery(d.name, query as string)) {
        results.push({
          id: d.slug,
          type: "department",
          title: d.name,
          subtitle: d.shortName ?? "Department",
          department: d.name,
          floor: d.floor,
          position: d.position,
          color: d.color,
        });
      }
    }
  }

  return results.slice(0, limit);
}
