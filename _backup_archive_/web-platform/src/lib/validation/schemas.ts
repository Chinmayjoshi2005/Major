import { z } from "zod";

export const vector3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(100).trim(),
  type: z
    .enum(["faculty", "room", "department", "lab", "office", "all"])
    .default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const facultyCreateSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().optional().or(z.literal("")),
  department: z.string().min(1).max(255).trim(),
  designation: z.string().max(255).optional(),
  qualification: z.string().max(255).optional(),
  specialization: z.string().max(255).optional(),
  roomNumber: z.string().max(50).optional(),
  floor: z.coerce.number().int().min(0).max(20).optional(),
  position: vector3Schema.optional(),
  contact: z.string().max(20).optional(),
  bio: z.string().max(2000).optional(),
  status: z
    .enum(["available", "in_class", "in_meeting", "offline"])
    .default("available"),
});

export const roomCreateSchema = z.object({
  roomNumber: z.string().min(1).max(50).trim(),
  meshName: z.string().max(50).optional(),
  name: z.string().max(200).optional(),
  roomType: z.enum([
    "classroom",
    "lab",
    "office",
    "conference",
    "library",
    "canteen",
    "auditorium",
    "stairs",
    "elevator",
    "restroom",
    "corridor",
    "lobby",
    "other",
  ]),
  floor: z.coerce.number().int().min(0).max(20),
  position: vector3Schema,
  capacity: z.coerce.number().int().positive().optional(),
  wing: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

export const navigationPathSchema = z.object({
  from: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("position"),
      x: z.number().finite(),
      y: z.number().finite(),
      z: z.number().finite(),
    }),
    z.object({ type: z.literal("node"), nodeId: z.string() }),
    z.object({ type: z.literal("room"), roomNumber: z.string() }),
  ]),
  to: z.discriminatedUnion("type", [
    z.object({ type: z.literal("faculty"), id: z.string() }),
    z.object({ type: z.literal("room"), roomNumber: z.string() }),
    z.object({ type: z.literal("node"), nodeId: z.string() }),
    z.object({
      type: z.literal("position"),
      x: z.number().finite(),
      y: z.number().finite(),
      z: z.number().finite(),
    }),
  ]),
});

export const noticeCreateSchema = z.object({
  title: z.string().min(3).max(300).trim(),
  content: z.string().min(10).max(10000),
  type: z.enum(["notice", "circular", "event"]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  isPublished: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const importDataSchema = z.object({
  collection: z.enum([
    "faculty",
    "rooms",
    "departments",
    "navigation_nodes",
    "navigation_edges",
  ]),
  data: z.array(z.record(z.any())).min(1),
});

export const subAdminSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  permissions: z.array(z.string()).default([]),
  status: z.enum(["active", "suspended"]).default("active"),
});

export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
  confirmNewPassword: z.string().min(8).max(128),
});

