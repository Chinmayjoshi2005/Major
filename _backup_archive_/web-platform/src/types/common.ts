export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Vector3Tuple = [number, number, number];

export type InteractionMode = "explore" | "game";

export type UserRole =
  | "visitor"
  | "student"
  | "faculty"
  | "admin"
  | "superadmin";

export type FacultyStatus =
  | "available"
  | "in_class"
  | "in_meeting"
  | "offline";

export type RoomType =
  | "classroom"
  | "lab"
  | "office"
  | "conference"
  | "library"
  | "canteen"
  | "auditorium"
  | "stairs"
  | "elevator"
  | "restroom"
  | "corridor"
  | "lobby"
  | "other";

export type NavigationNodeType =
  | "room"
  | "corridor"
  | "stairs"
  | "elevator"
  | "junction"
  | "entrance";

export type SearchEntityType =
  | "faculty"
  | "room"
  | "department"
  | "lab"
  | "office"
  | "all";

export type NoticeType = "notice" | "circular" | "event";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};
