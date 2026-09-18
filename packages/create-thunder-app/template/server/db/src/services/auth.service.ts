import { eq, and } from "drizzle-orm";
import { db } from "../client.js";
import * as schema from "../schema/index.js";

export const authService = {
  assignRole: async (userId: string, roleName: string) => {
    try {
      const dbRole = await db.query.role.findFirst({
        where: eq(schema.role.name, roleName.toLowerCase()),
      });

      if (dbRole) {
        const existing = await db.query.userRole.findFirst({
          where: and(
            eq(schema.userRole.userId, userId),
            eq(schema.userRole.roleId, dbRole.id)
          ),
        });

        if (!existing) {
          await db.insert(schema.userRole).values({
            userId,
            roleId: dbRole.id,
            isActive: true,
          });
        }
      }
    } catch (error) {
      console.error(`Error in assignRole (${roleName}):`, error);
    }
  },

  ensureAdminRole: async (email: string) => {
    try {
      const dbUser = await db.query.user.findFirst({
        where: eq(schema.user.email, email),
      });

      const adminRole = await db.query.role.findFirst({
        where: eq(schema.role.name, "admin"),
      });

      if (dbUser && adminRole) {
        const hasRole = await db.query.userRole.findFirst({
          where: and(
            eq(schema.userRole.userId, dbUser.id),
            eq(schema.userRole.roleId, adminRole.id)
          ),
        });

        if (!hasRole) {
          await db.insert(schema.userRole).values({
            userId: dbUser.id,
            roleId: adminRole.id,
            isActive: true,
          });
          return true;
        }
      }
    } catch (error) {
      console.error("Error ensuring admin role:", error);
    }
    return false;
  },

  getUserAuthContext: async (userId: string) => {
    let activeUr = await db.query.userRole.findFirst({
      where: and(eq(schema.userRole.userId, userId), eq(schema.userRole.isActive, true)),
      with: { role: true },
    });

    if (!activeUr) {
      activeUr = await db.query.userRole.findFirst({
        where: eq(schema.userRole.userId, userId),
        with: { role: true },
      });

      if (activeUr) {
        await db
          .update(schema.userRole)
          .set({ isActive: true })
          .where(eq(schema.userRole.id, activeUr.id));
      }
    }

    if (!activeUr || !activeUr.role) {
      return {
        activeRole: null,
        permissions: [],
      };
    }

    const rpRecords = await db.query.rolePermission.findMany({
      where: eq(schema.rolePermission.roleId, activeUr.role.id),
      with: { permission: true },
    });

    const permissions = rpRecords
      .filter((rp) => rp.permission)
      .map((rp) => rp.permission.key);

    return {
      activeRole: {
        id: activeUr.role.id,
        name: activeUr.role.name,
        displayName: activeUr.role.displayName,
      },
      permissions,
    };
  },

  revokeSessionByToken: async (token: string) => {
    await db.delete(schema.session).where(eq(schema.session.token, token));
  },
};
