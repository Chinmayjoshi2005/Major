/**
 * Maps GLB mesh names to college room numbers.
 * Source: Smartracker ROOM_LABEL_MAP (validated against Blender export).
 */
export const ROOM_MESH_MAP: Record<string, string> = {
  room_001: "101",
  room_002: "102",
  room_102: "102",
  room_003: "103",
  room_004: "reception",
  room_005: "LIBRARY",
  room_006: "CANTEEN",
  room_007: "201",
  room_008: "HOD-CSE",
  room_009: "CONF",
  room_010: "Seminar Hall",
  room_011: "201",
  room_201: "201",
  room_012: "202",
  room_013: "203",
  room_014: "Lab-CS1",
  room_015: "Lab-CS2",
  room_016: "Lab-AI",
  room_017: "Lab-ECE1",
  room_018: "Lab-ECE2",
  room_019: "C-201",
  room_022: "C-202",
  room_023: "C-205",
  room_205: "C-205",
  room_024: "C-206",
  room_232: "C-232",
  room_025: "301",
  room_026: "302",
  room_027: "Lab-ME1",
  room_028: "Lab-ME2",
  room_029: "C-301",
  room_030: "Lab-ECE3",
  room_031: "401",
  room_032: "C-401",
  room_033: "402",
  room_034: "501",
  room_035: "C-501",
  room_036: "Lab-CE1",
  room_037: "Lab-CE2",
  room_038: "Lab-ECE4",
  room_039: "Lab-ML",
};

/** Cabin number → primary GLB mesh name */
export const CABIN_TO_MESH: Record<string, string> = {
  "C-201": "room_019",
  "C-202": "room_022",
  "C-205": "room_205",
  "C-206": "room_024",
  "C-213": "room_013",
  "C-226": "room_026",
  "C-232": "room_232",
  "C-301": "room_029",
  "C-401": "room_032",
  "C-501": "room_035",
  "HOD-CSE": "room_008",
};

export const DEFAULT_SPAWN: [number, number, number] = [0, 1, 8];

export const CAMPUS_MODEL_URL =
  process.env.NEXT_PUBLIC_CAMPUS_MODEL_URL ?? "/models/campus.glb";
