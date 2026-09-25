"use client";

import { useEffect, useState } from "react";
import { Building2, Database, FileText, KeyRound, Users } from "lucide-react";
import { apiFetch } from "@/lib/client";

export default function OwnerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { apiFetch("/api/owner/overview").then((r) => r.json()).then((j) => j.success ? setData(j) : setError(j.error || "غير مصرح")).catch(() => setError("تعذر الاتصال بالخادم")); }, []);
  return <main className="min-h-screen bg-slate-100 p-6" dir="rtl"><div className="max-w-6xl mx-auto space-y-6">
    <div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">VisaDesk LY</p><h1 className="text-2xl font-bold text-slate-900">لوحة المالك</h1></div><a href="/" className="text-sm text-blue-700">العودة إلى النماذج</a></div>
    {error && <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4">{error}</div>}
    {!data && !error && <div className="bg-white rounded-xl p-8 text-center text-slate-500">جارٍ تحميل لوحة المالك...</div>}
    {data && <><div className="grid grid-cols-2 lg:grid-cols-6 gap-4">{[[Building2,"الشركات",data.summary.companies],[Users,"المستخدمون",data.summary.users],[FileText,"النماذج",data.summary.applications],[KeyRound,"التراخيص النشطة",data.summary.activeLicenses],[Database,"الفنادق",data.summary.hotels],[Database,"فنادق قيد المراجعة",data.summary.pendingHotels]].map(([Icon,label,value]: any) => <div key={label} className="bg-white rounded-xl border border-slate-200 p-5"><Icon className="w-5 h-5 text-blue-700 mb-3"/><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}</div><section className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="p-5 border-b font-bold">الشركات والفروع</div><div className="divide-y">{data.companies.map((row: any) => <div key={row.branch.id} className="p-5 flex items-center justify-between"><div><p className="font-semibold">{row.branch.name}</p><p className="text-xs text-slate-500">{row.branch.code}</p></div><span className={`text-xs px-3 py-1 rounded-full ${row.license?.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{row.license?.status === "active" ? "نشط" : "غير نشط"}</span></div>)}</div></section></>}
  </div></main>;
}
