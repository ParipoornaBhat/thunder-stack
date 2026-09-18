import { Hono } from "hono";
import { roleService } from "@thunder/db";
import { requirePermission } from "../lib/permissions.js";
import type { Env } from "../lib/permissions.js";

const router = new Hono<Env>();

router.use("*", requirePermission("roles:manage"));

// ── List Roles with User Counts ─────────────────────────────────────────────
router.get("/", async (c) => {
  const roles = await roleService.getRolesWithCounts();
  return c.json(roles);
});

// ── Create Role ─────────────────────────────────────────────────────────────
router.post("/", async (c) => {
  const { name, displayName, description } = await c.req.json();

  if (!name || !displayName) {
    return c.json({ error: "Name and Display Name are required" }, 400);
  }

  try {
    const newRole = await roleService.createRole({ name, displayName, description });
    return c.json({ success: true, role: newRole });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to create role" }, 400);
  }
});

// ── Delete Role ─────────────────────────────────────────────────────────────
router.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await roleService.deleteRole(id);
    return c.json({ success: true, message: "Role deleted successfully" });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to delete role" }, 400);
  }
});

// ── List All Available Permissions ──────────────────────────────────────────
router.get("/permissions", async (c) => {
  const perms = await roleService.listPermissions();
  return c.json(perms);
});

// ── Toggle Permission for Role ──────────────────────────────────────────────
router.post("/:id/permissions", async (c) => {
  const roleId = c.req.param("id");
  const { permissionId } = await c.req.json();

  if (!permissionId) {
    return c.json({ error: "permissionId is required" }, 400);
  }

  try {
    const result = await roleService.togglePermission(roleId, permissionId);
    return c.json({ success: true, ...result });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to update permissions" }, 400);
  }
});

export default router;
