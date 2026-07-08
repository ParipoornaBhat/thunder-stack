import { Hono } from "hono";
import { userService, roleService } from "@thunder/db";
import { requireLogin, requirePermission, getAuthContext } from "../lib/permissions.js";
import type { Env } from "../lib/permissions.js";
import { auth } from "../lib/auth.js";
import { hashPassword } from "better-auth/crypto";
import { sendOTP } from "../lib/email.js";

const router = new Hono<Env>();

// ── Simple in-memory rate limiter ────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const rateLimit = (key: string, maxAttempts: number, windowMs: number): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > maxAttempts;
};

// ── Development Only: Seed Trial Users ──────────────────────────────────────
router.post("/seed-trial", async (c) => {
  if (process.env.NODE_ENV === "production") {
    return c.json({ error: "Not available in production" }, 403);
  }

  try {
    console.log("🌱 Seeding trial credentials...");
    
    try {
      await auth.api.signUpEmail({
        body: {
          email: "admin@thunder.com",
          password: "AdminPassword123",
          name: "Trial Admin",
        },
      });
      console.log("   Admin seeded");
    } catch (e: any) {
      console.log("   Admin could not be seeded (probably already exists):", e.message);
    }

    try {
      await auth.api.signUpEmail({
        body: {
          email: "user@thunder.com",
          password: "UserPassword123",
          name: "Trial User",
        },
      });
      console.log("   User seeded");
    } catch (e: any) {
      console.log("   User could not be seeded (probably already exists):", e.message);
    }

    return c.json({
      success: true,
      message: "Trial login credentials initialized successfully!",
      credentials: [
        { role: "admin", email: "admin@thunder.com", password: "AdminPassword123" },
        { role: "user", email: "user@thunder.com", password: "UserPassword123" }
      ]
    });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to seed trial users" }, 500);
  }
});

// ── Get Current Profile with Active Role and Permissions ────────────────────
router.get("/profile", async (c) => {
  const authCtx = await getAuthContext(c);
  if (!authCtx) {
    return c.json({ error: "Not logged in" }, 401);
  }
  
  const assignedRoles = await userService.getUserRoles(authCtx.user.id);

  return c.json({
    user: authCtx.user,
    activeRole: authCtx.activeRole,
    permissions: authCtx.permissions,
    roles: assignedRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
      isActive: ur.isActive,
    })),
  });
});

// ── Get Dashboard Stats based on Permissions ─────────────────────────────────
router.get("/dashboard-stats", requireLogin, async (c) => {
  const authCtx = c.get("auth");
  const isAdmin = authCtx.activeRole?.name === "admin";

  const stats = {
    usersCount: null as number | null,
    rolesCount: null as number | null,
    permissionsCount: null as number | null,
  };

  try {
    if (isAdmin || authCtx.permissions.includes("users:view")) {
      const usersData = await userService.getPaginatedUsers({ page: 1, limit: 1 });
      stats.usersCount = usersData.totalCount;
    }

    if (isAdmin || authCtx.permissions.includes("roles:manage")) {
      const roles = await roleService.getRolesWithCounts();
      stats.rolesCount = roles.length;

      const perms = await roleService.listPermissions();
      stats.permissionsCount = perms.length;
    }

    return c.json(stats);
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to fetch stats" }, 500);
  }
});

// ── Switch Active Role ──────────────────────────────────────────────────────
router.post("/switch-role", requireLogin, async (c) => {
  const authCtx = c.get("auth");
  const { roleId } = await c.req.json();
  
  if (!roleId) {
    return c.json({ error: "roleId is required" }, 400);
  }

  try {
    await userService.switchUserRole(authCtx.user.id, roleId);
    return c.json({ success: true, message: "Active role switched successfully" });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to switch role" }, 400);
  }
});

// ── List Users (Paginated, Searchable) ──────────────────────────────────────
router.get("/", requirePermission("users:view"), async (c) => {
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const limit = Math.max(1, Math.min(100, Number(c.req.query("limit") || 10)));
  const search = c.req.query("search") || "";

  const data = await userService.getPaginatedUsers({ page, limit, search });
  return c.json(data);
});

// ── Update User Roles (Assign / Remove) ─────────────────────────────────────
router.post("/:id/role", requirePermission("users:manage"), async (c) => {
  const userId = c.req.param("id");
  const { roleId, assign } = await c.req.json();

  if (!userId) {
    return c.json({ error: "User ID is required" }, 400);
  }

  if (!roleId) {
    return c.json({ error: "roleId is required" }, 400);
  }

  try {
    await userService.updateUserRole(userId, roleId, assign);
    return c.json({ success: true, message: "User roles updated successfully" });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to update role" }, 400);
  }
});

// ── Forgot Password - Send OTP ──────────────────────────────────────────────
router.post("/forgot-password", async (c) => {
  const { email } = await c.req.json();
  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  // Don't reveal whether account exists — always return success
  const dbUser = await userService.findByEmail(email);

  if (!dbUser) {
    return c.json({ success: true, message: "If an account exists with this email, a verification code has been sent." });
  }

  // Rate limit: max 3 OTP requests per email per 10 minutes
  const rateLimitKey = `forgot:${email.toLowerCase().trim()}`;
  if (rateLimit(rateLimitKey, 3, 10 * 60 * 1000)) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await userService.createVerificationOTP(email, otp, expiresAt);

  try {
    await sendOTP(email.toLowerCase().trim(), otp);
    return c.json({ success: true, message: "If an account exists with this email, a verification code has been sent." });
  } catch (error: any) {
    return c.json({ error: "Failed to send email. Please try again later." }, 500);
  }
});

// ── Reset Password with OTP ────────────────────────────────────────────────
router.post("/reset-password-otp", async (c) => {
  const { email, otp, newPassword } = await c.req.json();
  if (!email || !otp || !newPassword) {
    return c.json({ error: "Email, OTP, and new password are required" }, 400);
  }

  // Rate limit: max 5 reset attempts per email per 15 minutes
  const rateLimitKey = `reset:${email.toLowerCase().trim()}`;
  if (rateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
    return c.json({ error: "Too many attempts. Please try again later." }, 429);
  }

  if (newPassword.length < 8) {
    return c.json({ error: "Password must be at least 8 characters long" }, 400);
  }

  const cleanEmail = email.toLowerCase().trim();

  const record = await userService.getVerificationOTP(cleanEmail, otp);

  if (!record) {
    return c.json({ error: "Invalid OTP code" }, 400);
  }

  if (new Date() > record.expiresAt) {
    await userService.deleteVerificationOTP(record.id);
    return c.json({ error: "OTP code has expired" }, 400);
  }

  const dbUser = await userService.findByEmail(cleanEmail);

  if (!dbUser) {
    return c.json({ error: "User not found" }, 404);
  }

  const hashedPassword = await hashPassword(newPassword);

  await userService.updateUserPassword(dbUser.id, hashedPassword);

  await userService.deleteVerificationOTP(record.id);

  return c.json({ success: true, message: "Password reset successfully! You can now log in." });
});

export default router;
