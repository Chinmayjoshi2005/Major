"use client";

import { useState, useEffect } from "react";
import { NeoCard } from "@/components/neo-brutal/neo-card";
import { NeoButton } from "@/components/neo-brutal/neo-button";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  permissions: string[];
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  targetId: string | null;
  timestamp: string;
  ip: string;
  metadata?: Record<string, unknown>;
}

const AVAILABLE_PERMISSIONS = [
  { id: "notices:manage", label: "Manage Notices", desc: "Create, edit, and delete notices" },
  { id: "faculty:manage", label: "Manage Faculty", desc: "Edit faculty profiles and statuses" },
  { id: "rooms:manage", label: "Manage Rooms", desc: "Update room details and positions" },
  { id: "reports:view", label: "View Reports", desc: "Access platform analytics and stats" },
];

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "suspended">("active");
  
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setLogs(json.data.auditLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditId("");
    setName("");
    setEmail("");
    setPassword("");
    setPermissions([]);
    setStatus("active");
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (user: AdminUser) => {
    setIsEditing(true);
    setEditId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(""); // Leave blank unless changing
    setPermissions(user.permissions || []);
    setStatus(user.status);
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const handlePermissionChange = (permId: string) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    const payload: Record<string, unknown> = { name, email, permissions, status };
    if (password && password.trim() !== "") {
      payload.password = password;
    }

    if (isEditing) {
      payload.id = editId;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setSubmitting(false);

      if (!json.success) {
        setFormError(json.error?.message || "Operation failed.");
        return;
      }

      setFormSuccess(isEditing ? "Account updated successfully!" : "Sub Admin created successfully!");
      fetchData();
      
      // Delay closing modal
      setTimeout(() => {
        setShowModal(false);
      }, 1000);
    } catch {
      setSubmitting(false);
      setFormError("An unexpected error occurred.");
    }
  };

  const toggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          permissions: user.permissions,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this account? This action is permanent.")) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="e-page page-content">
      <div className="e-page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="e-page-title">User Management</h1>
          <p className="e-page-subtitle">Configure Sub Admin access and view system security logs</p>
        </div>
        <div className="flex gap-2">
          <NeoButton size="sm" onClick={openCreateModal}>
            <Plus className="inline mr-1 h-4 w-4" /> Add Sub Admin
          </NeoButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b-3 border-[#0a0a0a] pb-2">
        <button
          className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
            activeTab === "users" ? "bg-neo-yellow neo-border neo-shadow-sm" : "hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("users")}
        >
          Sub Admins ({users.filter((u) => u.role === "subadmin").length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${
            activeTab === "logs" ? "bg-neo-yellow neo-border neo-shadow-sm" : "hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("logs")}
        >
          Security & Audit Logs
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-gray-600" />
        </div>
      ) : activeTab === "users" ? (
        <div className="space-y-4">
          <div className="overflow-x-auto neo-border bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-3 border-[#0a0a0a] bg-gray-50">
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Name</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Permissions</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0a0a0a]/30">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold">{user.name}</td>
                    <td className="p-4 font-mono text-sm">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-black uppercase neo-border ${
                          user.role === "superadmin" ? "bg-neo-pink" : "bg-neo-blue"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.role === "superadmin" ? (
                        <span className="text-xs font-bold text-gray-500 uppercase">All (Inherited)</span>
                      ) : user.permissions && user.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((p) => (
                            <span key={p} className="text-[10px] font-mono bg-gray-100 px-1 py-0.5 border border-[#0a0a0a]">
                              {p.split(":")[0]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-red-600 font-bold uppercase">No Permissions</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => user.role !== "superadmin" && toggleStatus(user)}
                        disabled={user.role === "superadmin"}
                        className={`px-2 py-0.5 text-xs font-black uppercase neo-border disabled:opacity-50 ${
                          user.status === "active" ? "bg-emerald-300 hover:bg-emerald-400" : "bg-red-300 hover:bg-red-400"
                        }`}
                      >
                        {user.status}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <NeoButton size="sm" onClick={() => openEditModal(user)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </NeoButton>
                      {user.role !== "superadmin" && (
                        <NeoButton size="sm" variant="danger" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </NeoButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto neo-border bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-3 border-[#0a0a0a] bg-gray-50">
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Timestamp</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">User ID</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Action</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Target</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">IP Address</th>
                  <th className="p-4 text-xs font-black uppercase tracking-wider">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0a0a0a]/30 font-mono text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="p-4 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs truncate max-w-[150px]" title={log.userId}>
                      {log.userId}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-teal-800">{log.action}</span>
                    </td>
                    <td className="p-4 text-xs">
                      {log.targetId || "-"}
                    </td>
                    <td className="p-4 text-xs">{log.ip}</td>
                    <td className="p-4 text-xs max-w-[200px] truncate" title={JSON.stringify(log.metadata)}>
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* modal backdrop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <NeoCard className="w-full max-w-lg bg-white relative">
            <h2 className="text-xl font-black uppercase mb-4">
              {isEditing ? `Edit Sub Admin Profile` : "Create Sub Admin"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="neo-border w-full bg-white px-4 py-2 font-medium outline-none"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neo-border w-full bg-white px-4 py-2 font-medium outline-none"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-600">
                  Password {isEditing && <span className="text-gray-400 normal-case">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-border w-full bg-white px-4 py-2 font-medium outline-none"
                  disabled={submitting}
                />
              </div>

              {editId !== "local-superadmin" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "active" | "suspended")}
                      className="neo-border w-full bg-white px-4 py-2 font-medium outline-none"
                      disabled={submitting}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  {/* Permissions Selection */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-gray-600">Permissions</label>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto border border-[#0a0a0a] p-2">
                      {AVAILABLE_PERMISSIONS.map((perm) => (
                        <label key={perm.id} className="flex items-start gap-2 cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={permissions.includes(perm.id)}
                            onChange={() => handlePermissionChange(perm.id)}
                            className="mt-1 border border-[#0a0a0a]"
                            disabled={submitting}
                          />
                          <div>
                            <p className="text-xs font-bold uppercase">{perm.label}</p>
                            <p className="text-[10px] text-gray-500">{perm.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {formError && <p className="text-xs font-bold text-red-600">{formError}</p>}
              {formSuccess && <p className="text-xs font-bold text-teal-800">{formSuccess}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <NeoButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </NeoButton>
                <NeoButton type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </NeoButton>
              </div>
            </form>
          </NeoCard>
        </div>
      )}
    </div>
  );
}
