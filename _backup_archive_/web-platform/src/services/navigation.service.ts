import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type {
  NavigationEdge,
  NavigationNode,
  NavigationRoute,
  NavPoint,
  PathWaypoint,
  Vector3,
} from "@/types";

function distance3d(a: Vector3, b: Vector3): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
}

function dijkstra(
  adjacency: Map<string, Array<{ to: string; weight: number }>>,
  startId: string,
  endId: string
): { path: string[]; distance: number } | null {
  if (startId === endId) return { path: [startId], distance: 0 };

  const distances = new Map<string, number>([[startId, 0]]);
  const predecessors = new Map<string, string | null>([[startId, null]]);
  const queue: Array<{ dist: number; id: string }> = [{ dist: 0, id: startId }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === endId) {
      const path: string[] = [];
      let node: string | null = endId;
      while (node) {
        path.unshift(node);
        node = predecessors.get(node) ?? null;
      }
      return { path, distance: distances.get(endId) ?? 0 };
    }

    for (const { to, weight } of adjacency.get(current.id) ?? []) {
      if (visited.has(to)) continue;
      const newDist = current.dist + weight;
      if (newDist < (distances.get(to) ?? Infinity)) {
        distances.set(to, newDist);
        predecessors.set(to, current.id);
        queue.push({ dist: newDist, id: to });
      }
    }
  }

  return null;
}

export class NavigationService {
  private graphCache: {
    nodes: Map<string, NavigationNode>;
    adjacency: Map<string, Array<{ to: string; weight: number }>>;
    loadedAt: number;
  } | null = null;

  private async loadGraph() {
    const CACHE_TTL = 5 * 60 * 1000;
    if (this.graphCache && Date.now() - this.graphCache.loadedAt < CACHE_TTL) {
      return this.graphCache;
    }

    const db = await getDb();
    const nodesRaw = (await db
      .collection(COLLECTIONS.navigationNodes)
      .find({})
      .toArray()) as unknown as Array<
      NavigationNode & { _id: { toString(): string } }
    >;
    const edgesRaw = (await db
      .collection(COLLECTIONS.navigationEdges)
      .find({})
      .toArray()) as unknown as NavigationEdge[];

    const nodes = new Map<string, NavigationNode>();
    for (const n of nodesRaw) {
      nodes.set(n.nodeId, {
        _id: n._id.toString(),
        nodeId: n.nodeId,
        name: n.name,
        nodeType: n.nodeType,
        floorId: n.floorId?.toString(),
        floor: n.floor,
        roomNumber: n.roomNumber,
        position: n.position,
      });
    }

    const adjacency = new Map<string, Array<{ to: string; weight: number }>>();
    for (const e of edgesRaw as NavigationEdge[]) {
      const fromList = adjacency.get(e.fromNodeId) ?? [];
      fromList.push({ to: e.toNodeId, weight: e.weight });
      adjacency.set(e.fromNodeId, fromList);

      if (e.bidirectional) {
        const toList = adjacency.get(e.toNodeId) ?? [];
        toList.push({ to: e.fromNodeId, weight: e.weight });
        adjacency.set(e.toNodeId, toList);
      }
    }

    this.graphCache = { nodes, adjacency, loadedAt: Date.now() };
    return this.graphCache;
  }

  async findNearestNode(
    position: Vector3,
    floor?: number
  ): Promise<string | null> {
    const { nodes } = await this.loadGraph();
    let nearest: string | null = null;
    let minDist = Infinity;

    for (const [id, node] of nodes) {
      if (floor != null && node.floor != null && node.floor !== floor) continue;
      const dist = distance3d(position, node.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = id;
      }
    }

    return nearest;
  }

  async resolveNodeFromPoint(point: NavPoint): Promise<string | null> {
    const { nodes } = await this.loadGraph();

    if (point.type === "node" && point.nodeId) return point.nodeId;

    if (point.type === "room" && point.roomNumber) {
      for (const [id, node] of nodes) {
        if (node.roomNumber === point.roomNumber) return id;
      }
    }

    if (point.type === "position" && point.x != null) {
      return this.findNearestNode({
        x: point.x,
        y: point.y ?? 0,
        z: point.z ?? 0,
      });
    }

    const facultyId = point.facultyId ?? (point as { id?: string }).id;
    if (point.type === "faculty" && facultyId) {
      const db = await getDb();
      const { ObjectId } = await import("mongodb");
      const query = ObjectId.isValid(facultyId)
        ? { _id: new ObjectId(facultyId) }
        : { slug: facultyId };
      const faculty = await db.collection(COLLECTIONS.faculty).findOne(query);
      if (faculty?.roomNumber) {
        for (const [id, node] of nodes) {
          if (node.roomNumber === faculty.roomNumber) return id;
        }
      }
      if (faculty?.position) {
        return this.findNearestNode(faculty.position, faculty.floor);
      }
    }

    return null;
  }

  async generatePath(from: NavPoint, to: NavPoint): Promise<NavigationRoute> {
    try {
      const { nodes, adjacency } = await this.loadGraph();

      const startId = await this.resolveNodeFromPoint(from);
      const endId = await this.resolveNodeFromPoint(to);

      if (!startId || !endId) {
        return {
          found: false,
          path: [],
          totalDistance: 0,
          estimatedTimeSeconds: 0,
          floorChanges: 0,
          instructions: ["Destination not found in navigation map."],
          error: "One or both locations not found.",
        };
      }

      const result = dijkstra(adjacency, startId, endId);

      if (!result) {
        return {
          found: false,
          path: [],
          totalDistance: 0,
          estimatedTimeSeconds: 0,
          floorChanges: 0,
          instructions: ["No path found between these locations."],
          error: "No navigable path exists.",
        };
      }

      const path: PathWaypoint[] = [];
      let floorChanges = 0;
      let prevFloor: number | null = null;

      for (const nodeId of result.path) {
        const node = nodes.get(nodeId)!;
        const floor = node.floor ?? 0;
        if (prevFloor !== null && floor !== prevFloor) floorChanges++;
        prevFloor = floor;

        path.push({
          nodeId: node.nodeId,
          name: node.name ?? node.nodeId,
          floor,
          floorName: `Floor ${floor}`,
          type: node.nodeType,
          position: node.position,
          roomNumber: node.roomNumber,
        });
      }

      const instructions = this.generateInstructions(path);

      return {
        found: true,
        path,
        totalDistance: Math.round(result.distance * 10) / 10,
        estimatedTimeSeconds: Math.round(result.distance / 1.4),
        floorChanges,
        instructions,
      };
    } catch {
      const { generateSeedPath } = await import("@/lib/data/seed-navigation");
      return generateSeedPath(from, to);
    }
  }

  private generateInstructions(path: PathWaypoint[]): string[] {
    if (path.length === 0) return [];
    const instructions = [`Start at ${path[0].name}`];
    let prevFloor = path[0].floor;

    for (const point of path.slice(1)) {
      if (point.floor !== prevFloor) {
        const direction = point.floor > prevFloor ? "up" : "down";
        const method = point.type === "stairs" ? "stairs" : "elevator";
        instructions.push(
          `Take the ${method} ${direction} to ${point.floorName}`
        );
        prevFloor = point.floor;
      } else if (point.roomNumber) {
        instructions.push(`Arrive at ${point.roomNumber}`);
      }
    }

    return instructions;
  }
}

export const navigationService = new NavigationService();
