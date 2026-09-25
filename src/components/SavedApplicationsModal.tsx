"use client";

import React, { useState } from "react";
import { X, FileText, Trash2, Calendar, MapPin, User, ArrowRight, RefreshCw } from "lucide-react";
import { SchengenFormData } from "@/types/schengen";

interface SavedApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: any[];
  onSelectApplication: (formData: SchengenFormData, id: number) => void;
  onDeleteApplication: (id: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function SavedApplicationsModal({
  isOpen,
  onClose,
  applications,
  onSelectApplication,
  onDeleteApplication,
  onRefresh,
}: SavedApplicationsModalProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">الطلبات والاستمارات المحفوظة</h3>
              <p className="text-xs text-slate-400">يمكنك استعادة أي طلب تم حفظه مسبقاً وتعديله أو إعادة تصديره</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefresh()}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {applications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-600">لا توجد طلبات محفوظة حالياً في قاعدة البيانات.</p>
              <p className="text-xs text-slate-400">
                عند تعبئة أي استمارة، اضغط على زر "حفظ في قاعدة البيانات" لحفظها والرجوع إليها لاحقاً.
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{app.title || "طلب شنقن"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      {app.destinationCountry || "EU"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {app.createdByUsername && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{app.createdByUsername}</span>
                      </span>
                    )}
                    {app.applicantName && (
                      <span className="flex items-center gap-1">
                        <span>{app.applicantName}</span>
                      </span>
                    )}
                    {app.passportNumber && (
                      <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {app.passportNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(app.updatedAt || app.createdAt).toLocaleDateString("ar-EG")}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      if (app.formData) {
                        onSelectApplication(app.formData, app.id);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>فتح وتعديل</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm("هل أنت متأكد من حذف هذا الطلب المحفوظ؟")) {
                        setIsDeleting(app.id);
                        await onDeleteApplication(app.id);
                        setIsDeleting(null);
                      }
                    }}
                    disabled={isDeleting === app.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="حذف الطلب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
