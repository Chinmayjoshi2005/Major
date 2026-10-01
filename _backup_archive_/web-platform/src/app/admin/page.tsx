import Link from "next/link";
import { NeoCard } from "@/components/neo-brutal/neo-card";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
import {
  Users,
  Building2,
  DoorOpen,
  Bell,
  Navigation,
  BarChart3,
  Upload,
  ShieldAlert,
} from "lucide-react";

async function getStats() {
  try {
    const db = await getDb();
    const [faculty, rooms, departments, notices] = await Promise.all([
      db.collection(COLLECTIONS.faculty).countDocuments(),
      db.collection(COLLECTIONS.rooms).countDocuments(),
      db.collection(COLLECTIONS.departments).countDocuments(),
      db.collection(COLLECTIONS.notices).countDocuments({ isPublished: true }),
    ]);
    return { faculty, rooms, departments, notices };
  } catch {
    return { faculty: 0, rooms: 0, departments: 0, notices: 0 };
  }
}

const adminLinks = [
  { href: "/admin/faculty", label: "Faculty", icon: Users, perm: "faculty:manage" },
  { href: "/admin/rooms", label: "Rooms", icon: DoorOpen, perm: "rooms:manage" },
  { href: "/admin/departments", label: "Departments", icon: Building2, perm: "rooms:manage" },
  { href: "/admin/notices", label: "Notices", icon: Bell, perm: "notices:manage" },
  { href: "/admin/navigation", label: "Navigation", icon: Navigation, perm: "superadmin" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, perm: "reports:view" },
  { href: "/admin/import", label: "Import/Export", icon: Upload, perm: "superadmin" },
];

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const session = await getSession();
  
  const role = session?.user?.role;
  const db = await getDb();
  const dbUser = session?.user?.email 
    ? await db.collection(COLLECTIONS.users).findOne({ email: session.user.email })
    : null;
  const userPermissions = dbUser?.permissions || [];

  // Filter links based on role & permissions
  const filteredLinks = adminLinks.filter((link) => {
    if (role === "superadmin") return true;
    if (link.perm === "superadmin") return false;
    return userPermissions.includes(link.perm);
  });

  // Add User Management link for Super Admins
  const links = [...filteredLinks];
  if (role === "superadmin") {
    links.push({ href: "/admin/users", label: "User Management", icon: ShieldAlert, perm: "superadmin" });
  }

  // Filter stats cards shown based on permissions
  const statsCards = [
    { label: "Faculty", value: stats.faculty, perm: "faculty:manage" },
    { label: "Rooms", value: stats.rooms, perm: "rooms:manage" },
    { label: "Departments", value: stats.departments, perm: "rooms:manage" },
    { label: "Notices", value: stats.notices, perm: "notices:manage" },
  ].filter((s) => role === "superadmin" || userPermissions.includes(s.perm));

  return (
    <div className="e-page page-content">
      <div className="e-page-header flex justify-between items-center">
        <div>
          <h1 className="e-page-title">Dashboard</h1>
          <p className="e-page-subtitle">
            {role === "superadmin" ? "Super Admin Portal" : "Sub Admin Portal"}
          </p>
        </div>
        <SignOutButton />
      </div>

      {statsCards.length > 0 && (
        <div className="e-stats-grid">
          {statsCards.map((s) => (
            <NeoCard key={s.label} className="e-stat-card">
              <p className="e-stat-value">{s.value}</p>
              <p className="e-stat-label">{s.label}</p>
            </NeoCard>
          ))}
        </div>
      )}

      {links.length > 0 ? (
        <div className="e-links-grid">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="e-link-card">
              <NeoCard className="e-nav-card">
                <Icon className="e-nav-icon" />
                <span className="e-nav-label">{label}</span>
              </NeoCard>
            </Link>
          ))}
        </div>
      ) : (
        <NeoCard className="p-6 text-center">
          <p className="font-bold text-red-600 uppercase mb-2">No Modules Assigned</p>
          <p className="text-sm text-gray-600">
            You do not currently have any administrative permissions. Please contact a Super Admin.
          </p>
        </NeoCard>
      )}
    </div>
  );
}
