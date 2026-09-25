import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin, encodeSession, findUserByUsername, sessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureAdmin();
    const body = await req.json();
    const username = String(body.username || "").trim().slice(0, 120);
    const password = String(body.password || "");
    if (!username || !password) return NextResponse.json({ success: false, error: "أدخل اسم المستخدم وكلمة المرور" }, { status: 400 });

    const user = await findUserByUsername(username);
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ success: false, error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    const session = encodeSession({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: (user.role as Parameters<typeof encodeSession>[0]["role"]),
      branchId: user.branchId,
    });
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, branchId: user.branchId },
    });
    res.cookies.set(sessionCookie(session));
    return res;
  } catch (e: any) {
    console.error("Login failure", e);
    const safeMessage = e?.message === "PASSWORD_TOO_SHORT"
      ? "كلمة المرور لا تقل عن 10 أحرف"
      : "تعذر الاتصال بقاعدة البيانات. تحقق من DATABASE_URL وطبّق Migration ثم أعد النشر.";
    return NextResponse.json({ success: false, error: safeMessage }, { status: 503 });
  }
}
