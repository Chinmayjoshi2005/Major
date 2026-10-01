import type { NavigationNodeType, Vector3 } from "./common";
import type {
  DepartmentSearchResult,
  FacultySearchResult,
  RoomSearchResult,
} from "./index";

export type NavigationNode = {
  _id: string;
  nodeId: string;
  name?: string;
  nodeType: NavigationNodeType;
  floorId?: string;
  floor?: number;
  roomNumber?: string;
  position: Vector3;
};

export type NavigationEdge = {
  _id: string;
  fromNodeId: string;
  toNodeId: string;
  weight: number;
  bidirectional: boolean;
};

export type NavPoint = {
  type: "position" | "room" | "faculty" | "node";
  x?: number;
  y?: number;
  z?: number;
  roomNumber?: string;
  facultyId?: string;
  nodeId?: string;
};

export type PathWaypoint = {
  nodeId: string;
  name: string;
  floor: number;
  floorName: string;
  type: NavigationNodeType;
  position: Vector3;
  roomNumber?: string;
};

export type NavigationRoute = {
  found: boolean;
  path: PathWaypoint[];
  totalDistance: number;
  estimatedTimeSeconds: number;
  floorChanges: number;
  instructions: string[];
  error?: string;
};

export type SearchResult =
  | FacultySearchResult
  | RoomSearchResult
  | DepartmentSearchResult;

export type FocusTarget = {
  position: Vector3;
  lookAt?: Vector3;
  entityType: "faculty" | "room" | "department";
  entityId: string;
  meshNames?: string[];
  label?: string;
};

export type CameraCommand = {
  type: "focus" | "orbit" | "path" | "reset";
  target?: Vector3;
  lookAt?: Vector3;
  duration?: number;
};

export type Hotspot = {
  id: string;
  roomNumber: string;
  position: Vector3;
  label: string;
};
