"use client";

import { useEffect, useState } from "react";
import { Building2, FileText, Users } from "lucide-react";
import { apiFetch } from "@/lib/client";

export default function CompanyPortalPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch("/api/company/overview").then((r) => r.json()).then((j) => j.success ? setData(j) : setError(j.error || "يجب ربط الحساب بشركة")).catch(() => setError("تعذر الاتصال بالخادم")); }, []);
  return <main className="min-h-screen bg-slate-100 p-6" dir="rtl"><div className="max-w-5xl mx-auto space-y-6">
    <div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">VisaDesk LY</p><h1 className="text-2xl font-bold text-slate-900">بوابة الشركة</h1></div><a href="/" className="text-sm text-blue-700">العودة إلى النماذج</a></div>
    {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">{error}</div>}
    {!data && !error && <div className="bg-white rounded-xl p-8 text-center text-slate-500">جارٍ تحميل بوابة الشركة...</div>}
    {data && <><div className="bg-white rounded-xl border border-slate-200 p-6"><div className="flex items-center gap-3"><Building2 className="text-blue-700"/><div><h2 className="font-bold">{data.branch?.branch?.name}</h2><p className="text-xs text-slate-500">رمز الشركة: {data.branch?.branch?.code}</p></div></div></div><div className="grid grid-cols-2 gap-4"><div className="bg-white rounded-xl border p-5"><Users className="w-5 h-5 text-blue-700 mb-3"/><p className="text-xs text-slate-500">مستخدمو الشركة</p><p className="text-2xl font-bold">{data.summary.users}</p></div><div className="bg-white rounded-xl border p-5"><FileText className="w-5 h-5 text-blue-700 mb-3"/><p className="text-xs text-slate-500">النماذج المحفوظة</p><p className="text-2xl font-bold">{data.summary.applications}</p></div></div></>}
  </div></main>;
}
