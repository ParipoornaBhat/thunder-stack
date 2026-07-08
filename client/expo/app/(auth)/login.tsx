import { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  useColorScheme, 
  ScrollView,
  Platform,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../_layout";
import { getServerUrl } from "../../src/lib/api";
import { Lock, Mail, ShieldAlert, Shield } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

// Authentication Mode: "inweb" (works in Expo Go) or "inapp" (native SDK, requires standalone build)
const GOOGLE_AUTH_MODE: "inweb" | "inapp" = "inweb";

let GoogleSignin: any;
if ((GOOGLE_AUTH_MODE as string) === "inapp") {
  GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  });
}

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const performLogin = async (emailVal: string, passwordVal: string) => {
    if (!emailVal || !passwordVal) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailVal, password: passwordVal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || "Invalid credentials");
      }

      Alert.alert("Success", "Welcome back!");
      login(data.token, data.user);
      router.replace("/(home)");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => performLogin(email, password);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const serverUrl = getServerUrl();
      let tokenVal: string | null = null;

      if ((GOOGLE_AUTH_MODE as string) === "inapp") {
        // ── Native In-App Flow ────────────────────────────────────────────────
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const idToken = userInfo.data?.idToken;

        if (!idToken) {
          throw new Error("No ID Token returned from Google native sign-in");
        }

        // Exchange the native ID token with Hono server for a session token
        const response = await fetch(`${serverUrl}/api/auth/sign-in/social`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: "google",
            idToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed server authentication status: ${response.status}`);
        }

        const sessionData = await response.json();
        tokenVal = sessionData.token || sessionData.session?.token;
      } else {
        // ── Web Browser Redirect Flow (Expo Go compatible) ─────────────────────
        const redirectUrl = Linking.createURL("/auth-callback");
        const authUrl = `${serverUrl}/api/auth/login/social?provider=google&callbackURL=${encodeURIComponent(
          `${serverUrl}/api/auth/mobile-callback?redirect_uri=${redirectUrl}`
        )}`;
        
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        
        if (result.type === "success" && result.url) {
          const parsed = Linking.parse(result.url);
          if (parsed.queryParams && parsed.queryParams.token) {
            tokenVal = parsed.queryParams.token as string;
          } else {
            throw new Error("No token received from Google authentication redirect");
          }
        }
      }

      if (!tokenVal) {
        throw new Error("Authentication flow cancelled or failed to retrieve session token");
      }

      login(tokenVal, {});

      // Load user profile
      const profileRes = await fetch(`${serverUrl}/api/users/profile`, {
        headers: {
          "Authorization": `Bearer ${tokenVal}`,
        }
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        login(tokenVal, profileData.user);
        router.replace("/(home)");
      } else {
        throw new Error("Failed to load user profile");
      }
    } catch (e: any) {
      Alert.alert("Google Login Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#f8fafc",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    logoBox: {
      height: 56,
      width: 56,
      borderRadius: 16,
      backgroundColor: "#2563eb",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#2563eb",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: isDark ? "#ffffff" : "#0f172a",
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? "#a3a3a3" : "#64748b",
      textAlign: "center",
      marginTop: 6,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      gap: 6,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      color: isDark ? "#a3a3a3" : "#64748b",
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 14,
      color: isDark ? "#ffffff" : "#0f172a",
      marginLeft: 8,
    },
    loginButton: {
      height: 48,
      borderRadius: 12,
      backgroundColor: "#2563eb",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#2563eb",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
      marginTop: 8,
    },
    loginButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
    },
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      gap: 8,
      marginTop: 16,
    },
    googleButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#0f172a",
    },
    dividerWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#2d2d2d" : "#e2e8f0",
    },
    dividerText: {
      fontSize: 12,
      color: isDark ? "#6b7280" : "#94a3b8",
      marginHorizontal: 12,
      textTransform: "uppercase",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    footerText: {
      fontSize: 14,
      color: isDark ? "#a3a3a3" : "#64748b",
    },
    footerLink: {
      fontSize: 14,
      fontWeight: "700",
      color: "#2563eb",
    },
    trialCreds: {
      marginTop: 24,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#1e1e1e" : "#f1f5f9",
    },
    trialTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#ffffff" : "#0f172a",
      textAlign: "center",
      marginBottom: 8,
    },
    trialRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    trialCol: {
      flex: 1,
      gap: 2,
    },
    trialLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: "#2563eb",
    },
    trialText: {
      fontSize: 10,
      color: isDark ? "#a3a3a3" : "#64748b",
    },
    forgotPasswordContainer: {
      alignItems: "flex-end",
      marginTop: 8,
      marginBottom: 16,
    },
    forgotPasswordText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#2563eb",
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <ShieldAlert size={28} color="#ffffff" />
          </View>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>THUNDER Stack mobile application</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={isDark ? "#a3a3a3" : "#64748b"} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={isDark ? "#a3a3a3" : "#64748b"} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerWrapper}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.googleButtonText}>Sign In with Google</Text>
        </TouchableOpacity>

        <View style={styles.trialCreds}>
          <Text style={styles.trialTitle}>Quick Demo Sign In</Text>
          <View style={styles.trialRow}>
            <TouchableOpacity 
              style={[styles.trialCol, { backgroundColor: isDark ? "#2a2a2a" : "#e2e8f0", padding: 10, borderRadius: 8 }]} 
              onPress={() => {
                setEmail("admin@thunder.com");
                setPassword("AdminPassword123");
                performLogin("admin@thunder.com", "AdminPassword123");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.trialLabel}>Admin</Text>
              <Text style={styles.trialText}>admin@thunder.com</Text>
              <Text style={[styles.trialText, { fontWeight: "bold", marginTop: 4, color: "#2563eb" }]}>Tap to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.trialCol, { backgroundColor: isDark ? "#2a2a2a" : "#e2e8f0", padding: 10, borderRadius: 8, marginLeft: 10 }]} 
              onPress={() => {
                setEmail("user@thunder.com");
                setPassword("UserPassword123");
                performLogin("user@thunder.com", "UserPassword123");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.trialLabel}>Standard User</Text>
              <Text style={styles.trialText}>user@thunder.com</Text>
              <Text style={[styles.trialText, { fontWeight: "bold", marginTop: 4, color: "#2563eb" }]}>Tap to Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
