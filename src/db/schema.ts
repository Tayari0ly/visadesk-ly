import {
  pgTable,
  text,
  serial,
  timestamp,
  jsonb,
  boolean,
  integer,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const branches = pgTable(
  "branches",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("branches_code_unique").on(table.code)],
);

export const licenses = pgTable(
  "licenses",
  {
    id: serial("id").primaryKey(),
    branchId: integer("branch_id").notNull().references(() => branches.id),
    licenseKey: text("license_key").notNull(),
    status: text("status").notNull().default("active"),
    startsAt: timestamp("starts_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    maxEmployees: integer("max_employees"),
    maxForms: integer("max_forms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("licenses_key_unique").on(table.licenseKey),
    index("licenses_branch_idx").on(table.branchId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull().default(""),
    role: text("role").notNull().default("employee"),
    branchId: integer("branch_id").references(() => branches.id),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("users_branch_idx").on(table.branchId)],
);

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: integer("user_id").notNull().references(() => users.id),
    roleId: integer("role_id").notNull().references(() => roles.id),
  },
  (table) => [uniqueIndex("user_roles_unique").on(table.userId, table.roleId)],
);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    branchId: integer("branch_id").references(() => branches.id),
    createdBy: integer("created_by").references(() => users.id),
    updatedBy: integer("updated_by").references(() => users.id),
    createdByUsername: text("created_by_username").notNull().default(""),
    title: text("title").notNull().default("طلب تأشيرة شنقن جديد"),
    applicantName: text("applicant_name").notNull().default(""),
    passportNumber: text("passport_number").notNull().default(""),
    destinationCountry: text("destination_country").notNull().default("France"),
    travelDate: text("travel_date").notNull().default(""),
    formType: text("form_type").notNull().default("schengen"),
    formData: jsonb("form_data").notNull().$type<Record<string, unknown>>(),
    status: text("status").notNull().default("draft"),
    hasPassportScan: boolean("has_passport_scan").default(false),
    passportImagePreview: text("passport_image_preview"),
    printedAt: timestamp("printed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("applications_branch_updated_idx").on(table.branchId, table.updatedAt),
    index("applications_user_updated_idx").on(table.userId, table.updatedAt),
    index("applications_passport_idx").on(table.passportNumber),
    index("applications_status_idx").on(table.status),
  ],
);

export const formVersions = pgTable(
  "form_versions",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id").notNull().references(() => applications.id),
    version: integer("version").notNull(),
    formData: jsonb("form_data").notNull().$type<Record<string, unknown>>(),
    changedFields: jsonb("changed_fields").notNull().$type<Array<{ field: string; oldValue: unknown; newValue: unknown }>>(),
    changedBy: integer("changed_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("form_versions_application_version_unique").on(table.applicationId, table.version),
    index("form_versions_application_idx").on(table.applicationId, table.createdAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    branchId: integer("branch_id").references(() => branches.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_branch_created_idx").on(table.branchId, table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    branchId: integer("branch_id").references(() => branches.id),
    action: text("action").notNull(),
    recordId: text("record_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("activity_logs_branch_created_idx").on(table.branchId, table.createdAt)],
);

export const aiExtractionLogs = pgTable(
  "ai_extraction_logs",
  {
    id: serial("id").primaryKey(),
    sourceType: text("source_type").notNull().default("passport_scan"),
    extractedData: jsonb("extracted_data").notNull().$type<Record<string, unknown>>(),
    confidence: text("confidence").default("high"),
    aiModelUsed: text("ai_model_used").default("local_rule_engine"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("ai_extraction_logs_created_idx").on(table.createdAt)],
);

export type UserRole = "super_admin" | "admin" | "branch_admin" | "supervisor" | "employee" | "viewer";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ["*"],
  admin: ["view_forms", "create_form", "edit_form", "delete_form", "print_form", "view_reports", "view_employees", "create_employees", "edit_employees", "manage_employees", "view_performance", "manage_branch_settings"],
  branch_admin: ["view_forms", "create_form", "edit_form", "delete_form", "print_form", "view_reports", "view_employees", "create_employees", "edit_employees", "manage_employees", "view_performance", "manage_branch_settings"],
  supervisor: ["view_forms", "create_form", "edit_form", "print_form", "view_reports", "view_employees", "view_performance"],
  employee: ["view_forms", "create_form", "edit_form", "print_form"],
  viewer: ["view_forms"],
};
