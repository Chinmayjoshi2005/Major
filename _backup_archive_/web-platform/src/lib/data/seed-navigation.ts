import { readFileSync } from "fs";
import { join } from "path";
import type { NavigationNode, NavigationEdge, NavigationRoute, NavPoint, PathWaypoint, Vector3 } from "@/types";

let cachedGraph: {
  nodes: Map<string, NavigationNode>;
  adjacency: Map<string, Array<{ to: string; weight: number }>>;
} | null = null;

function loadSeedGraph() {
  if (cachedGraph) return cachedGraph;

  const dataDir = join(process.cwd(), "../data");
  const nodesRaw = JSON.parse(
    readFileSync(join(dataDir, "navigation-nodes.json"), "utf-8")
  ) as Array<{
    nodeId: string;
    name: string;
    nodeType: NavigationNode["nodeType"];
    floor: number;
    roomNumber?: string;
    position: Vector3;
  }>;

  const edgesRaw = JSON.parse(
    readFileSync(join(dataDir, "navigation-edges.json"), "utf-8")
  ) as NavigationEdge[];

  const nodes = new Map<string, NavigationNode>();
  for (const n of nodesRaw) {
    nodes.set(n.nodeId, {
      _id: n.nodeId,
      nodeId: n.nodeId,
      name: n.name,
      nodeType: n.nodeType,
      floor: n.floor,
      roomNumber: n.roomNumber,
      position: n.position,
    });
  }

  const adjacency = new Map<string, Array<{ to: string; weight: number }>>();
  for (const e of edgesRaw) {
    const fromList = adjacency.get(e.fromNodeId) ?? [];
    fromList.push({ to: e.toNodeId, weight: e.weight });
    adjacency.set(e.fromNodeId, fromList);
    if (e.bidirectional) {
      const toList = adjacency.get(e.toNodeId) ?? [];
      toList.push({ to: e.fromNodeId, weight: e.weight });
      adjacency.set(e.toNodeId, toList);
    }
  }

  cachedGraph = { nodes, adjacency };
  return cachedGraph;
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

export function generateSeedPath(from: NavPoint, to: NavPoint): NavigationRoute {
  const { nodes, adjacency } = loadSeedGraph();
  const facultyData = JSON.parse(
    readFileSync(join(process.cwd(), "../data/faculty.json"), "utf-8")
  ) as Array<{ id: string; room: string }>;

  let startId = "N-ENT-01";
  let endId: string | null = null;

  if (from.type === "node" && from.nodeId) startId = from.nodeId;

  if (to.type === "node" && to.nodeId) endId = to.nodeId;
  if (to.type === "room" && to.roomNumber) {
    for (const [id, node] of nodes) {
      if (node.roomNumber === to.roomNumber) {
        endId = id;
        break;
      }
    }
  }
  if (to.type === "faculty" && to.facultyId) {
    const faculty = facultyData.find((f) => f.id === to.facultyId);
    if (faculty) {
      for (const [id, node] of nodes) {
        if (node.roomNumber === faculty.room) {
          endId = id;
          break;
        }
      }
    }
  }

  if (!endId) {
    return {
      found: false,
      path: [],
      totalDistance: 0,
      estimatedTimeSeconds: 0,
      floorChanges: 0,
      instructions: ["Destination not found in navigation map."],
      error: "Destination not found.",
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
      instructions: ["No path found."],
      error: "No navigable path.",
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

  const instructions = [`Start at ${path[0]?.name ?? "entrance"}`];
  for (const p of path.slice(1)) {
    if (p.roomNumber) instructions.push(`Arrive at ${p.roomNumber}`);
    else if (p.type === "stairs") instructions.push(`Take stairs to ${p.floorName}`);
  }

  return {
    found: true,
    path,
    totalDistance: Math.round(result.distance * 10) / 10,
    estimatedTimeSeconds: Math.round(result.distance / 1.4),
    floorChanges,
    instructions,
  };
}
