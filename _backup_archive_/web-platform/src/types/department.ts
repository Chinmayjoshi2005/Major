import type { Vector3 } from "./common";

export type Department = {
  _id: string;
  slug: string;
  name: string;
  shortName?: string;
  hodFacultyId?: string;
  buildingId?: string;
  floor?: number;
  position?: Vector3;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DepartmentSearchResult = {
  id: string;
  type: "department";
  title: string;
  subtitle: string;
  department: string;
  floor?: number;
  position?: Vector3;
  meshNames?: string[];
  color?: string;
};
