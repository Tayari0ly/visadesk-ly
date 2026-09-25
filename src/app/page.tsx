"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { PassportScanner } from "@/components/PassportScanner";
import { ExtraDataQuickFill } from "@/components/ExtraDataQuickFill";
import { SchengenFormEditor } from "@/components/SchengenFormEditor";
import { FormPreviewAndExport } from "@/components/FormPreviewAndExport";
import { DocumentsChecklist } from "@/components/DocumentsChecklist";
import { CompletenessPanel } from "@/components/CompletenessPanel";
import { InstallGuideModal } from "@/components/InstallGuideModal";
import { SavedApplicationsModal } from "@/components/SavedApplicationsModal";
import { UsersModal } from "@/components/UsersModal";
import { LoginForm } from "@/components/LoginForm";
import { apiFetch, setToken } from "@/lib/client";
import type { AppUser } from "@/components/Header";
import {
  SchengenFormData,
  defaultSchengenFormData,
  ExtractedPassportData,
} from "@/types/schengen";
import { downloadOfficialForm } from "@/lib/pdfOfficial";
import { CheckCircle } from "lucide-react";

export default function SchengenAiPage() {
  const [formData, setFormData] = useState<SchengenFormData>(defaultSchengenFormData);
  const [savedApplications, setSavedApplications] = useState<any[]>([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"filler" | "guide" | "saved">("filler");
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passportPreviewImg, setPassportPreviewImg] = useState<string | null>(null);
  const [currentApplicationId, setCurrentApplicationId] = useState<number | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [usersOpen, setUsersOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Load saved applications on mount
  const fetchSavedApplications = async () => {
    try {
      const res = await apiFetch("/api/applications");
      const json = await res.json();
      if (json.success && json.applications) {
        setSavedApplications(json.applications);
      }
    } catch (e) {
      console.warn("Could not load applications from DB:", e);
    }
  };

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.user) {
          setUser(j.user);
          fetchSavedApplications();
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
    try {
      const raw = localStorage.getItem("schengen-form-draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        setFormData({
          ...defaultSchengenFormData,
          ...parsed,
          field22_purposeOfJourney: parsed.field22_purposeOfJourney?.length
            ? parsed.field22_purposeOfJourney
            : defaultSchengenFormData.field22_purposeOfJourney,
          field31_applicantMeans: parsed.field31_applicantMeans || defaultSchengenFormData.field31_applicantMeans,
          field31_sponsorMeans: parsed.field31_sponsorMeans || [],
        });
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("schengen-form-draft", JSON.stringify(formData));
    } catch {
      /* quota */
    }
  }, [formData]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // When passport scanner extracts data, automatically update Schengen form fields
  const handleApplyExtractedData = (data: ExtractedPassportData, imagePreview?: string) => {
    if (imagePreview) {
      setPassportPreviewImg(imagePreview);
    }

    setFormData((prev) => ({
      ...prev,
      field1_surname: data.surname || prev.field1_surname,
      field2_surnameAtBirth: prev.field2_surnameAtBirth || data.surname || "",
      field3_firstNames: data.firstNames || prev.field3_firstNames,
      field4_dateOfBirth: data.dateOfBirth || prev.field4_dateOfBirth,
      field5_placeOfBirth: data.placeOfBirth || prev.field5_placeOfBirth,
      field6_countryOfBirth: data.countryOfBirth || data.nationality || prev.field6_countryOfBirth,
      field7_currentNationality: data.nationality || prev.field7_currentNationality,
      field7_nationalityAtBirth: prev.field7_nationalityAtBirth || data.nationality || "",
      field8_sex: data.sex || prev.field8_sex,
      field11_nationalIdNumber: data.personalNumber || prev.field11_nationalIdNumber,
      field13_travelDocNumber: data.passportNumber || prev.field13_travelDocNumber,
      field14_issueDate: data.issueDate || prev.field14_issueDate,
      field15_validUntil: data.expiryDate || prev.field15_validUntil,
      field16_issuedBy: data.nationality || data.countryOfBirth || prev.field16_issuedBy,
      field33_signatureName: `${data.firstNames || prev.field3_firstNames} ${data.surname || prev.field1_surname}`.trim(),
    }));

    showToast(`✓ تم تطبيق بيانات جواز السفر (${data.firstNames || ""} ${data.surname || ""}) على الاستمارة بنجاح!`);

    // Smooth scroll down to the form editor
    const editorElem = document.getElementById("schengen-editor-section");
    if (editorElem) {
      editorElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Save current form to database
  const handleSaveToDb = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title: `طلب ${formData.field3_firstNames || "جديد"} ${formData.field1_surname || ""} - ${formData.field24_memberStateOfMainDestination}`,
        applicantName: `${formData.field3_firstNames} ${formData.field1_surname}`.trim(),
        passportNumber: formData.field13_travelDocNumber,
        destinationCountry: formData.field24_memberStateOfMainDestination,
        travelDate: formData.field26_intendedArrivalDate,
        hotelId: formData.hotelId || null,
        formData,
        hasPassportScan: Boolean(passportPreviewImg),
      };
      const res = await apiFetch(
        currentApplicationId ? `/api/applications/${currentApplicationId}` : "/api/applications",
        {
          method: currentApplicationId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (json.success) {
        if (json.application?.id) setCurrentApplicationId(json.application.id);
        showToast("تم الحفظ في ملفك");
        await fetchSavedApplications();
      } else {
        showToast("تنبيه: تم حفظ البيانات محلياً في الذاكرة");
      }
    } catch (e) {
      console.warn("DB save error", e);
      showToast("تنبيه: تم حفظ البيانات في ذاكرة المتصفح");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved application
  const handleDeleteApplication = async (id: number) => {
    try {
      const res = await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedApplications((prev) => prev.filter((a) => a.id !== id));
        showToast("تم حذف الطلب بنجاح");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        جارٍ التحقق من الجلسة...
      </div>
    );
  }

  if (!user) {
    return (
      <LoginForm
        onLoggedIn={(u) => {
          setUser(u as AppUser);
          setAuthChecked(true);
          fetchSavedApplications();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans" dir="rtl">
      
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          if (t === "guide") setIsGuideOpen(true);
          if (t === "saved") setIsSavedModalOpen(true);
        }}
        onOpenGuide={() => setIsGuideOpen(true)}
        savedCount={savedApplications.length}
        user={user}
        onOpenUsers={() => setUsersOpen(true)}
        onNewForm={() => {
          setCurrentApplicationId(null);
          setFormData(defaultSchengenFormData);
        }}
        onLogout={async () => {
          await apiFetch("/api/auth/logout", { method: "POST" });
          setToken("");
          setUser(null);
          window.location.href = "/login";
        }}
      />

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-sm font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section>
          <PassportScanner onApplyExtractedData={handleApplyExtractedData} />
        </section>

        <section>
          <ExtraDataQuickFill formData={formData} onChange={setFormData} />
        </section>

        <section id="schengen-editor-section">
          <SchengenFormEditor
            formData={formData}
            onChange={(newData) => setFormData(newData)}
            onGeneratePdf={async () => {
              await downloadOfficialForm(formData);
              showToast("تم تنزيل النموذج الرسمي المعتمد");
            }}
          />
        </section>

        <section>
          <CompletenessPanel formData={formData} />
        </section>

        {/* STEP 3: Preview and Export */}
        <section>
          <FormPreviewAndExport
            formData={formData}
            onSaveToDb={handleSaveToDb}
            isSaving={isSaving}
          />
        </section>

        <section>
          <DocumentsChecklist />
        </section>
      </main>

      <footer className="border-t border-slate-200 py-5 text-center">
        <p className="text-sm font-bold text-[#1a4f8b]">VisaDesk LY</p>
        <p className="text-[11px] text-[#3db7d4] font-semibold tracking-wide mt-0.5">
          TRAVEL &amp; TOURISM SOLUTIONS
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">الحلول الخاصة بالسفر والسياحة</p>
      </footer>

      {/* Modals */}
      <InstallGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <SavedApplicationsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        applications={savedApplications}
        onSelectApplication={(loadedData, id) => {
          setCurrentApplicationId(id);
          setFormData({
            ...defaultSchengenFormData,
            ...loadedData,
            field22_purposeOfJourney: loadedData.field22_purposeOfJourney?.length
              ? loadedData.field22_purposeOfJourney
              : defaultSchengenFormData.field22_purposeOfJourney,
            field31_applicantMeans: loadedData.field31_applicantMeans || defaultSchengenFormData.field31_applicantMeans,
            field31_sponsorMeans: loadedData.field31_sponsorMeans || [],
          });
          showToast("تم استعادة بيانات الطلب بنجاح!");
        }}
        onDeleteApplication={handleDeleteApplication}
        onRefresh={fetchSavedApplications}
      />

      <UsersModal isOpen={usersOpen} onClose={() => setUsersOpen(false)} />

    </div>
  );
}
