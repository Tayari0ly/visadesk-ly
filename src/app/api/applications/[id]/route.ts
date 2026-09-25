import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLogs, formVersions } from "@/db/schema";
import { hasPermission, requireUser } from "@/lib/auth";

async function loadVisible(id: number, user: Awaited<ReturnType<typeof requireUser>>) {
  const filters = [eq(applications.id, id)];
  if (user.role !== "owner" && user.role !== "super_admin" && user.role !== "admin") {
    filters.push(user.branchId ? eq(applications.branchId, user.branchId) : eq(applications.userId, user.id));
  }
  const rows = await db.select().from(applications).where(and(...filters)).limit(1);
  return rows[0] || null;
}

function safeError(error: unknown) {
  console.error("Application detail API error", error);
  return "تعذر تنفيذ العملية. حاول مرة أخرى.";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "view_forms")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const item = await loadVisible(Number((await params).id), me);
    if (!item) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    const history = await db.select().from(formVersions).where(eq(formVersions.applicationId, item.id)).orderBy(desc(formVersions.version));
    return NextResponse.json({ success: true, application: item, history });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "edit_form")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const existing = await loadVisible(Number((await params).id), me);
    if (!existing) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    const body = await req.json();
    const nextFormData = body.formData && typeof body.formData === "object" ? body.formData : existing.formData;
    const oldData = (existing.formData || {}) as Record<string, unknown>;
    const changedFields = Object.keys({ ...oldData, ...nextFormData }).filter((field) => JSON.stringify(oldData[field]) !== JSON.stringify(nextFormData[field])).map((field) => ({ field, oldValue: oldData[field], newValue: nextFormData[field] }));
    const result = await db.transaction(async (tx) => {
      const updated = await tx.update(applications).set({
        title: body.title === undefined ? existing.title : String(body.title).slice(0, 200),
        applicantName: body.applicantName === undefined ? existing.applicantName : String(body.applicantName).trim().slice(0, 200),
        passportNumber: body.passportNumber === undefined ? existing.passportNumber : String(body.passportNumber).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20),
        destinationCountry: body.destinationCountry === undefined ? existing.destinationCountry : String(body.destinationCountry).slice(0, 80),
        travelDate: body.travelDate === undefined ? existing.travelDate : String(body.travelDate).slice(0, 20),
        formData: nextFormData,
        hasPassportScan: body.hasPassportScan === undefined ? existing.hasPassportScan : Boolean(body.hasPassportScan),
        status: body.status === undefined ? existing.status : String(body.status).slice(0, 40),
        updatedBy: me.id,
        updatedAt: new Date(),
      }).where(eq(applications.id, existing.id)).returning();
      if (changedFields.length) {
        const last = await tx.select({ version: formVersions.version }).from(formVersions).where(eq(formVersions.applicationId, existing.id)).orderBy(desc(formVersions.version)).limit(1);
        await tx.insert(formVersions).values({ applicationId: existing.id, version: (last[0]?.version || 0) + 1, formData: nextFormData, changedFields, changedBy: me.id });
      }
      await tx.insert(auditLogs).values({ userId: me.id, branchId: me.branchId, action: "EDIT_FORM", entityType: "application", entityId: String(existing.id), oldValue: existing.formData, newValue: nextFormData, metadata: { changedFields } });
      return updated[0];
    });
    return NextResponse.json({ success: true, application: result });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "delete_form")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const existing = await loadVisible(Number((await params).id), me);
    if (!existing) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    await db.update(applications).set({ status: "deleted", updatedBy: me.id, updatedAt: new Date() }).where(eq(applications.id, existing.id));
    await db.insert(auditLogs).values({ userId: me.id, branchId: me.branchId, action: "DELETE_FORM", entityType: "application", entityId: String(existing.id), oldValue: existing.formData });
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}
