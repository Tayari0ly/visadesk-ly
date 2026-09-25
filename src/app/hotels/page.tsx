"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { Building2, Check, ChevronLeft, ChevronRight, Database, Download, RefreshCw, Search, X } from "lucide-react";

type Hotel = { id: number; hotelName: string; address: string; city: string; province: string; postalCode: string; phone: string; country: string; stars: number | null; source: string; status: string; externalId: string | null };
type Stats = { total: number; approved: number; pendingReview: number; rejected: number; duplicateGroups: number; cities: Array<{ city: string; value: number }>; mostUsed: Array<{ hotelId: number | null; hotelName: string; uses: number }> };

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const limit = 25;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (q) params.set("q", q); if (city) params.set("city", city); if (province) params.set("province", province); if (postalCode) params.set("postalCode", postalCode); if (status) params.set("status", status);
      const [listResponse, statsResponse] = await Promise.all([apiFetch(`/api/hotels?${params}`), apiFetch("/api/hotels/stats")]);
      const list = await listResponse.json(); const statsJson = await statsResponse.json();
      if (list.success) { setHotels(list.hotels); setTotal(list.total); }
      if (statsJson.success) setStats(statsJson.stats);
    } finally { setLoading(false); }
  };

  useEffect(() => { const timer = window.setTimeout(load, 250); return () => window.clearTimeout(timer); }, [q, city, province, postalCode, status, page]);

  const review = async (id: number, nextStatus: string) => {
    const response = await apiFetch(`/api/hotels/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    const json = await response.json(); setMessage(json.success ? "تم تحديث حالة الفندق وتسجيل العملية في سجل التدقيق." : json.error || "تعذر التحديث"); load();
  };

  const importHotels = async () => {
    try {
      const parsed = JSON.parse(importText);
      const records = Array.isArray(parsed) ? parsed : parsed.records;
      const response = await apiFetch("/api/hotels/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records, source: parsed.source || "authoritative_import" }) });
      const json = await response.json(); setMessage(json.success ? `تمت إضافة ${json.inserted} وتجاوز ${json.skipped} سجل مكرر/غير صالح.` : json.error || "تعذر الاستيراد"); if (json.success) { setImportText(""); load(); }
    } catch { setMessage("صيغة الاستيراد يجب أن تكون JSON Array صحيحة."); }
  };

  return <main dir="rtl" className="min-h-screen bg-slate-100 p-6 text-slate-900">
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-black flex items-center gap-2"><Building2 className="text-emerald-600" /> قاعدة فنادق إسبانيا</h1><p className="text-sm text-slate-500 mt-1">بحث خادمي سريع، مراجعة السجلات، وربط مباشر بنماذج التأشيرة.</p></div><a href="/" className="text-sm font-bold text-blue-700">العودة للنموذج</a></header>
      {message && <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-semibold">{message}</div>}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">{[["الإجمالي", stats?.total || 0], ["معتمدة", stats?.approved || 0], ["قيد المراجعة", stats?.pendingReview || 0], ["مرفوضة", stats?.rejected || 0], ["مجموعات مكررة", stats?.duplicateGroups || 0]].map(([label, value]) => <div key={String(label)} className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-2xl font-black mt-1">{value}</div></div>)}</section>
      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"><div className="flex items-center gap-2 text-sm font-bold"><Search className="w-4 h-4" /> فلاتر البحث</div><div className="grid grid-cols-1 md:grid-cols-5 gap-2"><input value={q} onChange={e => { setPage(1); setQ(e.target.value); }} placeholder="اسم، عنوان أو مدينة" className="p-2.5 border rounded-lg" /><input value={city} onChange={e => { setPage(1); setCity(e.target.value); }} placeholder="المدينة" className="p-2.5 border rounded-lg" /><input value={province} onChange={e => { setPage(1); setProvince(e.target.value); }} placeholder="المحافظة" className="p-2.5 border rounded-lg" /><input value={postalCode} onChange={e => { setPage(1); setPostalCode(e.target.value); }} placeholder="الرمز البريدي" className="p-2.5 border rounded-lg" /><select value={status} onChange={e => { setPage(1); setStatus(e.target.value); }} className="p-2.5 border rounded-lg"><option value="">كل الحالات</option><option value="approved">معتمد</option><option value="pending_review">قيد المراجعة</option><option value="rejected">مرفوض</option><option value="merged">مدمج</option></select></div><button onClick={load} className="text-xs font-bold text-blue-700 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> تحديث</button></section>
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-4 border-b flex justify-between items-center"><span className="font-bold">السجلات ({total})</span>{loading && <span className="text-xs text-slate-500">جارٍ التحميل...</span>}</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-right"><tr><th className="p-3">الفندق</th><th className="p-3">الموقع</th><th className="p-3">الهاتف</th><th className="p-3">المصدر</th><th className="p-3">الحالة</th><th className="p-3">إجراء</th></tr></thead><tbody>{hotels.map(h => <tr key={h.id} className="border-t"><td className="p-3 font-bold">{h.hotelName}<div className="text-[11px] text-slate-400">#{h.id} {h.stars ? `· ${h.stars} نجوم` : ""}</div></td><td className="p-3">{[h.address, h.city, h.province, h.postalCode].filter(Boolean).join(", ") || "—"}</td><td className="p-3 dir-ltr">{h.phone || "—"}</td><td className="p-3 text-xs">{h.source}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${h.status === "approved" ? "bg-emerald-100 text-emerald-700" : h.status === "pending_review" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{h.status}</span></td><td className="p-3"><div className="flex gap-1">{h.status === "pending_review" && <><button title="اعتماد" onClick={() => review(h.id, "approved")} className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><Check className="w-4 h-4" /></button><button title="رفض" onClick={() => review(h.id, "rejected")} className="p-2 rounded-lg bg-red-100 text-red-700"><X className="w-4 h-4" /></button></>}</div></td></tr>)}</tbody></table></div><div className="p-3 flex justify-between items-center text-xs"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="disabled:opacity-30 flex items-center gap-1"><ChevronRight className="w-4 h-4" /> السابق</button><span>صفحة {page} من {Math.max(1, Math.ceil(total / limit))}</span><button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)} className="disabled:opacity-30 flex items-center gap-1">التالي <ChevronLeft className="w-4 h-4" /></button></div></section>
      <section className="bg-white rounded-2xl border border-slate-200 p-4"><h2 className="font-bold flex items-center gap-2"><Database className="w-4 h-4 text-blue-600" /> استيراد Dataset حقيقي</h2><p className="text-xs text-slate-500 mt-1">الصق JSON Array من مصدر موثق. لا يتم إنشاء بيانات تلقائية؛ كل سجل يحفظ مصدره ويُزال تكراره قبل الإدخال.</p><textarea value={importText} onChange={e => setImportText(e.target.value)} rows={5} placeholder={'[{"hotelName":"...","city":"...","source":"official_directory","externalId":"..."}]'} className="w-full mt-3 p-3 border rounded-xl font-mono text-xs" /><button onClick={importHotels} disabled={!importText.trim()} className="mt-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2"><Download className="w-4 h-4" /> بدء الاستيراد</button></section>
      {stats?.mostUsed?.length ? <section className="bg-white rounded-2xl border border-slate-200 p-4"><h2 className="font-bold mb-3">الأكثر استخداماً في النماذج</h2><div className="grid md:grid-cols-2 gap-2">{stats.mostUsed.map(item => <div key={String(item.hotelId)} className="flex justify-between bg-slate-50 p-2 rounded-lg text-sm"><span>{item.hotelName || `Hotel #${item.hotelId}`}</span><b>{item.uses}</b></div>)}</div></section> : null}
    </div>
  </main>;
}
