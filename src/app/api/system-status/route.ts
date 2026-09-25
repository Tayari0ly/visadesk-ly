import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let dbStatus = "unknown";
  let dbError: string | null = null;
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error) {
    console.error("Database health check failed", error);
    dbStatus = "error";
    dbError = "Database connection unavailable";
  }

  return NextResponse.json({
    database: { status: dbStatus, error: dbError },
    ocr: {
      mode: "client-local",
      status: "available",
      description: "Passport MRZ OCR runs in the browser; no local Ollama service is required.",
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.VERCEL ? "vercel" : process.env.NODE_ENV || "development",
      engine: "Schengen AI Form Filler",
    },
  });
}
