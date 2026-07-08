"use client";

import { useEffect, useState } from "react";
import { useSession } from "~/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ShieldCheck, UserCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface UserItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  roles: Array<{ id: string; name: string; displayName: string; isActive: boolean }>;
  activeRole: { id: string; name: string; displayName: string } | null;
}

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {};
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/users?search=${search}&page=${page}`, {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      } else {
        toast.error("Failed to load users list");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
      fetchRoles();
    }
  }, [session, search, page]);

  const handleRoleChange = async (userId: string, roleId: string, currentRoles: any[]) => {
    setUpdatingUserId(userId);
    const hasRole = currentRoles.some((r) => r.id === roleId);
    
    // Toggle role: assign if they don't have it, remove if they do
    const assign = !hasRole;

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.session?.token) {
        headers["Authorization"] = `Bearer ${session.session.token}`;
      }
      const res = await fetch(`${serverUrl}/api/users/${userId}/role`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ roleId, assign }),
      });

      if (res.ok) {
        toast.success(assign ? "Role assigned successfully" : "Role removed successfully");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Error communicating with backend");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View users and assign system privileges and roles.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-background/25"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Assigned Roles</th>
                <th className="px-6 py-4 text-right">Modify Roles</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="h-48 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading users data...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-48 text-center text-sm text-muted-foreground">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/40 hover:bg-muted/10 last:border-none transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold dark:bg-blue-500/15 dark:text-blue-400">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((r) => (
                          <span
                            key={r.id}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              r.isActive
                                ? "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400"
                                : "bg-muted text-muted-foreground ring-border"
                            }`}
                          >
                            {r.isActive && <ShieldCheck className="h-3 w-3" />}
                            {r.displayName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5 max-w-[250px]">
                        {roles.map((roleOption) => {
                          const isAssigned = u.roles.some((r) => r.id === roleOption.id);
                          const isDisabled = updatingUserId === u.id;
                          return (
                            <button
                              key={roleOption.id}
                              disabled={isDisabled}
                              onClick={() => handleRoleChange(u.id, roleOption.id, u.roles)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                                isAssigned
                                  ? "bg-red-500/10 border-red-500/20 text-red-600 hover:bg-red-500/25 dark:bg-red-500/15 dark:text-red-400"
                                  : "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/25 dark:bg-blue-500/15 dark:text-blue-400"
                              } disabled:opacity-50`}
                            >
                              {isAssigned ? `- ${roleOption.displayName}` : `+ ${roleOption.displayName}`}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-accent disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
