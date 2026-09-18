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
import { Lock, Mail, ShieldAlert, User } from "lucide-react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { login } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || "Registration failed");
      }

      Alert.alert("Success", "Account created successfully!");
      login(data.token, data.user);
      router.replace("/(home)");
    } catch (e: any) {
      Alert.alert("Registration Failed", e.message || "Something went wrong");
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
    registerButton: {
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
    registerButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
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
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <ShieldAlert size={28} color="#ffffff" />
          </View>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Create your THUNDER Stack mobile account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={isDark ? "#a3a3a3" : "#64748b"} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

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

          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.registerButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
