import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, users } from "@/db/schema";
import { hasPermission, requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "view_reports")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const url = new URL(req.url);
    const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from") as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = url.searchParams.get("to") ? new Date(`${url.searchParams.get("to")}T23:59:59.999Z`) : new Date();
    const scope = me.role === "owner" || me.role === "super_admin" || me.role === "admin" ? undefined : me.branchId ? eq(applications.branchId, me.branchId) : eq(applications.userId, me.id);
    const where = and(scope, gte(applications.createdAt, from), lt(applications.createdAt, to));
    const rows = await db.select({ employeeId: applications.userId, employee: users.username, totalForms: count(applications.id), printedForms: sql<number>`count(*) filter (where ${applications.printedAt} is not null)`, editedForms: sql<number>`count(*) filter (where ${applications.updatedAt} > ${applications.createdAt})`, lastActivity: sql<string>`max(${applications.updatedAt})` }).from(applications).leftJoin(users, eq(users.id, applications.userId)).where(where).groupBy(applications.userId, users.username);
    return NextResponse.json({ success: true, range: { from, to }, rows });
  } catch (error) {
    console.error("Performance report error", error);
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : "تعذر إنشاء التقرير" }, { status });
  }
}
