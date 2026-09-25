import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLogs } from "@/db/schema";
import { hasPermission, requireUser } from "@/lib/auth";

function scope(user: Awaited<ReturnType<typeof requireUser>>) {
  if (user.role === "owner" || user.role === "super_admin" || user.role === "admin") return undefined;
  if (user.branchId) return eq(applications.branchId, user.branchId);
  return eq(applications.userId, user.id);
}

function safeError(error: unknown) {
  console.error("Applications API error", error);
  return "تعذر تنفيذ العملية. تحقق من البيانات وحاول مرة أخرى.";
}

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "view_forms")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 25)));
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status")?.trim();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const filters = [scope(me)];
    if (search) filters.push(or(ilike(applications.passportNumber, `%${search}%`), ilike(applications.applicantName, `%${search}%`), ilike(applications.title, `%${search}%`)));
    if (status) filters.push(eq(applications.status, status));
    if (from) filters.push(sql`${applications.createdAt} >= ${new Date(from)}`);
    if (to) filters.push(sql`${applications.createdAt} < ${new Date(`${to}T23:59:59.999Z`)}`);
    const where = and(...filters.filter(Boolean));
    const [list, countRows] = await Promise.all([
      db.select().from(applications).where(where).orderBy(desc(applications.updatedAt)).limit(limit).offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)` }).from(applications).where(where),
    ]);
    return NextResponse.json({ success: true, applications: list, pagination: { page, limit, total: Number(countRows[0]?.count || 0) } });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, applications: [], error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "create_form")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const body = await req.json();
    const applicantName = String(body.applicantName || "").trim().slice(0, 200);
    const passportNumber = String(body.passportNumber || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    if (!body.formData || typeof body.formData !== "object") return NextResponse.json({ success: false, error: "بيانات النموذج مطلوبة" }, { status: 400 });
    const inserted = await db.insert(applications).values({
      userId: me.id, branchId: me.branchId, createdBy: me.id, updatedBy: me.id, createdByUsername: me.username,
      title: String(body.title || `طلب ${applicantName || "جديد"}`).slice(0, 200), applicantName, passportNumber,
      destinationCountry: String(body.destinationCountry || "France").slice(0, 80), travelDate: String(body.travelDate || "").slice(0, 20),
      formData: body.formData, hasPassportScan: Boolean(body.hasPassportScan), status: "saved",
    }).returning();
    await db.insert(auditLogs).values({ userId: me.id, branchId: me.branchId, action: "CREATE_FORM", entityType: "application", entityId: String(inserted[0].id), newValue: inserted[0].formData });
    return NextResponse.json({ success: true, application: inserted[0] }, { status: 201 });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}
