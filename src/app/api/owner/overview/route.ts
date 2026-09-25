import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, branches, hotels, licenses, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await requireUser();
    if (me.role !== "owner" && me.role !== "super_admin" && me.role !== "admin") {
      return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    }
    const [companyCount, userCount, applicationCount, licenseCount, hotelCount, pendingHotelCount, companyRows] = await Promise.all([
      db.select({ value: count() }).from(branches),
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(applications),
      db.select({ value: count() }).from(licenses).where(eq(licenses.status, "active")),
      db.select({ value: count() }).from(hotels),
      db.select({ value: count() }).from(hotels).where(eq(hotels.status, "pending_review")),
      db.select({ branch: branches, license: licenses }).from(branches).leftJoin(licenses, eq(licenses.branchId, branches.id)).orderBy(desc(branches.createdAt)),
    ]);
    return NextResponse.json({
      success: true,
      summary: {
        companies: Number(companyCount[0]?.value || 0),
        users: Number(userCount[0]?.value || 0),
        applications: Number(applicationCount[0]?.value || 0),
        activeLicenses: Number(licenseCount[0]?.value || 0),
        hotels: Number(hotelCount[0]?.value || 0),
        pendingHotels: Number(pendingHotelCount[0]?.value || 0),
      },
      companies: companyRows,
    });
  } catch (error) {
    console.error("Owner overview error", error);
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : "تعذر تحميل لوحة المالك" }, { status });
  }
}
