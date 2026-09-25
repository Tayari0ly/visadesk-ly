import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, users } from "@/db/schema";
import { hashPassword, hasPermission, requireUser } from "@/lib/auth";

const allowedRoles = ["owner", "super_admin", "admin", "company_admin", "branch_admin", "supervisor", "employee", "viewer"] as const;
function safeError(error: unknown) {
  console.error("Users API error", error);
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code === "23505") return "اسم المستخدم موجود مسبقاً، اختر اسماً آخر.";
  if (code === "23503") return "رقم الشركة أو الفرع غير موجود. اختر فرعاً صحيحاً أو اترك الحقل فارغاً.";
  if (code === "42P01") return "جدول الحسابات غير موجود في Neon. طبّق Migration ثم أعد النشر.";
  if (code === "42703") return "بنية جدول الحسابات قديمة. طبّق آخر Migration ثم أعد النشر.";
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
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (existing.length) return NextResponse.json({ success: false, error: "اسم المستخدم موجود مسبقاً، اختر اسماً آخر." }, { status: 409 });

    const requestedBranchId = me.role === "owner" || me.role === "super_admin" ? body.branchId : me.branchId;
    const branchId = requestedBranchId === undefined || requestedBranchId === null || requestedBranchId === "" ? null : Number(requestedBranchId);
    if (branchId !== null && (!Number.isInteger(branchId) || branchId <= 0)) {
      return NextResponse.json({ success: false, error: "رقم الشركة أو الفرع غير صحيح." }, { status: 400 });
    }
    if (branchId !== null) {
      const branch = await db.select({ id: branches.id }).from(branches).where(eq(branches.id, branchId)).limit(1);
      if (!branch.length) return NextResponse.json({ success: false, error: "رقم الشركة أو الفرع غير موجود." }, { status: 400 });
    }

    const inserted = await db.insert(users).values({ username, passwordHash: hashPassword(password), fullName: String(body.fullName || "").trim().slice(0, 200), role, branchId, active: true }).returning({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, branchId: users.branchId, active: users.active });
    return NextResponse.json({ success: true, user: inserted[0] }, { status: 201 });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}
