"use client";

import React, { useMemo, useState } from "react";
import { ClipboardCheck, CheckSquare, Square, Info } from "lucide-react";
import { SCHENGEN_DOCUMENTS } from "@/lib/extraDataPresets";

export function DocumentsChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({ form: true });

  const stats = useMemo(() => {
    const required = SCHENGEN_DOCUMENTS.filter((d) => d.required);
    const done = required.filter((d) => checked[d.id]).length;
    return { done, total: required.length };
  }, [checked]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">المستندات</h3>
        </div>
        <div className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
          الإلزامي: {stats.done} / {stats.total}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {SCHENGEN_DOCUMENTS.map((doc) => {
          const isOn = Boolean(checked[doc.id]);
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => setChecked((prev) => ({ ...prev, [doc.id]: !prev[doc.id] }))}
              className={`text-right p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                isOn
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-200 hover:border-blue-200"
              }`}
            >
              {isOn ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <span>
                <span className="block text-sm font-bold text-slate-800">{doc.ar}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">{doc.en}</span>
                {!doc.required && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                    اختياري حسب الحالة
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            تختلف بعض المتطلبات حسب السفارة والجنسية. راجع موقع المركز قبل الموعد (VFS Global / TLScontact / BLS). هذا النظام يعبّئ الاستمارة الرسمية ولا يقدّم الطلب نيابة عنك.
          </span>
        </div>
      </div>
    </div>
  );
}
