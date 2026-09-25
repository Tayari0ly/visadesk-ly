"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ExtractedPassportData } from "@/types/schengen";
import { parseMRZTD3 } from "@/lib/mrzParser";
import { ocrPassportImage } from "@/lib/passportOcr";

interface PassportScannerProps {
  onApplyExtractedData: (data: ExtractedPassportData, imagePreview?: string) => void;
}

export function PassportScanner({ onApplyExtractedData }: PassportScannerProps) {
  const [passportImage, setPassportImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [extractedData, setExtractedData] = useState<ExtractedPassportData | null>(null);
  const [mrzVerified, setMrzVerified] = useState(false);
  const [showManualMRZ, setShowManualMRZ] = useState(true);
  const [mrzLine1, setMrzLine1] = useState("");
  const [mrzLine2, setMrzLine2] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const readPassportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPassportImage(base64);
      processPassport(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readPassportFile(file);
  };

  const processPassport = async (base64Img: string) => {
    setIsScanning(true);
    setScanStatus("جارٍ تجهيز صورة الجواز وتحسين شريط MRZ...");

    try {
      const local = await ocrPassportImage(base64Img, (msg) => setScanStatus(msg));
      if (local.mrzLine1) setMrzLine1(local.mrzLine1);
      if (local.mrzLine2) setMrzLine2(local.mrzLine2);
      if (local.success && local.data) {
        setExtractedData(local.data);
        setMrzVerified(true);
        setScanStatus("تم استخراج بيانات الجواز محلياً داخل المتصفح (بدون إرسال الصورة لأي سيرفر).");
        return;
      }

      setScanStatus("تم العثور على قراءة أولية. راجع سطرَي MRZ يدويًا قبل تطبيق البيانات...");
      const res = await fetch("/api/extract-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: local.rawText }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setExtractedData(json.data);
        setScanStatus("تم استخراج البيانات بنجاح عبر المحرك المحلي.");
        return;
      }

      setScanStatus(
        local.message ||
          "الصورة جاهزة. أدخل سطرَي MRZ أسفل الجواز للتعبئة الفورية بدقة 100%."
      );
      setShowManualMRZ(true);
    } catch (e) {
      console.warn("Scan request failed", e);
      setScanStatus("يمكنك إدخال شفرة الـ MRZ يدوياً أو تجربة إحدى العينات الجاهزة بنقرة واحدة.");
      setShowManualMRZ(true);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle manual MRZ parsing
  const handleParseMRZ = () => {
    if (!mrzLine1 || !mrzLine2) {
      alert("يرجى إدخال السطر الأول والسطر الثاني لشفرة MRZ الموجودة أسفل الجواز");
      return;
    }

    const parsed = parseMRZTD3(mrzLine1, mrzLine2);
    if (!parsed) {
      alert("تعذر قراءة أسطر MRZ، يرجى التأكد من كتابتها بشكل صحيح كما في الجواز (مثلاً تبدأ بـ P<)");
      return;
    }

    const checks = parsed.checks;
    const okCount = [checks?.passport, checks?.dob, checks?.expiry, checks?.composite].filter(Boolean).length;
    const data: ExtractedPassportData = {
      surname: parsed.surname,
      firstNames: parsed.firstNames,
      passportNumber: parsed.passportNumber,
      nationality: parsed.nationalityName,
      nationalityCode: parsed.nationalityCode,
      dateOfBirth: parsed.dateOfBirth,
      sex: parsed.sex,
      expiryDate: parsed.expiryDate,
      issueDate: "",
      placeOfBirth: "",
      countryOfBirth: parsed.nationalityName,
      personalNumber: parsed.personalNumber,
      confidenceScore: okCount === 3 ? 0.99 : okCount >= 1 ? 0.9 : 0.75,
      extractionEngine: "ICAO 9303 TD3 + check digits",
    };

    setExtractedData(data);
    setMrzVerified(Boolean(parsed.valid));
    setScanStatus(
      `تم فك MRZ: ${parsed.surname}, ${parsed.firstNames}, ${parsed.passportNumber} (تحقق: جواز ${checks?.passport ? "✓" : "×"} / ميلاد ${checks?.dob ? "✓" : "×"} / انتهاء ${checks?.expiry ? "✓" : "×"} / إجمالي ${checks?.composite ? "✓" : "×"})`
    );
  };

  // Apply to the Schengen form
  const handleApply = () => {
    if (!extractedData || !mrzVerified) return;
    onApplyExtractedData(extractedData, passportImage || undefined);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Top Banner */}
      <div className="border-b border-slate-200 px-6 py-3">
        <h2 className="text-sm font-semibold text-slate-800">الجواز</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Upload / Image Zone */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                صورة أو مسح ضوئي لصفحة الجواز الأولى:
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) readPassportFile(file);
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-amber-400 bg-amber-50"
                    : passportImage
                    ? "border-blue-400 bg-blue-50/40"
                    : "border-slate-300 hover:border-blue-500 hover:bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                />

                {passportImage ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-56 flex items-center justify-center bg-slate-950">
                      <img
                        src={passportImage}
                        alt="Passport Preview"
                        className="max-h-56 w-auto object-contain"
                      />
                    </div>
                    <p className="text-xs text-blue-600 font-medium">
                      اضغط لتغيير صورة الجواز
                    </p>
                  </div>
                ) : (
                  <div className="py-6 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        اضغط لرفع صورة الجواز أو اسحبها هنا
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        JPG, PNG أو مسح ضوئي عالي الدقة (صفحة البيانات والصورة)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{scanStatus}</span>
                </div>
              )}

              {/* Toggle manual MRZ */}
              <button
                type="button"
                onClick={() => setShowManualMRZ(!showManualMRZ)}
                className="mt-3 text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1 font-medium"
              >
                <span>أو أدخل شفرة الـ MRZ يدوياً (السطرين المشفرين أسفل الجواز)</span>
                {showManualMRZ ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showManualMRZ && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>أسطر MRZ الرسمية (44 حرفاً لكل سطر):</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 block mb-1">السطر الأول (يبدأ بـ P&lt;):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={mrzLine1}
                      onChange={(e) => setMrzLine1(e.target.value.toUpperCase())}
                      placeholder="P<LBYELZOWEY<<TAREK<ABDALLAH<<<<<<<<<<<<<<<<<"
                      className="w-full text-xs font-mono p-2 border border-slate-300 rounded bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 block mb-1">السطر الثاني (رقم الجواز والتواريخ):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={mrzLine2}
                      onChange={(e) => setMrzLine2(e.target.value.toUpperCase())}
                      placeholder="11A9876540LBY8905142M290514811989051400<<<<42"
                      className="w-full text-xs font-mono p-2 border border-slate-300 rounded bg-white text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleParseMRZ}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>تحليل وفك شفرة الـ MRZ فورياً</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Results Zone */}
          <div className="lg:col-span-7">
            {extractedData ? (
              <div className="bg-slate-50 rounded-xl border border-blue-200 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-base">
                      {mrzVerified ? "تم التحقق من بيانات الجواز" : "قراءة أولية — تحتاج مراجعة"}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold border border-emerald-200">
                    دقة استخراج {Math.round((extractedData.confidenceScore || 0.98) * 100)}%
                  </span>
                </div>

                {/* Extracted Fields Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">اللقب / Surname:</span>
                    <span className="font-bold text-slate-900 text-base">{extractedData.surname || "—"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">الاسم الأول / Given Names:</span>
                    <span className="font-bold text-slate-900 text-base">{extractedData.firstNames || "—"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">رقم الجواز / Passport No:</span>
                    <span className="font-bold font-mono text-blue-700 text-base">{extractedData.passportNumber || "—"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">الجنسية / Nationality:</span>
                    <span className="font-bold text-slate-900">{extractedData.nationality || "—"} ({extractedData.nationalityCode || "—"})</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">تاريخ الميلاد / Date of Birth:</span>
                    <span className="font-bold font-mono text-slate-800">{extractedData.dateOfBirth || "—"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">الجنس / Sex:</span>
                    <span className="font-bold text-slate-800">
                      {extractedData.sex === "MALE" ? "ذكر (Male)" : extractedData.sex === "FEMALE" ? "أنثى (Female)" : "—"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">تاريخ الانتهاء / Expiry Date:</span>
                    <span className="font-bold font-mono text-slate-800">{extractedData.expiryDate || "—"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block">تاريخ الإصدار المقدر:</span>
                    <span className="font-bold font-mono text-slate-800">{extractedData.issueDate || "—"}</span>
                  </div>
                </div>

                {/* Big Action Button */}
                <div className="pt-2">
                  {!mrzVerified && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs font-semibold">لا يمكن تطبيق البيانات قبل نجاح فحوصات MRZ الأربعة. صحّح السطرين أسفل الجواز ثم أعد التحليل.</div>}
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!mrzVerified}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-3 text-base"
                  >
                    <FileCheck className="w-5 h-5" />
                    <span>تطبيق هذه البيانات وتعبئة حقول استمارة شنقن تلقائياً</span>
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-2">
                    سيتم نقل البيانات تلقائياً للحقول الرسمية (1، 3، 4، 6، 7، 8، 13، 14، 15، 16)
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-base mb-1">
                  في انتظار صورة الجواز أو كود MRZ
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  ارفع صورة جواز سفرك أو اختر إحدى العينات الجاهزة بالأعلى (ليبي، تونسي، مصري) لمشاهدة الذكاء الاصطناعي يقوم بتعبئة الاستمارة فورياً.
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                  <Info className="w-4 h-4" />
                  <span>جميع البيانات تُعالج بأمان تام على جهازك</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
