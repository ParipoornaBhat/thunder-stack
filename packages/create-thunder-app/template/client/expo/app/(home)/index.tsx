import { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  useColorScheme, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput
} from "react-native";
import { useAuth } from "../_layout";
import { Shield, Sparkles, User, Info, Key, Fingerprint, ShieldCheck, ChevronDown, Mail, ShieldAlert } from "lucide-react-native";
import { fetchAPI } from "../../src/lib/api";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, activeRole, permissions, roles, refreshProfile, switchRole, logout } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // OTP password reset states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStep, setPasswordStep] = useState(1); // 1 = trigger button, 2 = forms
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      // Fetch stats
      const statsData = await fetchAPI("/api/users/dashboard-stats");
      setStats(statsData);
    } catch (e: any) {
      console.log("Error loading dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoleSwitch = async (roleId: string) => {
    try {
      await switchRole(roleId);
      Alert.alert("Success", "Switched active role!");
      setRoleDropdownOpen(false);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to switch role");
    }
  };

  const handleSendOtp = async () => {
    if (!user?.email) return;
    setUpdatingPassword(true);
    try {
      await fetchAPI("/api/users/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: user.email }),
      });
      Alert.alert("Success", "Verification code sent to your email!");
      setPasswordStep(2);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to send code");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user?.email) return;
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

    setUpdatingPassword(true);
    try {
      await fetchAPI("/api/users/reset-password-otp", {
        method: "POST",
        body: JSON.stringify({ email: user.email, otp, newPassword }),
      });
      Alert.alert("Success", "Password updated successfully!");
      setPasswordStep(1);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Invalid or expired OTP");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#f8fafc",
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    welcomeBanner: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      position: "relative",
      overflow: "hidden",
    },
    welcomeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: isDark ? "#ffffff" : "#0f172a",
    },
    subtitle: {
      fontSize: 13,
      color: isDark ? "#a3a3a3" : "#64748b",
      marginTop: 2,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: "rgba(37, 99, 235, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(37, 99, 235, 0.2)",
      gap: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#2563eb",
    },
    card: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#ffffff" : "#0f172a",
    },
    infoGroup: {
      gap: 12,
    },
    infoItem: {
      gap: 2,
    },
    infoLabel: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      color: isDark ? "#737373" : "#94a3b8",
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#e5e5e5" : "#334155",
    },
    rolePill: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: activeRole?.name === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
      borderWidth: 1,
      borderColor: activeRole?.name === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
      marginTop: 2,
    },
    rolePillText: {
      fontSize: 11,
      fontWeight: "700",
      color: activeRole?.name === 'admin' ? '#ef4444' : '#22c55e',
    },
    permContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    permPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(37, 99, 235, 0.15)" : "rgba(37, 99, 235, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(37, 99, 235, 0.15)",
    },
    permText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#60a5fa" : "#1d4ed8",
    },
    noPerms: {
      fontSize: 13,
      color: isDark ? "#737373" : "#94a3b8",
      fontStyle: "italic",
    },
    roleSelector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#262626" : "#f8fafc",
      marginTop: 8,
    },
    roleSelectorText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#0f172a",
    },
    dropdown: {
      marginTop: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#262626" : "#f8fafc",
      padding: 4,
      gap: 2,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
      borderRadius: 6,
    },
    dropdownItemActive: {
      backgroundColor: "rgba(37, 99, 235, 0.1)",
    },
    dropdownText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#ffffff" : "#0f172a",
    },
    dropdownTextActive: {
      color: "#2563eb",
    }
  });

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "#121212" : "#f8fafc" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.title}>Hello, {user?.name || "User"}</Text>
            <Text style={styles.subtitle}>Welcome to THUNDER Mobile</Text>
          </View>
          <View style={styles.badge}>
            <Shield size={14} color="#2563eb" />
            <Text style={styles.badgeText}>{activeRole?.displayName || "Standard"}</Text>
          </View>
        </View>
      </View>

      {/* System Statistics Section */}
      {stats && (stats.usersCount !== null || stats.rolesCount !== null || stats.permissionsCount !== null) && (
        <View style={{ gap: 12 }}>
          {stats.usersCount !== null && (
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 16 }]}>
              <View style={{ height: 44, width: 44, borderRadius: 12, backgroundColor: "rgba(37, 99, 235, 0.1)", alignItems: "center", justifyContent: "center" }}>
                <User size={22} color="#2563eb" />
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>{stats.usersCount}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#a3a3a3" : "#64748b", marginTop: 2 }}>Total Registered Users</Text>
              </View>
            </View>
          )}

          {stats.rolesCount !== null && (
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 16 }]}>
              <View style={{ height: 44, width: 44, borderRadius: 12, backgroundColor: "rgba(99, 102, 241, 0.1)", alignItems: "center", justifyContent: "center" }}>
                <Shield size={22} color="#6366f1" />
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>{stats.rolesCount}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#a3a3a3" : "#64748b", marginTop: 2 }}>Configured System Roles</Text>
              </View>
            </View>
          )}

          {stats.permissionsCount !== null && (
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 16 }]}>
              <View style={{ height: 44, width: 44, borderRadius: 12, backgroundColor: "rgba(16, 185, 129, 0.1)", alignItems: "center", justifyContent: "center" }}>
                <Key size={22} color="#10b981" />
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>{stats.permissionsCount}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#a3a3a3" : "#64748b", marginTop: 2 }}>System Permissions</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Role Switcher */}
      {roles.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.infoLabel}>Switch Active Role</Text>
          <TouchableOpacity 
            style={styles.roleSelector}
            onPress={() => setRoleDropdownOpen(!roleDropdownOpen)}
          >
            <Text style={styles.roleSelectorText}>Active: {activeRole?.displayName}</Text>
            <ChevronDown size={16} color={isDark ? "#ffffff" : "#0f172a"} />
          </TouchableOpacity>
          
          {roleDropdownOpen && (
            <View style={styles.dropdown}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.dropdownItem, r.isActive && styles.dropdownItemActive]}
                  onPress={() => handleRoleSwitch(r.id)}
                >
                  <Text style={[styles.dropdownText, r.isActive && styles.dropdownTextActive]}>
                    {r.displayName}
                  </Text>
                  {r.isActive && <ShieldCheck size={14} color="#2563eb" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Profile info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <User size={18} color="#2563eb" />
          <Text style={styles.cardTitle}>User Details</Text>
        </View>
        <View style={styles.infoGroup}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Display Name</Text>
            <Text style={styles.infoValue}>{user?.name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          {user?.phone && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phone}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Active Role Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Info size={18} color="#6366f1" />
          <Text style={styles.cardTitle}>Role Details</Text>
        </View>
        <View style={styles.infoGroup}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Role Display Name</Text>
            <Text style={styles.infoValue}>{activeRole?.displayName || "N/A"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>System ID</Text>
            <Text style={[styles.infoValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }]}>
              {activeRole?.id || "N/A"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Privilege Class</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>
                {activeRole?.name === 'admin' ? 'Superuser' : 'Standard User'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Permissions Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Key size={18} color="#10b981" />
          <Text style={styles.cardTitle}>Authorized Permissions ({permissions.length})</Text>
        </View>
        {permissions.length > 0 ? (
          <View style={styles.permContainer}>
            {permissions.map((p) => (
              <View key={p} style={styles.permPill}>
                <Text style={styles.permText}>{p}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noPerms}>
            {activeRole?.name === "admin" 
              ? "Administrator has full access by default." 
              : "No specific permissions granted."}
          </Text>
        )}
      </View>

      {/* Security & Password Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Key size={18} color="#2563eb" />
          <Text style={styles.cardTitle}>Forgot / Reset Password</Text>
        </View>
        
        {passwordStep === 1 ? (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 12, color: isDark ? "#a3a3a3" : "#64748b", lineHeight: 18 }}>
              If you forgot your password or want to configure a new one, click the button below to send a 6-digit verification code to your registered email to configure a new credential password.
            </Text>
            <TouchableOpacity 
              style={[styles.roleSelector, { marginTop: 4, justifyContent: "center", backgroundColor: "#2563eb", borderColor: "#2563eb" }]}
              onPress={handleSendOtp}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.roleSelectorText, { color: "#ffffff" }]}>Forgot / Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Verification Code (OTP)</Text>
              <TextInput
                maxLength={6}
                keyboardType="number-pad"
                placeholder="Enter 6-digit code"
                placeholderTextColor={isDark ? "#737373" : "#94a3b8"}
                value={otp}
                onChangeText={setOtp}
                style={[styles.roleSelector, { marginTop: 4, paddingVertical: 8, height: 44, color: isDark ? "#ffffff" : "#000000" }]}
              />
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>New Password</Text>
              <TextInput
                secureTextEntry
                placeholder="Min. 8 characters"
                placeholderTextColor={isDark ? "#737373" : "#94a3b8"}
                value={newPassword}
                onChangeText={setNewPassword}
                style={[styles.roleSelector, { marginTop: 4, paddingVertical: 8, height: 44, color: isDark ? "#ffffff" : "#000000" }]}
              />
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Confirm Password</Text>
              <TextInput
                secureTextEntry
                placeholder="Repeat password"
                placeholderTextColor={isDark ? "#737373" : "#94a3b8"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.roleSelector, { marginTop: 4, paddingVertical: 8, height: 44, color: isDark ? "#ffffff" : "#000000" }]}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <TouchableOpacity 
                style={[styles.roleSelector, { flex: 1, justifyContent: "center", backgroundColor: "#2563eb", borderColor: "#2563eb" }]}
                onPress={handleUpdatePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.roleSelectorText, { color: "#ffffff" }]}>Update Password</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleSelector, { flex: 1, justifyContent: "center" }]}
                onPress={() => setPasswordStep(1)}
                disabled={updatingPassword}
              >
                <Text style={styles.roleSelectorText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
