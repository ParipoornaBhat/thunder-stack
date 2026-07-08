import { Tabs, useRouter } from "expo-router";
import {
  useColorScheme,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Modal,
  SafeAreaView,
  Platform
} from "react-native";
import { useAuth } from "../_layout";
import {
  User,
  LogOut,
  Users,
  Shield,
  MoreHorizontal,
  ChevronRight,
  ChevronUp,
  Check,
  X
} from "lucide-react-native";
import { useState, ComponentType } from "react";
interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface RouteItem {
  name: string;
  label: string;
  icon: ComponentType<any>;
  permission: string | null;
  isMore?: false;
}

interface MoreTabItem {
  isMore: true;
  label: string;
  icon: ComponentType<any>;
}

type TabItem = RouteItem | MoreTabItem;

const ALL_ROUTES: RouteItem[] = [
  { name: "index", label: "Profile", icon: User, permission: null },
  { name: "users", label: "Users", icon: Users, permission: "users:view" },
  { name: "roles", label: "Roles", icon: Shield, permission: "roles:manage" },
];

export default function HomeLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { logout, permissions, activeRole, roles, switchRole } = useAuth();
  const router = useRouter();

  const [moreModalOpen, setMoreModalOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const isAdmin = activeRole?.name === "admin";
  const visibleRoutes = ALL_ROUTES.filter((r) => {
    if (!r.permission) return true;
    if (isAdmin) return true;
    return permissions.includes(r.permission);
  });

  // Any routes beyond the first 3 will be placed inside the "More Options" list
  const moreRoutes = visibleRoutes.slice(3);

  const handleCloseMore = () => {
    setMoreModalOpen(false);
    setRoleMenuOpen(false);
  };

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            visibleRoutes={visibleRoutes}
            setMoreModalOpen={setMoreModalOpen}
          />
        )}
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
          },
          headerTintColor: isDark ? "#ffffff" : "#0f172a",
          headerRight: () => (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
            >
              <LogOut size={18} color="#ef4444" />
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Profile Console",
            tabBarLabel: "Profile",
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: "User Management",
            tabBarLabel: "Users",
          }}
        />
        <Tabs.Screen
          name="roles"
          options={{
            title: "Role Management",
            tabBarLabel: "Roles",
          }}
        />
      </Tabs>

      {/* More Options Modal */}
      <Modal
        visible={moreModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseMore}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.5)" }]}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomWidth: 1, borderBottomColor: isDark ? "#2d2d2d" : "#e2e8f0", paddingBottom: 12, marginBottom: 16 }]}>
                <Text style={[styles.modalTitle, { color: isDark ? "#ffffff" : "#0f172a" }]}>More Options</Text>
                <TouchableOpacity
                  onPress={handleCloseMore}
                  style={[styles.closeButton, { backgroundColor: isDark ? "#2d2d2d" : "#f1f5f9" }]}
                >
                  <X size={18} color={isDark ? "#ffffff" : "#64748b"} />
                </TouchableOpacity>
              </View>

              {/* Role Section */}
              <View style={styles.roleSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? "#94a3b8" : "#64748b" }]}>
                  USER ROLE
                </Text>

                {roles.length > 1 ? (
                  <View style={styles.switcherContainer}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        {
                          backgroundColor: isDark ? "#2d2d2d" : "#f1f5f9",
                          borderColor: isDark ? "#3d3d3d" : "#e2e8f0"
                        }
                      ]}
                      onPress={() => setRoleMenuOpen(!roleMenuOpen)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.roleButtonContent}>
                        <Shield size={16} color="#2563eb" style={{ marginRight: 8 }} />
                        <Text style={[styles.roleButtonText, { color: isDark ? "#ffffff" : "#0f172a" }]}>
                          {activeRole?.displayName || "Select Role"}
                        </Text>
                      </View>
                      <ChevronUp size={16} color={isDark ? "#94a3b8" : "#64748b"} />
                    </TouchableOpacity>

                    {roleMenuOpen && (
                      <View style={[
                        styles.dropUpMenu,
                        {
                          backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                          borderColor: isDark ? "#2d2d2d" : "#e2e8f0"
                        }
                      ]}>
                        {roles.map((r) => (
                          <TouchableOpacity
                            key={r.id}
                            style={[
                              styles.dropUpItem,
                              r.isActive && (isDark ? styles.dropUpItemActiveDark : styles.dropUpItemActiveLight)
                            ]}
                            onPress={async () => {
                              try {
                                await switchRole(r.id);
                                handleCloseMore();
                              } catch (err) {
                                console.log("Failed to switch role", err);
                              }
                            }}
                          >
                            <Text style={[
                              styles.dropUpItemText,
                              { color: isDark ? "#e2e8f0" : "#334155" },
                              r.isActive && { color: "#2563eb", fontWeight: "700" }
                            ]}>
                              {r.displayName}
                            </Text>
                            {r.isActive && <Check size={14} color="#2563eb" />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[
                    styles.staticRoleCard,
                    {
                      backgroundColor: isDark ? "#1a1a1a" : "#f8fafc",
                      borderColor: isDark ? "#2d2d2d" : "#e2e8f0"
                    }
                  ]}>
                    <Shield size={16} color={isDark ? "#737373" : "#94a3b8"} style={{ marginRight: 8 }} />
                    <Text style={[styles.staticRoleText, { color: isDark ? "#a3a3a3" : "#64748b" }]}>
                      Active Role: {activeRole?.displayName || "Standard User"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Options List */}
              <View style={styles.optionsList}>
                {moreRoutes.length > 0 ? (
                  moreRoutes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <TouchableOpacity
                        key={route.name}
                        style={[styles.optionItem, { borderBottomColor: isDark ? "#2d2d2d" : "#e2e8f0" }]}
                        onPress={() => {
                          handleCloseMore();
                          router.push(`/(home)/${route.name}`);
                        }}
                      >
                        <View style={styles.optionLeft}>
                          <View style={[styles.iconWrapper, { backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)" }]}>
                            <Icon size={20} color="#2563eb" />
                          </View>
                          <Text style={[styles.optionLabel, { color: isDark ? "#ffffff" : "#0f172a" }]}>
                            {route.label}
                          </Text>
                        </View>
                        <ChevronRight size={18} color={isDark ? "#737373" : "#94a3b8"} />
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={[styles.emptyText, { color: isDark ? "#737373" : "#94a3b8" }]}>
                    No additional options available.
                  </Text>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

interface CustomTabBarProps extends BottomTabBarProps {
  visibleRoutes: RouteItem[];
  setMoreModalOpen: (open: boolean) => void;
}

function CustomTabBar({
  state,
  descriptors,
  navigation,
  visibleRoutes,
  setMoreModalOpen
}: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Render direct routes (up to first 3 visible), then always append the "More" tab button
  const tabItems: TabItem[] = [
    ...visibleRoutes.slice(0, 3),
    { isMore: true, label: "More", icon: MoreHorizontal }
  ];

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
        borderTopColor: isDark ? "#2d2d2d" : "#e2e8f0"
      }
    ]}>
      {tabItems.map((item) => {
        const isFocused = !item.isMore && state.index === state.routes.findIndex((r: any) => r.name === item.name);

        const onPress = () => {
          if (item.isMore) {
            setMoreModalOpen(true);
          } else {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes.find((r: any) => r.name === item.name)?.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented && item.name) {
              navigation.navigate(item.name);
            }
          }
        };

        const Icon = item.icon;

        return (
          <TouchableOpacity
            key={item.isMore ? "more" : item.name}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <Icon size={20} color={isFocused ? "#2563eb" : (isDark ? "#8e8e93" : "#64748b")} />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? "#2563eb" : (isDark ? "#8e8e93" : "#64748b") }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  tabBar: {
    flexDirection: "row",
    height: Platform.OS === "ios" ? 88 : 64,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    paddingTop: 10,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: "80%",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
  },
  optionsList: {
    gap: 8,
    marginTop: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconWrapper: {
    height: 38,
    width: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 32,
    fontSize: 13,
    fontStyle: "italic",
  },
  roleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  switcherContainer: {
    position: "relative",
    zIndex: 50,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  roleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dropUpMenu: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    gap: 2,
  },
  dropUpItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropUpItemActiveLight: {
    backgroundColor: "rgba(37, 99, 235, 0.08)",
  },
  dropUpItemActiveDark: {
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  dropUpItemText: {
    fontSize: 13,
    fontWeight: "600",
  },
  staticRoleCard: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  staticRoleText: {
    fontSize: 13,
    fontWeight: "600",
  }
});
