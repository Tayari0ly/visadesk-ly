import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, hasPermission, requireUser } from "@/lib/auth";

async function targetFor(me: Awaited<ReturnType<typeof requireUser>>, id: number) {
  const filters = [eq(users.id, id)];
  if (me.role !== "owner" && me.role !== "super_admin" && me.role !== "admin") filters.push(me.branchId ? eq(users.branchId, me.branchId) : eq(users.id, me.id));
  return (await db.select().from(users).where(and(...filters)).limit(1))[0] || null;
}
function safeError(error: unknown) { console.error("User detail API error", error); return "تعذر تنفيذ العملية."; }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "edit_employees")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const id = Number((await params).id);
    const target = await targetFor(me, id);
    if (!target) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    const body = await req.json();
    if (id === me.id && body.active === false) return NextResponse.json({ success: false, error: "لا يمكن إيقاف حسابك الحالي" }, { status: 400 });
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.fullName === "string") patch.fullName = body.fullName.trim().slice(0, 200);
    if (typeof body.active === "boolean") patch.active = body.active;
    if (typeof body.password === "string" && body.password) patch.passwordHash = hashPassword(body.password);
    if (typeof body.role === "string" && ["owner", "super_admin", "admin", "company_admin", "branch_admin", "supervisor", "employee", "viewer"].includes(body.role) && (me.role === "owner" || me.role === "super_admin")) patch.role = body.role;
    const updated = await db.update(users).set(patch).where(eq(users.id, id)).returning({ id: users.id, username: users.username, fullName: users.fullName, role: users.role, branchId: users.branchId, active: users.active });
    return NextResponse.json({ success: true, user: updated[0] });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "manage_employees")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const id = Number((await params).id);
    if (id === me.id) return NextResponse.json({ success: false, error: "لا يمكن حذف حسابك" }, { status: 400 });
    const target = await targetFor(me, id);
    if (!target) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    await db.update(users).set({ active: false, updatedAt: new Date() }).where(eq(users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}
