import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { NeoCard } from "@/components/neo-brutal/neo-card";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

async function getFaculty() {
  try {
    const db = await getDb();
    return await db
      .collection(COLLECTIONS.faculty)
      .find({})
      .sort({ name: 1 })
      .limit(100)
      .toArray();
  } catch (err) {
    console.warn("Database lookup failed on faculty page, falling back to local seed data:", err);
    return JSON.parse(
      readFileSync(join(process.cwd(), "../data/faculty.json"), "utf-8")
    );
  }
}

export default async function AdminFacultyPage() {
  const faculty = await getFaculty();

  return (
    <div className="e-page page-content">
      <div className="e-page-header">
        <h1 className="e-page-title">Faculty Management</h1>
        <p className="e-page-subtitle">Manage faculty records and status</p>
      </div>

      <div className="e-list">
        {faculty.map(
          (f: {
            _id?: { toString(): string };
            id?: string;
            name: string;
            department?: string;
            room?: string;
            roomNumber?: string;
            status?: string;
          }) => (
            <NeoCard key={f._id?.toString() ?? f.id} className="e-list-item">
              <div className="e-list-body">
                <p className="e-list-title">{f.name}</p>
                <p className="e-list-subtitle">
                  {f.department} · {f.roomNumber ?? f.room}
                </p>
              </div>
              <span className="e-badge">{f.status ?? "available"}</span>
            </NeoCard>
          )
        )}
      </div>
    </div>
  );
}
