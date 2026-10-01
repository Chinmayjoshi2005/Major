import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { escapeRegex } from "@/lib/security/utils";
import type { SearchEntityType, SearchResult } from "@/types";
import { CABIN_TO_MESH, ROOM_MESH_MAP } from "@/lib/campus/room-mesh-map";

type SearchOptions = {
  query: string;
  type?: SearchEntityType;
  limit?: number;
};

export class SearchService {
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, type = "all", limit = 20 } = options;

    try {
      const db = await getDb();
      const regex = new RegExp(escapeRegex(query), "i");
      const results: SearchResult[] = [];

      if (type === "all" || type === "faculty") {
        const faculty = await db
          .collection(COLLECTIONS.faculty)
          .find({
            $or: [
              { name: regex },
              { department: regex },
              { specialization: regex },
              { roomNumber: regex },
            ],
          })
          .limit(limit)
          .toArray();

        for (const f of faculty) {
          const meshNames = f.roomNumber
            ? (CABIN_TO_MESH[f.roomNumber] ?? ROOM_MESH_MAP[f.roomNumber])
            : undefined;

          results.push({
            id: f._id.toString(),
            type: "faculty",
            title: f.name,
            subtitle: [
              f.department,
              f.roomNumber,
              f.floor != null ? `Floor ${f.floor}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            department: f.department,
            roomNumber: f.roomNumber,
            floor: f.floor,
            position: f.position,
            meshNames: meshNames ? [meshNames] : undefined,
            status: f.status,
          });
        }
      }

      if (
        type === "all" ||
        type === "room" ||
        type === "lab" ||
        type === "office"
      ) {
        const roomFilter: Record<string, unknown> = {
          $or: [{ roomNumber: regex }, { name: regex }],
          isActive: true,
        };

        if (type === "lab") roomFilter.roomType = "lab";
        if (type === "office") roomFilter.roomType = "office";

        const rooms = await db
          .collection(COLLECTIONS.rooms)
          .find(roomFilter)
          .limit(limit)
          .toArray();

        for (const r of rooms) {
          const resultType =
            r.roomType === "lab"
              ? "lab"
              : r.roomType === "office"
                ? "office"
                : "room";

          if (type !== "all" && type !== resultType && type !== "room")
            continue;

          results.push({
            id: r._id.toString(),
            type: resultType as "room" | "lab" | "office",
            title: r.name || `Room ${r.roomNumber}`,
            subtitle: `${r.roomType} · Floor ${r.floor ?? 0}`,
            roomNumber: r.roomNumber,
            floor: r.floor,
            position: r.position,
            meshNames: r.meshName ? [r.meshName] : undefined,
            roomType: r.roomType,
          });
        }
      }

      if (type === "all" || type === "department") {
        const departments = await db
          .collection(COLLECTIONS.departments)
          .find({ name: regex })
          .limit(limit)
          .toArray();

        for (const d of departments) {
          results.push({
            id: d._id.toString(),
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

      return results.slice(0, limit);
    } catch {
      const { searchSeedData } = await import("@/lib/data/seed-search");
      return searchSeedData(query, type, limit);
    }
  }
}

export const searchService = new SearchService();
