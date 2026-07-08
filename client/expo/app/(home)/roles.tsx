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
  ScrollView,
  Platform
} from "react-native";
import { useAuth } from "../_layout";
import { getServerUrl } from "../../src/lib/api";
import { Shield, ShieldAlert, Key, Plus, Trash2, ChevronRight, Check } from "lucide-react-native";

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: Array<{ id: string; key: string; module: string }>;
}

interface PermissionItem {
  id: string;
  key: string;
  description: string;
  module: string;
}

export default function RolesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { token, activeRole, permissions: userPermissions } = useAuth();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  // Form states for creating a role
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingPermId, setTogglingPermId] = useState<string | null>(null);

  const hasAccess = activeRole?.name === "admin" || userPermissions.includes("roles:manage");

  const serverUrl = getServerUrl();

  const fetchRoles = async (selectId?: string) => {
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
        
        if (data.length > 0) {
          const toSelect = selectId 
            ? data.find((r: RoleItem) => r.id === selectId) || data[0]
            : data[0];
          setSelectedRole(toSelect);
        }
      }
    } catch (e) {
      console.log("Error loading roles", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    if (!hasAccess) return;
    try {
      const res = await fetch(`${serverUrl}/api/roles/permissions`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
    } catch (e) {
      console.log("Error loading permissions", e);
    }
  };

  useEffect(() => {
    if (hasAccess && token) {
      fetchRoles();
      fetchPermissions();
    }
  }, [hasAccess, token]);

  const handleCreateRole = async () => {
    if (!newRoleName || !newRoleDisplayName) {
      Alert.alert("Error", "Please fill in the Role Name and Display Name");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${serverUrl}/api/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          name: newRoleName,
          displayName: newRoleDisplayName,
          description: newRoleDesc,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Role created successfully!");
        setNewRoleName("");
        setNewRoleDisplayName("");
        setNewRoleDesc("");
        fetchRoles(data.role.id);
      } else {
        Alert.alert("Failed", data.error || "Failed to create role");
      }
    } catch (e) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this role?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(roleId);
            try {
              const res = await fetch(`${serverUrl}/api/roles/${roleId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token || ""}`,
                },
              });
              if (res.ok) {
                Alert.alert("Success", "Role deleted successfully");
                fetchRoles();
              } else {
                const data = await res.json();
                Alert.alert("Failed", data.error || "Failed to delete role");
              }
            } catch (e) {
              Alert.alert("Error", "Failed to delete role");
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const handleTogglePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    if (selectedRole.name === "admin") {
      Alert.alert("Access Denied", "Admin role permissions cannot be modified");
      return;
    }

    setTogglingPermId(permissionId);
    try {
      const res = await fetch(`${serverUrl}/api/roles/${selectedRole.id}/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ permissionId }),
      });

      const data = await res.json();
      if (res.ok) {
        // Optimistically update or just reload roles
        fetchRoles(selectedRole.id);
      } else {
        Alert.alert("Update Failed", data.error || "Failed to update permissions");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to toggle permission");
    } finally {
      setTogglingPermId(null);
    }
  };

  const isPermissionAssigned = (permissionKey: string) => {
    if (!selectedRole) return false;
    return selectedRole.permissions.some((p) => p.key === permissionKey);
  };

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
    // Scroll layouts
    contentScroll: {
      gap: 20,
    },
    section: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      padding: 16,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: isDark ? "#ffffff" : "#0f172a",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    input: {
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#121212" : "#f8fafc",
      paddingHorizontal: 12,
      fontSize: 14,
      color: isDark ? "#ffffff" : "#0f172a",
    },
    createButton: {
      height: 40,
      borderRadius: 8,
      backgroundColor: "#2563eb",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    createButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#ffffff",
    },
    // Role selection horizontal list
    roleList: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 4,
    },
    roleTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    roleTabSelected: {
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.1)",
    },
    roleTabText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#a3a3a3" : "#64748b",
    },
    roleTabTextSelected: {
      color: "#2563eb",
    },
    // Permission mapping list
    permCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2d2d2d" : "#f1f5f9",
    },
    permInfo: {
      flex: 1,
      paddingRight: 16,
    },
    permKey: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#ffffff" : "#0f172a",
    },
    permDesc: {
      fontSize: 12,
      color: isDark ? "#a3a3a3" : "#64748b",
      marginTop: 2,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDark ? "#4b5563" : "#cbd5e1",
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      borderColor: "#2563eb",
      backgroundColor: "#2563eb",
    },
    checkboxDisabled: {
      borderColor: isDark ? "#2d2d2d" : "#e2e8f0",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "#f1f5f9",
      opacity: 0.5,
    }
  });

  if (!hasAccess) {
    return (
      <View style={styles.guardContainer}>
        <ShieldAlert size={60} color="#ef4444" />
        <Text style={styles.guardTitle}>Access Denied</Text>
        <Text style={styles.guardSubtitle}>
          You do not have the required permissions to manage system roles or toggle permissions mapping.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* Section 1: Create Role */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create Custom Role</Text>
            <TextInput
              style={styles.input}
              placeholder="Role Name (e.g. guest-access)"
              placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
              value={newRoleName}
              onChangeText={setNewRoleName}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Display Name (e.g. Guest Access)"
              placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
              value={newRoleDisplayName}
              onChangeText={setNewRoleDisplayName}
            />
            <TextInput
              style={styles.input}
              placeholder="Role Description (Optional)"
              placeholderTextColor={isDark ? "#6b7280" : "#94a3b8"}
              value={newRoleDesc}
              onChangeText={setNewRoleDesc}
            />
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateRole}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.createButtonText}>Create Role</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Section 2: Roles Selection */}
          <View>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Select Role for Permission Mapping</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleList}>
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleTab, isSelected && styles.roleTabSelected]}
                    onPress={() => setSelectedRole(r)}
                  >
                    <Text style={[styles.roleTabText, isSelected && styles.roleTabTextSelected]}>
                      {r.displayName}
                    </Text>
                    {!r.isSystem && (
                      <TouchableOpacity 
                        onPress={() => handleDeleteRole(r.id)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? (
                          <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                          <Trash2 size={14} color="#ef4444" style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section 3: Permission Mapping list */}
          {selectedRole && (
            <View style={styles.section}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sectionTitle}>
                  Mapping: {selectedRole.displayName}
                </Text>
                {selectedRole.name === "admin" && (
                  <View style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, color: "#ef4444", fontWeight: "700" }}>PROTECTED</Text>
                  </View>
                )}
              </View>
              
              <Text style={{ fontSize: 12, color: isDark ? "#a3a3a3" : "#64748b", marginBottom: 8 }}>
                {selectedRole.name === "admin" 
                  ? "Admin has all permissions enabled. Custom changes are locked."
                  : "Toggle switches to assign or revoke system privileges for this role."}
              </Text>

              {permissions.map((p) => {
                const checked = isPermissionAssigned(p.key);
                const disabled = selectedRole.name === "admin" || togglingPermId === p.id;
                return (
                  <View key={p.id} style={styles.permCard}>
                    <View style={styles.permInfo}>
                      <Text style={styles.permKey}>{p.key}</Text>
                      <Text style={styles.permDesc}>{p.description || `Module: ${p.module}`}</Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        checked && styles.checkboxChecked,
                        disabled && styles.checkboxDisabled
                      ]}
                      onPress={() => !disabled && handleTogglePermission(p.id)}
                      disabled={disabled}
                    >
                      {togglingPermId === p.id ? (
                        <ActivityIndicator size="small" color={checked ? "#ffffff" : "#2563eb"} />
                      ) : checked ? (
                        <Check size={14} color="#ffffff" />
                      ) : null}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
