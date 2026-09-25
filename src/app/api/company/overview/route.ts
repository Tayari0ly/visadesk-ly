import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, branches, hotels, licenses, users } from "@/db/schema";
import { hasPermission, requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await requireUser();
    if (!me.branchId || !hasPermission(me.role, "view_reports")) {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const [branchRows, userRows, applicationRows, hotelRows, pendingHotelRows] = await Promise.all([
      db.select({ branch: branches, license: licenses }).from(branches).leftJoin(licenses, eq(licenses.branchId, branches.id)).where(eq(branches.id, me.branchId)).limit(1),
      db.select({ value: count() }).from(users).where(eq(users.branchId, me.branchId)),
      db.select({ value: count() }).from(applications).where(and(eq(applications.branchId, me.branchId), eq(applications.status, "saved"))),
      db.select({ value: count() }).from(hotels).where(eq(hotels.branchId, me.branchId)),
      db.select({ value: count() }).from(hotels).where(and(eq(hotels.branchId, me.branchId), eq(hotels.status, "pending_review"))),
    ]);
    return NextResponse.json({ success: true, branch: branchRows[0] || null, summary: { users: Number(userRows[0]?.value || 0), applications: Number(applicationRows[0]?.value || 0), hotels: Number(hotelRows[0]?.value || 0), pendingHotels: Number(pendingHotelRows[0]?.value || 0) } });
  } catch (error) {
    console.error("Company overview error", error);
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : "تعذر تحميل بوابة الشركة" }, { status });
  }
}
