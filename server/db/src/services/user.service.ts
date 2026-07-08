import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../client.js";
import * as schema from "../schema/index.js";
import crypto from "crypto";

export const userService = {
  getPaginatedUsers: async (params: { page: number; limit: number; search?: string }) => {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(
          ilike(schema.user.name, `%${search}%`),
          ilike(schema.user.email, `%${search}%`)
        )
      : undefined;

    const usersList = await db.query.user.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.user)
      .where(whereClause);

    const formattedUsers = usersList.map((u) => {
      const rolesList = u.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
        isActive: ur.isActive,
      }));
      const active = rolesList.find((r) => r.isActive) || rolesList[0] || null;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        gender: u.gender,
        onboarded: u.onboarded,
        createdAt: u.createdAt,
        roles: rolesList,
        activeRole: active,
      };
    });

    return {
      users: formattedUsers,
      totalCount: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      page,
      limit,
    };
  },

  updateUserRole: async (userId: string, roleId: string, assign: boolean) => {
    const dbRole = await db.query.role.findFirst({
      where: eq(schema.role.id, roleId),
    });
    if (!dbRole) {
      throw new Error("Role not found");
    }

    if (assign === false) {
      const userRolesCount = await db.query.userRole.findMany({
        where: eq(schema.userRole.userId, userId),
      });
      if (userRolesCount.length <= 1) {
        throw new Error("Cannot remove the last role from a user");
      }

      await db
        .delete(schema.userRole)
        .where(
          and(
            eq(schema.userRole.userId, userId),
            eq(schema.userRole.roleId, roleId)
          )
        );

      const activeRoleExists = userRolesCount.some((ur) => ur.roleId !== roleId && ur.isActive);
      if (!activeRoleExists) {
        const remainingRole = userRolesCount.find((ur) => ur.roleId !== roleId);
        if (remainingRole) {
          await db
            .update(schema.userRole)
            .set({ isActive: true })
            .where(eq(schema.userRole.id, remainingRole.id));
        }
      }
    } else {
      const existing = await db.query.userRole.findFirst({
        where: and(
          eq(schema.userRole.userId, userId),
          eq(schema.userRole.roleId, roleId)
        ),
      });

      if (!existing) {
        await db.insert(schema.userRole).values({
          userId,
          roleId,
          isActive: false,
        });
      }
    }
    return true;
  },

  getUserRoles: async (userId: string) => {
    return await db.query.userRole.findMany({
      where: eq(schema.userRole.userId, userId),
      with: { role: true },
    });
  },

  switchUserRole: async (userId: string, roleId: string) => {
    const urRecord = await db.query.userRole.findFirst({
      where: and(
        eq(schema.userRole.userId, userId),
        eq(schema.userRole.roleId, roleId)
      ),
    });

    if (!urRecord) {
      throw new Error("You are not assigned to this role");
    }

    await db
      .update(schema.userRole)
      .set({ isActive: false })
      .where(eq(schema.userRole.userId, userId));

    await db
      .update(schema.userRole)
      .set({ isActive: true })
      .where(
        and(
          eq(schema.userRole.userId, userId),
          eq(schema.userRole.roleId, roleId)
        )
      );

    return true;
  },

  findByEmail: async (email: string) => {
    return await db.query.user.findFirst({
      where: eq(schema.user.email, email.toLowerCase().trim()),
    });
  },

  createVerificationOTP: async (email: string, otp: string, expiresAt: Date) => {
    const cleanEmail = email.toLowerCase().trim();
    await db.delete(schema.verification).where(eq(schema.verification.identifier, cleanEmail));
    await db.insert(schema.verification).values({
      id: crypto.randomUUID(),
      identifier: cleanEmail,
      value: otp,
      expiresAt,
    });
  },

  getVerificationOTP: async (email: string, otp: string) => {
    return await db.query.verification.findFirst({
      where: and(
        eq(schema.verification.identifier, email.toLowerCase().trim()),
        eq(schema.verification.value, otp)
      ),
    });
  },

  deleteVerificationOTP: async (id: string) => {
    await db.delete(schema.verification).where(eq(schema.verification.id, id));
  },

  updateUserPassword: async (userId: string, hashedPassword: string) => {
    const userRecord = await db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    });
    if (!userRecord) {
      throw new Error("User not found");
    }

    const existingAccount = await db.query.account.findFirst({
      where: and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "credential")
      ),
    });

    if (existingAccount) {
      await db
        .update(schema.account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(schema.account.id, existingAccount.id));
    } else {
      await db.insert(schema.account).values({
        id: crypto.randomUUID(),
        accountId: userRecord.email,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  },
};

