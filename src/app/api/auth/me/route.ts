import { NextResponse } from "next/server";
import { ensureAdmin, getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    await ensureAdmin();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, user: null }, { status: 401 });
    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}
