"use client";

import Image from "next/image";
import Link from "next/link";
import { SAMPLE_ISSUED_FORM } from "@/lib/sampleIssuedForm";
import { downloadOfficialForm, officialFormObjectUrl } from "@/lib/pdfOfficial";
import { useEffect, useState } from "react";

export default function SampleIssuedFormPage() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    officialFormObjectUrl(SAMPLE_ISSUED_FORM).then(setUrl).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-200" dir="rtl">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/visadesk-ly-logo.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <div className="text-sm font-bold text-[#1a4f8b]">VisaDesk LY</div>
              <div className="text-[11px] text-slate-500">عينة استمارة بعد الإصدار</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-md bg-[#1a4f8b] text-white text-xs"
              onClick={() => downloadOfficialForm(SAMPLE_ISSUED_FORM)}
            >
              تنزيل PDF
            </button>
            <Link href="/" className="px-3 py-1.5 rounded-md border text-xs text-[#1a4f8b]">
              العودة
            </Link>
          </div>
        </div>
      </header>

      <main className="py-6 px-4">
        {url ? (
          <iframe
            title="Sample issued form"
            src={url}
            className="mx-auto w-full max-w-[900px] bg-white border border-slate-300 rounded-md shadow"
            style={{ height: "min(1150px, 170vh)" }}
          />
        ) : (
          <div className="mx-auto max-w-[900px] h-[600px] bg-white border border-slate-300 rounded-md flex items-center justify-center text-sm text-slate-400">
            جارٍ تجهيز العينة...
          </div>
        )}
      </main>
    </div>
  );
}
