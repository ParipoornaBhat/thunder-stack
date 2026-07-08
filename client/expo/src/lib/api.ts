import { Platform } from "react-native";
import Constants from "expo-constants";

let sessionToken: string | null = null;

export const setToken = (token: string | null) => {
  sessionToken = token;
};

export const getToken = () => {
  return sessionToken;
};

const getDevServerIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.developer?.tool;
  if (typeof hostUri === "string") {
    return hostUri.split(":")[0];
  }
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

let BACKEND_URL = process.env.EXPO_PUBLIC_SERVER_URL;

if (!BACKEND_URL) {
  const ip = getDevServerIp();
  BACKEND_URL = `http://${ip}:4000`;
} else if (BACKEND_URL.includes("localhost") || BACKEND_URL.includes("127.0.0.1")) {
  const ip = getDevServerIp();
  BACKEND_URL = BACKEND_URL.replace("localhost", ip).replace("127.0.0.1", ip);
}

export const getServerUrl = () => BACKEND_URL;

export async function fetchAPI(path: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}
