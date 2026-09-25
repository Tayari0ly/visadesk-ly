"use client";

import React, { useEffect, useRef, useState } from "react";
import { SchengenFormData } from "@/types/schengen";
import {
  downloadOfficialForm,
  officialFormObjectUrl,
} from "@/lib/pdfOfficial";
import { CheckCircle2, Download, Printer, Save, FileCode, Loader2 } from "lucide-react";

interface FormPreviewAndExportProps {
  formData: SchengenFormData;
  onSaveToDb: () => Promise<void>;
  isSaving?: boolean;
}

export function FormPreviewAndExport({
  formData,
  onSaveToDb,
  isSaving = false,
}: FormPreviewAndExportProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    setBuilding(true);
    const t = setTimeout(async () => {
      try {
        const url = await officialFormObjectUrl(formData);
        if (!alive) {
          URL.revokeObjectURL(url);
          return;
        }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setPdfUrl(url);
      } catch (e) {
        console.error("official form render failed", e);
      } finally {
        if (alive) setBuilding(false);
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [formData]);

  const handleDownloadPDF = async () => {
    try {
      await downloadOfficialForm(formData);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error(e);
      alert("تعذر إنشاء ملف الـ PDF");
    }
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `Schengen_Data_${formData.field1_surname || "form"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSave = async () => {
    await onSaveToDb();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="border-b border-slate-200 px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">التصدير</h3>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "..." : "حفظ"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              JSON
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-md bg-[#1a4f8b] text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-500 text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          تم تنزيل النموذج الرسمي المعتمد
        </div>
      )}
      {saveSuccess && (
        <div className="bg-[#1a4f8b] text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          تم الحفظ في ملفك
        </div>
      )}

      <div className="bg-slate-100 p-3 sm:p-5">
        <div className="mx-auto max-w-[900px]">
          <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
            <span>النموذج الرسمي المعتمد — Application for Schengen Visa (4 صفحات)</span>
            {building && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ التعبئة...
              </span>
            )}
          </div>
          {pdfUrl ? (
            <iframe
              title="Schengen form preview"
              src={pdfUrl}
              className="w-full bg-white border border-slate-300 rounded-md shadow"
              style={{ height: "min(1100px, 160vh)" }}
            />
          ) : (
            <div className="w-full h-[600px] bg-white border border-slate-300 rounded-md flex items-center justify-center text-sm text-slate-400">
              جارٍ تجهيز النموذج الرسمي...
            </div>
          )}
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Printer className="w-3.5 h-3.5" />
            المعاينة هي ملف PDF الرسمي نفسه. التوقيع يُدوَّن بخط اليد بعد الطباعة.
          </p>
        </div>
      </div>
    </div>
  );
}
