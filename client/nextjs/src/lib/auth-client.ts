import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return `${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth`;
  }
  if (typeof window === "undefined") {
    return "http://localhost:4000/api/auth";
  }
  return `${window.location.origin}/api/auth`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signOut, signUp, useSession } = authClient;
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
