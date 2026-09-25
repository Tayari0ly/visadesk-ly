import { NextRequest, NextResponse } from "next/server";
import { parseMRZTD3, extractMRZFromText } from "@/lib/mrzParser";
import { db } from "@/db";
import { aiExtractionLogs } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

function toData(parsed: NonNullable<ReturnType<typeof parseMRZTD3>>) {
  const checks = parsed.checks || { passport: false, dob: false, expiry: false, composite: false };
  const score = [checks.passport, checks.dob, checks.expiry, checks.composite].filter(Boolean).length / 4;
  return {
    surname: parsed.surname, firstNames: parsed.firstNames, passportNumber: parsed.passportNumber,
    nationality: parsed.nationalityName, nationalityCode: parsed.nationalityCode, dateOfBirth: parsed.dateOfBirth,
    sex: parsed.sex, expiryDate: parsed.expiryDate, issueDate: "", placeOfBirth: "", countryOfBirth: parsed.nationalityName,
    personalNumber: parsed.personalNumber, mrzRaw: parsed.rawLines.join("\n"), confidenceScore: score,
    checks, requiresReview: !parsed.valid, extractionEngine: "ICAO 9303 TD3 parser",
  };
}

function safeError(error: unknown) {
  console.error("Passport extraction error", error);
  return "تعذر تحليل بيانات الجواز. جرّب صورة أوضح أو أدخل سطرَي MRZ يدويًا.";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const body = await req.json();
    const mrzLine1 = String(body.mrzLine1 || "").slice(0, 100);
    const mrzLine2 = String(body.mrzLine2 || "").slice(0, 100);
    const rawText = String(body.rawText || "").slice(0, 10000);
    if (mrzLine1 && mrzLine2) {
      const parsed = parseMRZTD3(mrzLine1, mrzLine2);
      if (!parsed) return NextResponse.json({ success: false, message: "سطرَا MRZ غير صالحين" }, { status: 400 });
      const data = toData(parsed);
      await db.insert(aiExtractionLogs).values({ sourceType: "mrz_lines", extractedData: data, confidence: String(data.confidenceScore), aiModelUsed: "ICAO 9303 TD3 Decoder" });
      return NextResponse.json({ success: true, data });
    }
    if (rawText) {
      const parsed = extractMRZFromText(rawText);
      if (parsed) return NextResponse.json({ success: true, data: toData(parsed) });
    }
    // Image OCR is deliberately client-side. The server never persists or forwards the upload by default.
    return NextResponse.json({ success: false, message: "لم يتم التحقق من MRZ. استخدم القراءة المحلية أو أدخل السطرين يدويًا." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: safeError(error) }, { status: 500 });
  }
}
