"use client";

import React from "react";
import { SchengenFormData } from "@/types/schengen";
import { checkFormCompleteness } from "@/lib/formCompleteness";
import { CheckCircle2, Circle, AlertTriangle, Gauge } from "lucide-react";

export function CompletenessPanel({ formData }: { formData: SchengenFormData }) {
  const report = checkFormCompleteness(formData);
  const missing = report.items.filter((i) => i.required && !i.ok);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">الاكتمال</h3>
            <p className="text-xs text-slate-500">
              {report.requiredDone} / {report.requiredTotal}
            </p>
          </div>
        </div>
        <div
          className={`text-2xl font-black px-4 py-2 rounded-xl border ${
            report.percent >= 90
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : report.percent >= 60
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}
        >
          {report.percent}%
        </div>
      </div>

      <div className="h-2 bg-slate-100">
        <div
          className={`h-2 transition-all ${
            report.percent >= 90 ? "bg-emerald-500" : report.percent >= 60 ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${report.percent}%` }}
        />
      </div>

      {missing.length > 0 ? (
        <div className="p-5">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4" />
            حقول إلزامية ناقصة قبل التصدير:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <span
                key={m.official + m.ar}
                className="text-[11px] px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200"
              >
                {m.official !== "—" ? `${m.official}. ` : ""}
                {m.ar}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 text-sm text-emerald-700 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          الاستمارة مكتملة وجاهزة لتصدير PDF الرسمي.
        </div>
      )}

      <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
        {report.items
          .filter((i) => i.required)
          .map((i) => (
            <div key={i.official + i.ar} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              {i.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className={i.ok ? "text-slate-500" : "text-slate-800 font-medium"}>{i.ar}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
