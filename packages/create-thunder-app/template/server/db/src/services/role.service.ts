import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "../client.js";
import * as schema from "../schema/index.js";

export const roleService = {
  getRolesWithCounts: async () => {
    const rolesList = await db.query.role.findMany({
      orderBy: (r, { asc }) => [asc(r.name)],
      with: {
        rolePermissions: {
          with: {
            permission: true,
          },
        },
        userRoles: true,
      },
    });

    return rolesList.map((r) => ({
      id: r.id,
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      userCount: r.userRoles.length,
      permissions: r.rolePermissions
        .filter((rp) => rp.permission)
        .map((rp) => ({
          id: rp.permission.id,
          key: rp.permission.key,
          module: rp.permission.module,
        })),
    }));
  },

  createRole: async (data: { name: string; displayName: string; description?: string }) => {
    const normalizedName = data.name.toLowerCase().trim().replace(/\s+/g, "-");

    const existing = await db.query.role.findFirst({
      where: eq(schema.role.name, normalizedName),
    });

    if (existing) {
      throw new Error("A role with this name already exists");
    }

    const [newRole] = await db
      .insert(schema.role)
      .values({
        name: normalizedName,
        displayName: data.displayName.trim(),
        description: data.description?.trim() || null,
        isSystem: false,
      })
      .returning();

    return newRole;
  },

  deleteRole: async (id: string) => {
    const dbRole = await db.query.role.findFirst({
      where: eq(schema.role.id, id),
    });

    if (!dbRole) {
      throw new Error("Role not found");
    }

    if (dbRole.isSystem) {
      throw new Error("System roles cannot be deleted");
    }

    const assignments = await db.query.userRole.findMany({
      where: eq(schema.userRole.roleId, id),
    });

    if (assignments.length > 0) {
      throw new Error(`Cannot delete role. It is currently assigned to ${assignments.length} user(s)`);
    }

    await db.delete(schema.role).where(eq(schema.role.id, id));
    return true;
  },

  listPermissions: async () => {
    return db.query.permission.findMany({
      orderBy: (p, { asc }) => [asc(p.module), asc(p.key)],
    });
  },

  togglePermission: async (roleId: string, permissionId: string) => {
    const dbRole = await db.query.role.findFirst({
      where: eq(schema.role.id, roleId),
    });
    if (!dbRole) {
      throw new Error("Role not found");
    }

    if (dbRole.name === "admin") {
      throw new Error("Admin role permissions cannot be modified");
    }

    const dbPerm = await db.query.permission.findFirst({
      where: eq(schema.permission.id, permissionId),
    });
    if (!dbPerm) {
      throw new Error("Permission not found");
    }

    const existingRelation = await db.query.rolePermission.findFirst({
      where: and(
        eq(schema.rolePermission.roleId, roleId),
        eq(schema.rolePermission.permissionId, permissionId)
      ),
    });

    if (existingRelation) {
      await db
        .delete(schema.rolePermission)
        .where(
          and(
            eq(schema.rolePermission.roleId, roleId),
            eq(schema.rolePermission.permissionId, permissionId)
          )
        );
      return { action: "removed", message: "Permission removed from role" };
    } else {
      await db.insert(schema.rolePermission).values({
        roleId,
        permissionId,
      });
      return { action: "added", message: "Permission assigned to role" };
    }
  },
};
