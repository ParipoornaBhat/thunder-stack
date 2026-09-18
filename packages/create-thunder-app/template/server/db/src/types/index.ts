import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type * as schema from "../schema/index.js";

// User Types
export type User = InferSelectModel<typeof schema.user>;
export type NewUser = InferInsertModel<typeof schema.user>;
export type Session = InferSelectModel<typeof schema.session>;
export type NewSession = InferInsertModel<typeof schema.session>;
export type Account = InferSelectModel<typeof schema.account>;
export type NewAccount = InferInsertModel<typeof schema.account>;
export type Verification = InferSelectModel<typeof schema.verification>;
export type NewVerification = InferInsertModel<typeof schema.verification>;

// RBAC Types
export type Role = InferSelectModel<typeof schema.role>;
export type NewRole = InferInsertModel<typeof schema.role>;
export type Permission = InferSelectModel<typeof schema.permission>;
export type NewPermission = InferInsertModel<typeof schema.permission>;
export type UserRole = InferSelectModel<typeof schema.userRole>;
export type NewUserRole = InferInsertModel<typeof schema.userRole>;
export type RolePermission = InferSelectModel<typeof schema.rolePermission>;
export type NewRolePermission = InferInsertModel<typeof schema.rolePermission>;
