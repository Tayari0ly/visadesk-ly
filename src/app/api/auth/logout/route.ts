import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  const cookie = clearSessionCookie();
  res.cookies.set(cookie);
  return res;
}
