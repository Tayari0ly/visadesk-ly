import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, hasPermission, requireUser } from "@/lib/auth";

const allowedRoles = ["owner", "super_admin", "admin", "company_admin", "branch_admin", "supervisor", "employee", "viewer"] as const;
function safeError(error: unknown) {
  console.error("Users API error", error);
  return "تعذر تنفيذ العملية.";
}

export async function GET() {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "view_employees")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const list = await db.select({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, branchId: users.branchId, active: users.active, createdAt: users.createdAt }).from(users)
      .where(me.role === "owner" || me.role === "super_admin" || me.role === "admin" ? undefined : me.branchId ? eq(users.branchId, me.branchId) : eq(users.id, me.id)).orderBy(desc(users.createdAt));
    return NextResponse.json({ success: true, users: list });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "create_employees")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const body = await req.json();
    const username = String(body.username || "").trim().slice(0, 120);
    const password = String(body.password || "");
    if (!username || password.length < 10) return NextResponse.json({ success: false, error: "اسم المستخدم مطلوب وكلمة المرور لا تقل عن 10 أحرف" }, { status: 400 });
    const requestedRole = String(body.role || "employee");
    const role = allowedRoles.includes(requestedRole as (typeof allowedRoles)[number]) ? requestedRole : "employee";
    if ((role === "owner" || role === "super_admin") && me.role !== "owner" && me.role !== "super_admin") return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const inserted = await db.insert(users).values({ username, passwordHash: hashPassword(password), fullName: String(body.fullName || "").trim().slice(0, 200), role, branchId: me.role === "owner" || me.role === "super_admin" ? (body.branchId || null) : me.branchId, active: true }).returning({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, branchId: users.branchId, active: users.active });
    return NextResponse.json({ success: true, user: inserted[0] }, { status: 201 });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}
