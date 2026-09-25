import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { branches, licenses, users } from "@/db/schema";
import type { UserRole } from "@/db/schema";

const SESSION_COOKIE = "visadesk_session";
const MAX_AGE_SEC = 60 * 60 * 8;

export type SessionUser = {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  branchId: number | null;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return value || "local-development-only-change-me";
}

export function hashPassword(password: string): string {
  if (password.length < 10) throw new Error("PASSWORD_TOO_SHORT");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const next = scryptSync(password, salt, 32);
    const prev = Buffer.from(hash, "hex");
    return next.length === prev.length && timingSafeEqual(next, prev);
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function encodeSession(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({ id: user.id, exp: Date.now() + MAX_AGE_SEC * 1000 }),
    "utf8",
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSessionId(token: string | undefined | null): number | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!Number.isInteger(data?.id) || !data.exp || Date.now() > data.exp) return null;
    return data.id;
  } catch {
    return null;
  }
}

function normalizeRole(value: string): UserRole {
  return ["super_admin", "admin", "branch_admin", "supervisor", "employee", "viewer"].includes(value)
    ? (value as UserRole)
    : "employee";
}

export async function ensureAdmin() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return;
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!bootstrapPassword) return;
  await db.insert(users).values({
    username: process.env.BOOTSTRAP_ADMIN_USERNAME || "admin",
    passwordHash: hashPassword(bootstrapPassword),
    fullName: "مدير النظام",
    role: "super_admin",
    active: true,
  });
}

async function getUserFromToken(token: string | undefined | null): Promise<SessionUser | null> {
  const id = decodeSessionId(token);
  if (!id) return null;
  const rows = await db
    .select({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, branchId: users.branchId, active: users.active })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const user = rows[0];
  if (!user || !user.active) return null;
  if (user.branchId) {
    const branchRows = await db.select({ branchId: branches.id }).from(branches).innerJoin(licenses, eq(licenses.branchId, branches.id)).where(and(eq(branches.id, user.branchId), eq(branches.active, true), eq(licenses.status, "active"), gt(licenses.expiresAt, new Date()))).limit(1);
    if (!branchRows.length) return null;
  }
  return { id: user.id, username: user.username, fullName: user.fullName, role: normalizeRole(user.role), branchId: user.branchId };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const fromCookie = await getUserFromToken(jar.get(SESSION_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  try {
    const h = await headers();
    const auth = h.get("authorization") || h.get("Authorization");
    if (auth?.toLowerCase().startsWith("bearer ")) return getUserFromToken(auth.slice(7).trim());
  } catch {
    // Request context may not expose headers in all server-side invocations.
  }
  return null;
}

export async function requireUser(): Promise<SessionUser> {
  await ensureAdmin();
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function hasPermission(role: UserRole, permission: string): boolean {
  if (role === "super_admin") return true;
  const permissions: Record<UserRole, string[]> = {
    super_admin: ["*"],
    admin: ["view_forms", "create_form", "edit_form", "delete_form", "print_form", "view_reports", "view_employees", "create_employees", "edit_employees", "manage_employees", "view_performance", "manage_branch_settings"],
    branch_admin: ["view_forms", "create_form", "edit_form", "delete_form", "print_form", "view_reports", "view_employees", "create_employees", "edit_employees", "manage_employees", "view_performance", "manage_branch_settings"],
    supervisor: ["view_forms", "create_form", "edit_form", "print_form", "view_reports", "view_employees", "view_performance"],
    employee: ["view_forms", "create_form", "edit_form", "print_form"],
    viewer: ["view_forms"],
  };
  return permissions[role]?.includes(permission) ?? false;
}

export function sessionCookie(token: string) {
  return { name: SESSION_COOKIE, value: token, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE_SEC };
}

export function clearSessionCookie() {
  return { name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 };
}

export async function findUserByUsername(username: string) {
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] || null;
}
