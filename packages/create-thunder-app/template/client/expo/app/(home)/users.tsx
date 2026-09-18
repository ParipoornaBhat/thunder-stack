import { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  useColorScheme, 
  Alert,
  Platform
} from "react-native";
import { useAuth } from "../_layout";
import { getServerUrl } from "../../src/lib/api";
import { Search, ShieldAlert, UserCheck, Shield, ChevronRight } from "lucide-react-native";

interface UserItem {
  id: string;
  name: string;
  email: string;
  roles: Array<{ id: string; name: string; displayName: string; isActive: boolean }>;
  activeRole: { id: string; name: string; displayName: string } | null;
}

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
}

export default function UsersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { token, activeRole, permissions } = useAuth();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Check permissions: admin role has global bypass, otherwise must have 'users:view'
  const hasAccess = activeRole?.name === "admin" || permissions.includes("users:view");

  const serverUrl = getServerUrl();

  const fetchUsers = async (pageNum = 1, showLoader = true) => {
    if (!hasAccess) return;
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/users?search=${encodeURIComponent(search)}&page=${pageNum}`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setPage(pageNum);
      } else {
        Alert.alert("Error", "Failed to load users list");
      }
    } catch (e) {
      console.log("Error fetching users", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRoles = async () => {
    if (!hasAccess) return;
    try {
      const res = await fetch(`${serverUrl}/api/roles`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (e) {
      console.log("Error fetching roles", e);
    }
  };

  useEffect(() => {
    if (hasAccess && token) {
      fetchUsers(1, true);
      fetchRoles();
    }
  }, [hasAccess, token, search]);

  const handleRoleToggle = async (userItem: UserItem, roleItem: RoleItem) => {
    setUpdatingUserId(userItem.id);
    const hasRole = userItem.roles.some((r) => r.id === roleItem.id);
    const assign = !hasRole;

    try {
      const res = await fetch(`${serverUrl}/api/users/${userItem.id}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ roleId: roleItem.id, assign }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", assign ? "Role assigned successfully" : "Role removed successfully");
        fetchUsers(page, false);
      } else {
        Alert.alert("Update Failed", data.error || "Failed to update user role");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to communicate with backend");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleOptions = (userItem: UserItem) => {
    if (updatingUserId) return;
    
    // Create role selection options
    const options = roles.map((r) => {
      const isAssigned = userItem.roles.some((ur) => ur.id === r.id);
      return {
        text: `${isAssigned ? "Remove" : "Assign"} ${r.displayName}`,
        onPress: () => handleRoleToggle(userItem, r),
      };
    });

    Alert.alert(
      "Manage Roles",
      `Manage privileges for ${userItem.name}`,
      [
        ...options,
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const renderUserCard = ({ item }: { item: UserItem }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
        
        {/* Roles Badges */}
        <View style={styles.rolesContainer}>
          {item.roles.map((r) => (
            <View 
              key={r.id} 
              style={[
                styles.roleBadge,
                r.isActive ? styles.roleBadgeActive : styles.roleBadgeInactive
              ]}
            >
              <Text 
                style={[
                  styles.roleBadgeText,
                  r.isActive ? styles.roleBadgeTextActive : styles.roleBadgeTextInactive
                ]}
              >
                {r.displayName}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.cardAction}
        onPress={() => handleRoleOptions(item)}
      >
        {updatingUserId === item.id ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <Shield size={20} color="#2563eb" />
        )}
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#f8fafc",
      padding: 16,
    },
    // Guard view / Unauthorized state
    guardContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    guardTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: isDark ? "#ffffff" : "#0f172a",
      marginTop: 16,
      textAlign: "center",
    },
    guardSubtitle: {
      fontSize: 14,
      color: isDark ? "#a3a3a3" : "#64748b",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
    },
    // Header search styles
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      paddingHorizontal: 12,
      gap: 8,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: isDark ? "#ffffff" : "#0f172a",
    },
    // Card item styles
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 4,
      elevation: 1,
    },
    cardInfo: {
      flex: 1,
      gap: 4,
    },
    cardName: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#ffffff" : "#0f172a",
    },
    cardEmail: {
      fontSize: 13,
      color: isDark ? "#a3a3a3" : "#64748b",
      marginBottom: 4,
    },
    rolesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    roleBadgeActive: {
      backgroundColor: "rgba(37, 99, 235, 0.1)",
      borderColor: "rgba(37, 99, 235, 0.3)",
    },
    roleBadgeInactive: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
    },
    roleBadgeText: {
      fontSize: 10,
      fontWeight: "600",
    },
    roleBadgeTextActive: {
      color: "#2563eb",
    },
    roleBadgeTextInactive: {
      color: isDark ? "#a3a3a3" : "#64748b",
    },
    cardAction: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f1f5f9",
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      paddingVertical: 12,
    },
    pageButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: "#2563eb",
    },
    pageButtonDisabled: {
      backgroundColor: isDark ? "#2d2d2d" : "#e2e8f0",
      opacity: 0.5,
    },
    pageButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#ffffff",
    },
    pageButtonTextDisabled: {
      color: isDark ? "#6b7280" : "#94a3b8",
    },
    pageInfo: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#a3a3a3" : "#64748b",
    },
    listEmpty: {
      textAlign: "center",
      color: isDark ? "#a3a3a3" : "#64748b",
      marginTop: 40,
    }
  });

  if (!hasAccess) {
    return (
      <View style={styles.guardContainer}>
        <ShieldAlert size={60} color="#ef4444" />
        <Text style={styles.guardTitle}>Access Denied</Text>
        <Text style={styles.guardSubtitle}>
          You do not have the required permissions to view or manage users list.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color={isDark ? "#a3a3a3" : "#64748b"} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
          value={search}
          onChangeText={(text) => {
            setSearch(text);
            setPage(1);
          }}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserCard}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchUsers(1, false);
          }}
          ListEmptyComponent={
            <Text style={styles.listEmpty}>No users found.</Text>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                  onPress={() => page > 1 && fetchUsers(page - 1, true)}
                  disabled={page === 1}
                >
                  <Text style={[styles.pageButtonText, page === 1 && styles.pageButtonTextDisabled]}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  Page {page} of {totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
                  onPress={() => page < totalPages && fetchUsers(page + 1, true)}
                  disabled={page === totalPages}
                >
                  <Text style={[styles.pageButtonText, page === totalPages && styles.pageButtonTextDisabled]}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
