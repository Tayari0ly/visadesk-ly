import { NextResponse } from "next/server";
import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, hotels } from "@/db/schema";
import { requireUser, hasPermission } from "@/lib/auth";

export async function GET() {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "view_hotels")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 },);
    const tenant = me.role === "owner" || me.role === "super_admin" || me.role === "admin" || me.role === "company_admin" ? undefined : me.branchId ? eq(hotels.branchId, me.branchId) : sql`false`;
    const [total, approved, pending, rejected, cities, used] = await Promise.all([
      db.select({ value: count() }).from(hotels).where(tenant),
      db.select({ value: count() }).from(hotels).where(and(tenant, eq(hotels.status, "approved"))),
      db.select({ value: count() }).from(hotels).where(and(tenant, eq(hotels.status, "pending_review"))),
      db.select({ value: count() }).from(hotels).where(and(tenant, eq(hotels.status, "rejected"))),
      db.select({ city: hotels.city, value: count() }).from(hotels).where(and(tenant, eq(hotels.status, "approved"))).groupBy(hotels.city).orderBy(desc(count())).limit(12),
      db.select({ hotelId: applications.hotelId, value: count() }).from(applications).where(isNotNull(applications.hotelId)).groupBy(applications.hotelId).orderBy(desc(count())).limit(10),
    ]);
    const duplicateRows = await db.execute(sql`SELECT COUNT(*)::int AS value FROM (SELECT normalized_name, normalized_address, normalized_city, normalized_postal_code, COUNT(*) FROM hotels GROUP BY normalized_name, normalized_address, normalized_city, normalized_postal_code HAVING COUNT(*) > 1) d`);
    const usageIds = used.map((row) => row.hotelId).filter((id): id is number => id !== null);
    const usageHotels = usageIds.length ? await db.select({ id: hotels.id, hotelName: hotels.hotelName }).from(hotels).where(sql`${hotels.id} IN (${sql.join(usageIds.map((id) => sql`${id}`), sql`, `)})`) : [];
    const names = new Map(usageHotels.map((hotel) => [hotel.id, hotel.hotelName]));
    return NextResponse.json({ success: true, stats: { total: Number(total[0]?.value || 0), approved: Number(approved[0]?.value || 0), pendingReview: Number(pending[0]?.value || 0), rejected: Number(rejected[0]?.value || 0), duplicateGroups: Number((duplicateRows as unknown as Array<{ value: number }>)[0]?.value || 0), cities, mostUsed: used.map((row) => ({ hotelId: row.hotelId, hotelName: row.hotelId ? names.get(row.hotelId) || "" : "", uses: Number(row.value) })) } });
  } catch (error) {
    console.error("Hotel stats error", error);
    return NextResponse.json({ success: false, error: (error as Error)?.message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "تعذر تحميل الإحصائيات." }, { status: (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
