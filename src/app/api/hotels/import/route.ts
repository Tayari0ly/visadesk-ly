import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, hotels } from "@/db/schema";
import { requireUser, hasPermission } from "@/lib/auth";
import { cleanHotelInput } from "@/lib/hotels";

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser();
    if (!hasPermission(me.role, "manage_hotels")) return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
    const body = await req.json();
    const records = Array.isArray(body.records) ? body.records : [];
    const source = String(body.source || "authoritative_import").trim().slice(0, 120);
    if (!records.length || records.length > 5000) return NextResponse.json({ success: false, error: "أرسل records بصيغة Array بعدد من 1 إلى 5000." }, { status: 400 });
    let inserted = 0;
    let skipped = 0;
    for (const record of records) {
      const input = cleanHotelInput({ ...record, source });
      if (!input.hotelName) { skipped++; continue; }
      const duplicate = await db.select({ id: hotels.id }).from(hotels).where(orImportDuplicate(input)).limit(1);
      if (duplicate.length) { skipped++; continue; }
      const row = (await db.insert(hotels).values({ ...input, branchId: null, status: "approved", createdBy: me.id }).returning({ id: hotels.id }))[0];
      inserted++;
      await db.insert(auditLogs).values({ userId: me.id, branchId: me.branchId, action: "IMPORT_HOTEL", entityType: "hotel", entityId: String(row.id), newValue: input, metadata: { source } });
    }
    return NextResponse.json({ success: true, inserted, skipped, total: records.length });
  } catch (error) {
    console.error("Hotel import error", error);
    return NextResponse.json({ success: false, error: (error as Error)?.message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "تعذر استيراد الفنادق." }, { status: (error as Error)?.message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

function orImportDuplicate(input: ReturnType<typeof cleanHotelInput>) {
  if (input.externalId) return and(eq(hotels.source, input.source), eq(hotels.externalId, input.externalId));
  return and(eq(hotels.normalizedName, input.normalizedName), eq(hotels.normalizedAddress, input.normalizedAddress), eq(hotels.normalizedCity, input.normalizedCity), eq(hotels.normalizedPostalCode, input.normalizedPostalCode));
}
