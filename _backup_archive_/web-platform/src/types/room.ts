import type { RoomType, Vector3 } from "./common";

export type Room = {
  _id: string;
  roomNumber: string;
  meshName?: string;
  name?: string;
  roomType: RoomType;
  floorId?: string;
  floor?: number;
  departmentId?: string;
  position: Vector3;
  capacity?: number;
  wing?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomSearchResult = {
  id: string;
  type: "room" | "lab" | "office";
  title: string;
  subtitle: string;
  roomNumber: string;
  floor?: number;
  position: Vector3;
  meshNames?: string[];
  roomType: RoomType;
};
