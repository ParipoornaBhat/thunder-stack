import { createAuthClient } from "better-auth/react";
import { getServerUrl } from "./config";

const getBaseURL = () => {
  const serverUrl = getServerUrl();
  return `${serverUrl.replace(/\/$/, "")}/api/auth`;
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
