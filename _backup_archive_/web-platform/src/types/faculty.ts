import type { FacultyStatus, Vector3 } from "./common";

export type Faculty = {
  _id: string;
  slug: string;
  name: string;
  email?: string;
  department: string;
  departmentId?: string;
  designation?: string;
  qualification?: string;
  specialization?: string;
  roomNumber?: string;
  floor?: number;
  position?: Vector3;
  contact?: string;
  bio?: string;
  photoUrl?: string;
  status: FacultyStatus;
  subjects?: string[];
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FacultyCreateInput = Omit<
  Faculty,
  "_id" | "slug" | "createdAt" | "updatedAt"
>;

export type FacultySearchResult = {
  id: string;
  type: "faculty";
  title: string;
  subtitle: string;
  department: string;
  roomNumber?: string;
  floor?: number;
  position?: Vector3;
  meshNames?: string[];
  status: FacultyStatus;
};
