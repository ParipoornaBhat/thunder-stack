"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Trash2, Key, Info, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: Array<{ id: string; key: string; module: string }>;
}

interface PermissionItem {
  id: string;
  key: string;
  description: string;
  module: string;
}

export default function RolesPage() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  // New Role Form States
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingPermissionId, setTogglingPermissionId] = useState<string | null>(null);

  const fetchRoles = async (selectId?: string) => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {};
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/roles`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
        
        // Retain or select first role
        if (data.length > 0) {
          const toSelect = selectId 
            ? data.find((r: RoleItem) => r.id === selectId) || data[0]
            : data[0];
          setSelectedRole(toSelect);
        } else {
          setSelectedRole(null);
        }
      }
    } catch {
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {};
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/roles/permissions`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchRoles();
      fetchPermissions();
    }
  }, [session]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName || !newRoleDisplayName) {
      toast.error("Please fill in required fields");
      return;
    }

    setCreating(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/roles`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          name: newRoleName,
          displayName: newRoleDisplayName,
          description: newRoleDesc,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Role created successfully!");
        setNewRoleName("");
        setNewRoleDisplayName("");
        setNewRoleDesc("");
        
        // Fetch roles and select the new one
        await fetchRoles(data.role.id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create role");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this role?")) return;

    setDeletingId(roleId);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {};
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/roles/${roleId}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      if (res.ok) {
        toast.success("Role deleted successfully!");
        fetchRoles();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete role");
      }
    } catch {
      toast.error("Communication error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    setTogglingPermissionId(permissionId);

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/roles/${selectedRole.id}/permissions`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ permissionId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update selected role's permissions locally to avoid full loading lag
        const isAdded = data.action === "added";
        const updatedPermissions = isAdded
          ? [...selectedRole.permissions, permissions.find((p) => p.id === permissionId)!]
          : selectedRole.permissions.filter((p) => p.id !== permissionId);

        const updatedRole = { ...selectedRole, permissions: updatedPermissions as any };
        setSelectedRole(updatedRole);
        
        // Update main list
        setRoles(roles.map((r) => (r.id === selectedRole.id ? updatedRole : r)));
        
        toast.success(data.message || "Permissions updated");
      } else {
        toast.error("Failed to toggle permission");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setTogglingPermissionId(null);
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, curr) => {
    if (!acc[curr.module]) {
      acc[curr.module] = [];
    }
    acc[curr.module].push(curr);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Columns - Roles list and creator */}
      <div className="space-y-6 lg:col-span-1">
        {/* Creator Form */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" /> Create New Role
          </h2>
          <form onSubmit={handleCreateRole} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unique Key (no spaces)</label>
              <input
                type="text"
                required
                placeholder="manager"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="mt-1 h-9.5 w-full rounded-lg border border-border bg-background/50 px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Display Name</label>
              <input
                type="text"
                required
                placeholder="System Manager"
                value={newRoleDisplayName}
                onChange={(e) => setNewRoleDisplayName(e.target.value)}
                className="mt-1 h-9.5 w-full rounded-lg border border-border bg-background/50 px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description (optional)</label>
              <textarea
                placeholder="Brief role responsibilities..."
                rows={3}
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background/50 p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="flex h-9.5 w-full items-center justify-center rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Create Role
            </button>
          </form>
        </div>

        {/* Roles List */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" /> System Roles ({roles.length})
          </h2>
          <div className="space-y-2">
            {loading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r)}
                    className={`flex w-full items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "border-border/50 bg-background/50 hover:bg-accent text-foreground"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{r.displayName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{r.userCount} users • {r.permissions.length} perms</p>
                    </div>
                    
                    {!r.isSystem && (
                      <button
                        onClick={(e) => handleDeleteRole(r.id, e)}
                        disabled={deletingId === r.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Columns - Permissions editor */}
      <div className="lg:col-span-2">
        {selectedRole ? (
          <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs h-full">
            <div className="border-b border-border pb-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Key className="h-5.5 w-5.5 text-blue-500" /> Permissions: {selectedRole.displayName}
                </h2>
                {selectedRole.isSystem && (
                  <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-semibold text-yellow-600 border border-yellow-500/20 dark:bg-yellow-500/15">
                    System Role
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {selectedRole.description || "No description provided for this role."}
              </p>
            </div>

            {selectedRole.name === "admin" ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl bg-muted/20 text-center">
                <ShieldAlert className="h-10 w-10 text-yellow-500 mb-3" />
                <p className="font-semibold text-foreground text-sm">Administrator Role has Full Access</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  The admin role possesses global systems privilege bypass. Permissions cannot be toggled for the administrator role.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                  <div key={moduleName} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5">{moduleName} Module</h3>
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {perms.map((p) => {
                        const isGranted = selectedRole.permissions.some((rp) => rp.key === p.key);
                        const isToggling = togglingPermissionId === p.id;
                        return (
                          <div
                            key={p.id}
                            className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                              isGranted
                                ? "bg-accent/40 border-blue-500/20 dark:bg-accent/20"
                                : "bg-background/40 border-border/50"
                            }`}
                          >
                            <div className="space-y-1 select-none pr-4">
                              <p className="text-xs font-bold text-foreground">{p.key}</p>
                              <p className="text-[10px] leading-relaxed text-muted-foreground">{p.description}</p>
                            </div>
                            <button
                              disabled={isToggling}
                              onClick={() => handleTogglePermission(p.id)}
                              className={`h-5 w-9 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-hidden ${
                                isGranted ? "bg-blue-500 flex justify-end" : "bg-muted flex justify-start"
                              }`}
                            >
                              <motion.div
                                layout
                                className="h-4 w-4 rounded-full bg-white shadow-xs"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-xs">
            Please create a role or select one to configure permissions.
          </div>
        )}
      </div>
    </div>
  );
}
