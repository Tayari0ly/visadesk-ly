import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, hotels } from "@/db/schema";
import { requireUser, hasPermission } from "@/lib/auth";
import { canManageHotels, cleanHotelInput } from "@/lib/hotels";

function errorMessage(error: unknown) {
  console.error("Hotels API error", error);
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code === "23505") return "يوجد سجل فندق مماثل أو External ID مكرر.";
  if (code === "42P01") return "جدول الفنادق غير موجود في Neon. طبّق drizzle/0002_hotels.sql ثم أعد النشر.";
  return "تعذر تنفيذ العملية.";
}

function visibility(me: Awaited<ReturnType<typeof requireUser>>) {
  if (canManageHotels(me.role)) return undefined;
  return me.branchId ? or(eq(hotels.status, "approved"), eq(hotels.branchId, me.branchId)) : eq(hotels.status, "approved");
}

export async function GET(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "view_hotels")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 25)));
    const q = String(params.get("q") || "").trim();
    const city = String(params.get("city") || "").trim();
    const province = String(params.get("province") || "").trim();
    const postalCode = String(params.get("postalCode") || "").trim();
    const status = String(params.get("status") || "").trim();
    const filters = [visibility(me), q ? or(ilike(hotels.hotelName, `%${q}%`), ilike(hotels.address, `%${q}%`), ilike(hotels.city, `%${q}%`), ilike(hotels.province, `%${q}%`), ilike(hotels.postalCode, `%${q}%`)) : undefined, city ? ilike(hotels.city, `%${city}%`) : undefined, province ? ilike(hotels.province, `%${province}%`) : undefined, postalCode ? ilike(hotels.postalCode, `%${postalCode}%`) : undefined, status ? eq(hotels.status, status) : undefined].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;
    const [rows, totalRows] = await Promise.all([
      db.select().from(hotels).where(where).orderBy(desc(hotels.updatedAt), hotels.hotelName).limit(limit).offset((page - 1) * limit),
      db.select({ value: count() }).from(hotels).where(where),
    ]);
    return NextResponse.json({ success: true, hotels: rows, page, limit, total: Number(totalRows[0]?.value || 0) });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : errorMessage(error) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "create_hotel_review") && !hasPermission(me.role, "manage_hotels")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const body = await req.json();
    const input = cleanHotelInput(body);
    if (!input.hotelName) return NextResponse.json({ success: false, error: "اسم الفندق مطلوب." }, { status: 400 });
    const duplicate = await db.select({ id: hotels.id, hotelName: hotels.hotelName }).from(hotels).where(or(eq(hotels.normalizedName, input.normalizedName), and(eq(hotels.normalizedName, input.normalizedName), eq(hotels.normalizedCity, input.normalizedCity)), input.externalId ? and(eq(hotels.source, input.source), eq(hotels.externalId, input.externalId)) : undefined)).limit(5);
    if (duplicate.length) return NextResponse.json({ success: false, error: "DUPLICATE", matches: duplicate }, { status: 409 });
    const managed = canManageHotels(me.role);
    const inserted = await db.insert(hotels).values({ ...input, branchId: managed && (me.role === "owner" || me.role === "super_admin" || me.role === "admin" || me.role === "company_admin") ? null : me.branchId, status: managed && String(body.status || "") === "approved" ? "approved" : "pending_review", createdBy: me.id }).returning();
    const hotel = inserted[0];
    await db.insert(auditLogs).values({ userId: me.id, branchId: me.branchId, action: "create", entityType: "hotel", entityId: String(hotel.id), newValue: hotel, metadata: { source: hotel.source } });
    return NextResponse.json({ success: true, hotel }, { status: 201 });
  } catch (error) {
    const status = (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ success: false, error: status === 401 ? "UNAUTHORIZED" : errorMessage(error) }, { status });
  }
}
