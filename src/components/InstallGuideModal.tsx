"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Terminal,
  Layers,
  Cpu,
  Check,
  Copy,
  FolderDown,
  Server,
  Zap,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallGuideModal({ isOpen, onClose }: InstallGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"no-docker" | "docker" | "ollama" | "status">("no-docker");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sysStatus, setSysStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/system-status");
      const data = await res.json();
      setSysStatus(data);
    } catch (e) {
      console.warn("Failed to fetch system status", e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                دليل التثبيت والتشغيل التلقائي على جهازك
              </h2>
              <p className="text-xs text-slate-400">
                طريقتان كاملتان: بدون Docker (المباشرة والأسهل) أو عبر Docker
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("no-docker")}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-t-2 ${
              activeTab === "no-docker"
                ? "bg-white text-blue-600 border-blue-600 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>الطريقة 1: بدون دوكر (Native - الأسهل)</span>
          </button>

          <button
            onClick={() => setActiveTab("docker")}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-t-2 ${
              activeTab === "docker"
                ? "bg-white text-blue-600 border-blue-600 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span>الطريقة 2: عبر Docker</span>
          </button>

          <button
            onClick={() => setActiveTab("ollama")}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-t-2 ${
              activeTab === "ollama"
                ? "bg-white text-blue-600 border-blue-600 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-500" />
            <span>الذكاء الاصطناعي المحلي (Ollama)</span>
          </button>

          <button
            onClick={() => setActiveTab("status")}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-t-2 ${
              activeTab === "status"
                ? "bg-white text-blue-600 border-blue-600 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Server className="w-4 h-4 text-emerald-500" />
            <span>فحص حالة النظام الحالي</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          
          {/* TAB 1: NO DOCKER */}
          {activeTab === "no-docker" && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <p className="font-bold mb-1">
                    الطريقة المستقلة بدون Docker - تعمل مباشرة على نظام التشغيل الخاص بك
                  </p>
                  <p>
                    هذه الطريقة لا تحتاج لتثبيت أي برنامج حاويات أو Docker. كل ما تحتاجه هو توفر Node.js على جهازك.
                  </p>
                </div>
              </div>

              {/* Windows Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">🪟</span>
                  <span>خطوات التثبيت والتشغيل على ويندوز (Windows):</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed pr-2">
                  <li>
                    تأكد من تثبيت بيئة <strong className="text-blue-700">Node.js</strong> من الرابط الرسمي:{" "}
                    <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      https://nodejs.org
                    </a>{" "}
                    (اختر النسخة LTS).
                  </li>
                  <li>
                    افتح مجلد المشروع وادخل إلى المجلد <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">install\</code>.
                  </li>
                  <li>
                    اضغط نقراً مزدوجاً على الملف التلقائي المرفق:
                    <div className="mt-2 bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono flex items-center justify-between text-xs">
                      <span>install\setup-local-no-docker.bat</span>
                      <button
                        onClick={() => copyToClipboard("setup-local-no-docker.bat", "win-bat")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === "win-bat" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    سيقوم السكربت تلقائياً بتثبيت الاعتماديات، وإنشاء ملف الإعدادات، وتشغيل البرنامج.
                  </li>
                  <li>
                    للأيام القادمة، لتشغيل البرنامج مباشرة بنقرة واحدة، اضغط على:
                    <code className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono mr-1">install\run-app.bat</code>
                  </li>
                </ol>
              </div>

              {/* Linux / Mac Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
                <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">🐧 🍎</span>
                  <span>خطوات التثبيت على لينكس أو ماك (Linux / macOS):</span>
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  افتح موجه الأوامر (Terminal) في مجلد المشروع ونفذ السكربت التلقائي:
                </p>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500"># إعطاء صلاحيات التشغيل والبدء التلقائي:</span>
                    <br />
                    <span>chmod +x install/*.sh && ./install/setup-local-no-docker.sh</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard("chmod +x install/*.sh && ./install/setup-local-no-docker.sh", "mac-sh")}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] self-start"
                  >
                    {copiedKey === "mac-sh" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>نسخ</span>
                  </button>
                </div>
              </div>

              {/* Direct manual terminal commands */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="font-bold text-slate-900 text-sm mb-2">
                  أو نفذ الأوامر يدوياً في سطر الأوامر (3 خطوات فقط):
                </h3>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>1. تثبيت الحزم:</span>
                    <button
                      onClick={() => copyToClipboard("npm install", "c1")}
                      className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                    >
                      {copiedKey === "c1" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>نسخ</span>
                    </button>
                  </div>
                  <p className="text-emerald-400">npm install</p>

                  <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-slate-800">
                    <span>2. تشغيل خادم التطبيق:</span>
                    <button
                      onClick={() => copyToClipboard("npm run dev", "c2")}
                      className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                    >
                      {copiedKey === "c2" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>نسخ</span>
                    </button>
                  </div>
                  <p className="text-emerald-400">npm run dev</p>

                  <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-slate-800">
                    <span>3. افتح الرابط في المتصفح:</span>
                  </div>
                  <p className="text-blue-300">http://localhost:3000</p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DOCKER */}
          {activeTab === "docker" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Layers className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950">
                  <p className="font-bold mb-1">
                    التشغيل عبر حاويات Docker (بيئة معزولة ونظيفة مع قاعدة بيانات PostgreSQL)
                  </p>
                  <p>
                    تتضمن هذه الطريقة ملف <code className="font-mono font-bold">docker-compose.yml</code> مجهزاً بالكامل يقوم بتشغيل قاعدة بيانات بوستجرس وخادم التطبيق بضغطة زر واحدة.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">خطوات التشغيل بواسطة Docker Compose:</h3>
                
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-slate-800">على ويندوز (Windows):</p>
                    <p className="text-slate-600">
                      تأكد من تشغيل Docker Desktop، ثم اضغط نقراً مزدوجاً على الملف:
                    </p>
                    <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono flex items-center justify-between">
                      <span>install\setup-docker.bat</span>
                      <button
                        onClick={() => copyToClipboard("setup-docker.bat", "dock-win")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === "dock-win" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-slate-800">على لينكس أو ماك (Linux / macOS):</p>
                    <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono flex items-center justify-between">
                      <span>cd install && docker compose up -d --build</span>
                      <button
                        onClick={() => copyToClipboard("cd install && docker compose up -d --build", "dock-cmd")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === "dock-cmd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-800">الروابط والمنافذ:</p>
                  <p>• رابط التطبيق: <code className="bg-white px-2 py-0.5 rounded font-mono text-blue-700">http://localhost:3000</code></p>
                  <p>• منفذ قاعدة البيانات: <code className="bg-white px-2 py-0.5 rounded font-mono text-slate-700">localhost:5432</code></p>
                  <p>• لإيقاف الحاويات: <code className="bg-white px-2 py-0.5 rounded font-mono text-slate-700">docker compose down</code></p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OLLAMA */}
          {activeTab === "ollama" && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950">
                  <p className="font-bold mb-1">
                    تشغيل الذكاء الاصطناعي المحلي (Local Vision AI مع Ollama)
                  </p>
                  <p>
                    يتيح لك تشغيل نموذج رؤية بصرية محلي مثل <code className="font-mono font-bold">llama3.2-vision</code> مباشرة على كرت الشاشة أو المعالج الخاص بك، دون إرسال صور الجواز لأي سيرفر خارجي، مع خصوصية تامة وسرعة فائقة.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">خطوات تفعيل Ollama في دقيقة:</h3>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800">1. تنزيل Ollama:</p>
                    <p>
                      حمل البرنامج مجاناً من الموقع الرسمي:{" "}
                      <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        https://ollama.com
                      </a>
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="font-bold text-slate-800">2. تحميل نموذج الرؤية البصرية:</p>
                    <p>افتح موجه الأوامر واكتب الأمر التالي (أو شغل السكربت المرفق install\setup-ollama-ai.bat):</p>
                    <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono flex items-center justify-between">
                      <span>ollama run llama3.2-vision</span>
                      <button
                        onClick={() => copyToClipboard("ollama run llama3.2-vision", "ollama-cmd")}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === "ollama-cmd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>نسخ</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>النظام سيتصل تلقائياً بـ Ollama!</span>
                    </p>
                    <p>
                      بمجرد تشغيل Ollama على جهازك، سيتعرف النظام عليه تلقائياً على المنفذ <code className="font-mono bg-white px-1 rounded">http://127.0.0.1:11434</code> ويقوم بالتعرف على الجوازات محلياً.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM STATUS */}
          {activeTab === "status" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  فحص اتصال الخدمات والبيئة المحلية
                </h3>
                <button
                  onClick={fetchStatus}
                  disabled={loadingStatus}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
                  <span>تحديث الفحص</span>
                </button>
              </div>

              {sysStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Database Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-700">قاعدة البيانات المحلية:</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          sysStatus.database?.status === "connected"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {sysStatus.database?.status === "connected" ? "✓ متصلة وجاهزة" : "! وضع التخزين المؤقت"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      PostgreSQL متصلة لحفظ وإدارة استمارات الشنقن والطلبات السابقة.
                    </p>
                  </div>

                  {/* Ollama Status Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-700">محرك Ollama المحلي:</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          sysStatus.ollama?.status === "online"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {sysStatus.ollama?.status === "online" ? "✓ متصل محلياً" : "غير مفعل (يعمل بالوضع المدمج)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      الرابط: <code className="font-mono text-[11px]">{sysStatus.ollama?.url}</code>
                    </p>
                  </div>

                  {/* System Environment */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 md:col-span-2 text-xs">
                    <p className="font-bold text-slate-800">بيئة التشغيل:</p>
                    <p className="text-slate-600">
                      Node.js: <strong className="font-mono text-slate-900">{sysStatus.system?.nodeVersion}</strong> | نظام التشغيل: <strong className="font-mono text-slate-900">{sysStatus.system?.platform}</strong> | النموذج المعتمد: <strong className="text-blue-700">{sysStatus.system?.officialFormYear}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-xs">جارٍ فحص مكونات النظام...</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            جميع ملفات التثبيت متوفرة في مجلد <code className="font-mono font-bold">install/</code> داخل مجلد المشروع
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            إغلاق الدليل والعودة للاستمارة
          </button>
        </div>

      </div>
    </div>
  );
}
