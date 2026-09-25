import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, hotels } from "@/db/schema";
import { requireUser, hasPermission } from "@/lib/auth";
import { canManageHotels, cleanHotelInput } from "@/lib/hotels";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "view_hotels")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const id = Number((await context.params).id);
    const rows = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
    const hotel = rows[0];
    if (!hotel || (!canManageHotels(me.role) && hotel.status !== "approved" && hotel.branchId !== me.branchId)) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ success: true, hotel });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error)?.message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "تعذر تنفيذ العملية." }, { status: (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "manage_hotels") && !hasPermission(me.role, "review_hotels")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const id = Number((await context.params).id);
    const existing = (await db.select().from(hotels).where(eq(hotels.id, id)).limit(1))[0];
    if (!existing) return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    if (me.role === "branch_admin" && existing.branchId !== me.branchId && existing.branchId !== null) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const body = await req.json();
    const next = cleanHotelInput({ ...existing, ...body, hotelName: body.hotelName ?? existing.hotelName });
    const requestedStatus = String(body.status || existing.status);
    const status = ["pending_review", "approved", "rejected", "merged"].includes(requestedStatus) ? requestedStatus : existing.status;
    const updated = (await db.update(hotels).set({ ...next, status, reviewedBy: status === "pending_review" ? null : me.id, reviewedAt: status === "pending_review" ? null : new Date(), updatedAt: new Date() }).where(eq(hotels.id, id)).returning())[0];
    await db.insert(auditLogs).values({ userId: me.id, branchId: me.branchId, action: status !== existing.status ? `status_${status}` : "update", entityType: "hotel", entityId: String(id), oldValue: existing, newValue: updated });
    return NextResponse.json({ success: true, hotel: updated });
  } catch (error) {
    console.error("Hotel update error", error);
    return NextResponse.json({ success: false, error: "تعذر تنفيذ العملية." }, { status: 500 });
  }
}
