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
import { Lock, Mail, ShieldAlert, Key, ShieldCheck, ArrowLeft } from "lucide-react-native";
import { getServerUrl } from "../../src/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [step, setStep] = useState(1); // 1 = request, 2 = verify & reset
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/users/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      Alert.alert("Success", "Verification OTP sent to your email!");
      setStep(2);
    } catch (e: any) {
      Alert.alert("Request Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/users/reset-password-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired OTP");
      }

      Alert.alert("Success", "Password reset successfully! Please sign in.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      Alert.alert("Reset Failed", e.message || "Something went wrong");
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
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      gap: 8,
    },
    backButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#a3a3a3" : "#64748b",
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
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#ffffff" : "#0f172a",
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? "#a3a3a3" : "#64748b",
      textAlign: "center",
      paddingHorizontal: 16,
    },
    form: {
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#a3a3a3" : "#64748b",
      textTransform: "uppercase",
      letterSpacing: 0.5,
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
      paddingHorizontal: 16,
      gap: 12,
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 14,
      color: isDark ? "#ffffff" : "#0f172a",
    },
    actionButton: {
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
    actionButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color={isDark ? "#a3a3a3" : "#64748b"} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <ShieldCheck size={28} color="#ffffff" />
          </View>
          <Text style={styles.title}>
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 
              ? "Enter your email address to receive a 6-digit verification code."
              : "Enter the verification code and set your new account password."}
          </Text>
        </View>

        {step === 1 ? (
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

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleRequestOtp}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>Send OTP Code</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code (OTP)</Text>
              <View style={styles.inputWrapper}>
                <ShieldCheck size={18} color={isDark ? "#a3a3a3" : "#64748b"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Key size={18} color={isDark ? "#a3a3a3" : "#64748b"} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Key size={18} color={isDark ? "#a3a3a3" : "#64748b"} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat new password"
                  placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleResetPassword}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
