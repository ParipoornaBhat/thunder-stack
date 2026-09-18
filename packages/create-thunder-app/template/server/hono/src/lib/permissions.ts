import type { Context, Next } from "hono";
import { auth } from "./auth.js";
import { authService } from "@thunder/db";

export interface AuthContext {
  session: any;
  user: any;
  activeRole: {
    id: string;
    name: string;
    displayName: string;
  } | null;
  permissions: string[];
}

export type Env = {
  Variables: {
    auth: AuthContext;
  };
};

export async function getAuthContext(c: Context): Promise<AuthContext | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session || !session.user) {
    return null;
  }

  // Session hijacking protection: check if User-Agent matches the session's recorded User-Agent (Commented out to prevent accidental deletion during client/server fetches)
  // const incomingUserAgent = c.req.header("user-agent");
  // if (session.session.userAgent && incomingUserAgent && session.session.userAgent !== incomingUserAgent) {
  //   console.warn(`[SECURITY WARNING] Session copied or hijacked! User-Agent mismatch. Stored: "${session.session.userAgent}", Incoming: "${incomingUserAgent}"`);
  // 
  //   // Revoke the session permanently by deleting it from the database
  //   try {
  //     await authService.revokeSessionByToken(session.session.token);
  //     console.log(`[SECURITY] Successfully revoked hijacked session token: ${session.session.token.substring(0, 10)}...`);
  //   } catch (e) {
  //     console.error("Failed to revoke hijacked session:", e);
  //   }
  //   return null;
  // }

  const contextData = await authService.getUserAuthContext(session.user.id);

  return {
    session,
    user: session.user,
    ...contextData,
  };
}

export const requireLogin = async (c: Context<Env>, next: Next) => {
  const authCtx = await getAuthContext(c);
  if (!authCtx) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("auth", authCtx);
  await next();
};

export const requirePermission = (permissionKey: string) => {
  return async (c: Context<Env>, next: Next) => {
    let authCtx: AuthContext | null = c.get("auth");
    if (!authCtx) {
      authCtx = await getAuthContext(c);
      if (!authCtx) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      c.set("auth", authCtx);
    }

    if (authCtx.activeRole?.name === "admin") {
      await next();
      return;
    }

    if (!authCtx.permissions.includes(permissionKey)) {
      return c.json(
        { error: `Forbidden. Missing permission: ${permissionKey}` },
        403
      );
    }

    await next();
  };
};
