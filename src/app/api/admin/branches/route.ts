import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { branches, licenses } from "@/db/schema";
import { requireUser } from "@/lib/auth";

function guard(role: string) { return role === "super_admin" || role === "admin"; }
function safeError(error: unknown) { console.error("Branch API error", error); return "تعذر تنفيذ العملية."; }

export async function GET() {
  try {
    const me = await requireUser();
    if (!guard(me.role)) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const list = await db.select({ branch: branches, license: licenses }).from(branches).leftJoin(licenses, eq(licenses.branchId, branches.id)).orderBy(desc(branches.createdAt));
    return NextResponse.json({ success: true, branches: list });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!guard(me.role)) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 160);
    const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
    const expiresAt = new Date(body.expiresAt || Date.now() + 365 * 86400000);
    if (!name || !code || Number.isNaN(expiresAt.getTime())) return NextResponse.json({ success: false, error: "اسم الفرع والرمز وتاريخ الانتهاء مطلوبة" }, { status: 400 });
    const result = await db.transaction(async (tx) => {
      const branch = (await tx.insert(branches).values({ name, code }).returning())[0];
      const license = (await tx.insert(licenses).values({ branchId: branch.id, licenseKey: `VD-${randomBytes(12).toString("hex").toUpperCase()}`, startsAt: new Date(), expiresAt, maxEmployees: body.maxEmployees ? Number(body.maxEmployees) : null, maxForms: body.maxForms ? Number(body.maxForms) : null }).returning())[0];
      return { branch, license };
    });
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : safeError(error) }, { status });
  }
}
