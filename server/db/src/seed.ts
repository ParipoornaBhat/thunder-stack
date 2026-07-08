import { db } from "./client.js";
import * as schema from "./schema/index.js";
import { eq, and } from "drizzle-orm";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { hashPassword } from "better-auth/crypto";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const permissionsToSeed = [
  { key: "users:view", module: "users", description: "View user accounts and profiles" },
  { key: "users:manage", module: "users", description: "Manage users (create, edit, change roles)" },
  { key: "roles:manage", module: "roles", description: "Manage roles and toggle permissions" },
];

const rolesToSeed = [
  { name: "admin", displayName: "Administrator", description: "Full system control", isSystem: true },
  { name: "user", displayName: "Standard User", description: "Default application access", isSystem: true },
];

async function seed() {
  console.log("🌱 Starting Database Seeding...");

  try {
    console.log("  Seeding permissions...");
    const seededPermissions = [];
    for (const perm of permissionsToSeed) {
      const [existing] = await db
        .select()
        .from(schema.permission)
        .where(eq(schema.permission.key, perm.key))
        .limit(1);

      if (!existing) {
        const [inserted] = await db.insert(schema.permission).values(perm).returning();
        console.log(`    + Created permission: ${perm.key}`);
        seededPermissions.push(inserted);
      } else {
        seededPermissions.push(existing);
      }
    }

    console.log("  Seeding roles...");
    const seededRoles: Record<string, typeof schema.role.$inferSelect> = {};
    for (const roleData of rolesToSeed) {
      const [existing] = await db
        .select()
        .from(schema.role)
        .where(eq(schema.role.name, roleData.name))
        .limit(1);

      if (!existing) {
        const [inserted] = await db.insert(schema.role).values(roleData).returning();
        console.log(`    + Created role: ${roleData.name}`);
        seededRoles[roleData.name] = inserted;
      } else {
        seededRoles[roleData.name] = existing;
      }
    }

    console.log("  Associating permissions with roles...");
    const adminRole = seededRoles["admin"];
    if (adminRole) {
      for (const perm of seededPermissions) {
        const existingRelation = await db.query.rolePermission.findFirst({
          where: (rp, { and, eq }) =>
            and(eq(rp.roleId, adminRole.id), eq(rp.permissionId, perm.id)),
        });

        if (!existingRelation) {
          await db.insert(schema.rolePermission).values({
            roleId: adminRole.id,
            permissionId: perm.id,
          });
          console.log(`    + Assigned ${perm.key} to role ${adminRole.name}`);
        }
      }
    }

    // Ensure the standard user role has no permissions assigned by default
    const userRole = seededRoles["user"];
    const viewUserPerm = seededPermissions.find((p) => p.key === "users:view");
    if (userRole && viewUserPerm) {
      const existingRelation = await db.query.rolePermission.findFirst({
        where: (rp, { and, eq }) =>
          and(eq(rp.roleId, userRole.id), eq(rp.permissionId, viewUserPerm.id)),
      });

      if (existingRelation) {
        await db
          .delete(schema.rolePermission)
          .where(
            and(
              eq(schema.rolePermission.roleId, userRole.id),
              eq(schema.rolePermission.permissionId, viewUserPerm.id)
            )
          );
        console.log(`    - Cleaned up default user permission association: removed ${viewUserPerm.key} from role ${userRole.name}`);
      }
    }

    console.log("  Seeding trial users...");
    const adminEmail = "admin@thunder.com";
    
    // Clean up existing trial admin user to ensure accounts table is populated correctly
    const existingAdmin = await db.query.user.findFirst({
      where: eq(schema.user.email, adminEmail),
    });
    if (existingAdmin) {
      await db.delete(schema.account).where(eq(schema.account.userId, existingAdmin.id));
      await db.delete(schema.userRole).where(eq(schema.userRole.userId, existingAdmin.id));
      await db.delete(schema.user).where(eq(schema.user.id, existingAdmin.id));
      console.log(`    - Cleaned up old admin user: ${adminEmail}`);
    }

    const adminUserId = crypto.randomUUID();
    const [insertedAdmin] = await db.insert(schema.user).values({
      id: adminUserId,
      name: "Trial Admin",
      email: adminEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    const adminUser = insertedAdmin;
    console.log(`    + Created user: ${adminEmail}`);

    const adminPasswordHash = await hashPassword("AdminPassword123");
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: adminEmail,
      providerId: "credential",
      userId: adminUserId,
      password: adminPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`    + Created account credentials for ${adminEmail}`);

    // Ensure admin user is linked to all roles (both admin and user)
    const dbAdminRole = seededRoles["admin"];
    const dbUserRole = seededRoles["user"];
    if (adminUser && dbAdminRole && dbUserRole) {
      await db.insert(schema.userRole).values({
        userId: adminUser.id,
        roleId: dbAdminRole.id,
        isActive: true,
      });
      console.log(`    + Linked user ${adminEmail} to role admin (Active)`);

      await db.insert(schema.userRole).values({
        userId: adminUser.id,
        roleId: dbUserRole.id,
        isActive: false,
      });
      console.log(`    + Linked user ${adminEmail} to role user (Inactive)`);
    }

    const userEmail = "user@thunder.com";
    
    // Clean up existing trial standard user
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, userEmail),
    });
    if (existingUser) {
      await db.delete(schema.account).where(eq(schema.account.userId, existingUser.id));
      await db.delete(schema.userRole).where(eq(schema.userRole.userId, existingUser.id));
      await db.delete(schema.user).where(eq(schema.user.id, existingUser.id));
      console.log(`    - Cleaned up old standard user: ${userEmail}`);
    }

    const normalUserId = crypto.randomUUID();
    const [insertedNormal] = await db.insert(schema.user).values({
      id: normalUserId,
      name: "Trial User",
      email: userEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    const normalUser = insertedNormal;
    console.log(`    + Created user: ${userEmail}`);

    const userPasswordHash = await hashPassword("UserPassword123");
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: userEmail,
      providerId: "credential",
      userId: normalUserId,
      password: userPasswordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`    + Created account credentials for ${userEmail}`);

    // Ensure normal user is linked to user role
    if (normalUser && dbUserRole) {
      await db.insert(schema.userRole).values({
        userId: normalUser.id,
        roleId: dbUserRole.id,
        isActive: true,
      });
      console.log(`    + Linked user ${userEmail} to role user`);
    }

    console.log("🎉 Database Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
