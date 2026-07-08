import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState, createContext, useContext } from "react";
import { useColorScheme, ActivityIndicator, View, Platform, Text } from "react-native";
import { setToken, fetchAPI, getServerUrl } from "../src/lib/api";
import * as Linking from "expo-linking";
import { Shield } from "lucide-react-native";

interface AuthContextType {
  token: string | null;
  user: any | null;
  activeRole: any | null;
  permissions: string[];
  roles: any[];
  login: (token: string, userData: any) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  switchRole: (roleId: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [activeRole, setActiveRole] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  const url = Linking.useURL();

  useEffect(() => {
    if (url) {
      const parsed = Linking.parse(url);
      if (parsed.queryParams && parsed.queryParams.token) {
        const tokenVal = parsed.queryParams.token as string;

        const loadProfile = async () => {
          setIsLoading(true);
          try {
            setTokenState(tokenVal);
            setToken(tokenVal);

            const serverUrl = getServerUrl();
            const res = await fetch(`${serverUrl}/api/users/profile`, {
              headers: {
                Authorization: `Bearer ${tokenVal}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              setActiveRole(data.activeRole);
              setPermissions(data.permissions);
              setRoles(data.roles || []);
            } else {
              setTokenState(null);
              setToken(null);
            }
          } catch (e) {
            console.log("Error loading profile from deep link", e);
            setTokenState(null);
            setToken(null);
          } finally {
            setIsLoading(false);
          }
        };

        loadProfile();
      }
    }
  }, [url]);

  const refreshProfile = async () => {
    try {
      const data = await fetchAPI("/api/users/profile");
      setUser(data.user);
      setActiveRole(data.activeRole);
      setPermissions(data.permissions);
      setRoles(data.roles || []);
    } catch (e) {
      console.log("Error loading profile", e);
      logout();
    }
  };

  const switchRole = async (roleId: string) => {
    setIsLoading(true);
    try {
      await fetchAPI("/api/users/switch-role", {
        method: "POST",
        body: JSON.stringify({ roleId }),
      });
      await refreshProfile();
    } catch (e) {
      console.log("Error switching role", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, userData: any) => {
    setTokenState(newToken);
    setToken(newToken);
    setUser(userData);
    setIsLoading(false);
  };

  const logout = () => {
    setTokenState(null);
    setToken(null);
    setUser(null);
    setActiveRole(null);
    setPermissions([]);
    setRoles([]);
    setIsLoading(false);
  };

  // Fetch profile when token is set and activeRole is missing
  useEffect(() => {
    if (token && !activeRole) {
      refreshProfile();
    }
  }, [token, activeRole]);

  // Protect routes based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace("/(home)");
    }
  }, [token, segments, isLoading]);

  useEffect(() => {
    // Initial loading checks
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colorScheme === "dark" ? "#0f172a" : "#ffffff",
        gap: 16
      }}>
        <View style={{
          height: 64,
          width: 64,
          borderRadius: 16,
          backgroundColor: colorScheme === "dark" ? "rgba(37, 99, 235, 0.15)" : "rgba(37, 99, 235, 0.08)",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(37, 99, 235, 0.2)",
        }}>
          <Shield size={32} color="#2563eb" />
        </View>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={{
          fontSize: 13,
          fontWeight: "600",
          color: colorScheme === "dark" ? "#94a3b8" : "#64748b",
          textAlign: "center"
        }}>
          Configuring workspace permissions...
        </Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, activeRole, permissions, roles, login, logout, refreshProfile, switchRole, isLoading }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
      </Stack>
    </AuthContext.Provider>
  );
}
