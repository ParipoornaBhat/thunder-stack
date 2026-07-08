import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db, user, session, account, verification, userRole, role } from "@thunder/db";
import { sendOTP } from "./email.js";

const getEnv = (key: string, fallback: string): string => {
  return (process.env[key] || (globalThis as any)[key] || fallback) as string;
};

let _auth: any = null;

const getAuth = () => {
  if (!_auth) {
    _auth = betterAuth({
      plugins: [
        emailOTP({
          async sendVerificationOTP({ email, otp }) {
            await sendOTP(email, otp);
          },
        }),
      ],
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
          user,
          session,
          account,
          verification,
        },
      }),
      secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-dev",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
      trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        google: {
          clientId: [
            process.env.GOOGLE_CLIENT_ID || "google-id",
            process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || "expo-web-id",
            process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || "expo-ios-id",
            process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || "expo-android-id"
          ],
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-secret",
        },
      },
      user: {
        additionalFields: {
          phone: {
            type: "string",
            required: false,
            input: true,
          },
          gender: {
            type: "string",
            required: false,
            input: true,
          },
          onboarded: {
            type: "boolean",
            required: false,
            defaultValue: false,
            input: false,
          },
        },
      },
      databaseHooks: {
        user: {
          create: {
            after: async (createdUser) => {
              try {
                if (createdUser.email === "admin@thunder.com") {
                  const adminRole = await db.query.role.findFirst({
                    where: (r, { eq }) => eq(r.name, "admin"),
                  });
                  if (adminRole) {
                    await db.insert(userRole).values({
                      userId: createdUser.id,
                      roleId: adminRole.id,
                      isActive: true,
                    });
                  }
                  return;
                }

                if (createdUser.email === "user@thunder.com") {
                  const defaultRole = await db.query.role.findFirst({
                    where: (r, { eq }) => eq(r.name, "user"),
                  });
                  if (defaultRole) {
                    await db.insert(userRole).values({
                      userId: createdUser.id,
                      roleId: defaultRole.id,
                      isActive: true,
                    });
                  }
                  return;
                }

                const userCountResult = await db.query.user.findMany({ limit: 2 });
                const isFirstUser = userCountResult.length <= 1;
                const targetRoleName = isFirstUser ? "admin" : "user";
                
                const dbRole = await db.query.role.findFirst({
                  where: (r, { eq }) => eq(r.name, targetRoleName),
                });
                
                if (dbRole) {
                  await db.insert(userRole).values({
                    userId: createdUser.id,
                    roleId: dbRole.id,
                    isActive: true,
                  });
                }
              } catch (err) {
                console.error("Failed to auto-assign default role to new user:", err);
              }
            },
          },
        },
      },
    });
  }
  return _auth;
};

export const auth = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getAuth();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getAuth();
    return Reflect.set(instance, prop, value, receiver);
  }
}) as unknown as ReturnType<typeof betterAuth>;

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
