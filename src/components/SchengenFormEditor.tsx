"use client";

import React, { useState } from "react";
import { SchengenFormData } from "@/types/schengen";
import { SCHENGEN_COUNTRIES, daysBetween } from "@/lib/extraDataPresets";
import {
  User,
  CreditCard,
  Briefcase,
  Sparkles,
  Plane,
  FileCheck,
  AlertTriangle,
} from "lucide-react";

interface SchengenFormEditorProps {
  formData: SchengenFormData;
  onChange: (data: SchengenFormData) => void;
  onGeneratePdf: () => void | Promise<void>;
  isGeneratingPdf?: boolean;
}

export { SCHENGEN_COUNTRIES };

export function SchengenFormEditor({
  formData,
  onChange,
  onGeneratePdf,
  isGeneratingPdf = false,
}: SchengenFormEditorProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "contact" | "trip" | "sponsor" | "sign">("personal");

  const updateField = (key: keyof SchengenFormData, value: any) => {
    const next: SchengenFormData = {
      ...formData,
      [key]: value,
    };
    if (key === "field26_intendedArrivalDate" || key === "field26_intendedDepartureDate") {
      const days = daysBetween(next.field26_intendedArrivalDate, next.field26_intendedDepartureDate);
      if (days > 0) next.field26_durationOfStayDays = String(days);
    }
    onChange(next);
  };

  // Quick Presets
  const applyPreset = (presetType: "france_tourism" | "germany_business" | "italy_visit" | "spain_tourism") => {
    const today = new Date();
    const arrivalDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const departureDate15 = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const departureDate7 = new Date(today.getTime() + 37 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (presetType === "france_tourism") {
      onChange({
        ...formData,
        field22_purposeOfJourney: ["TOURISM"],
        field24_memberStateOfMainDestination: "FRANCE",
        field25_memberStateOfFirstEntry: "FRANCE",
        field26_numberOfEntries: "SINGLE",
        field26_intendedArrivalDate: arrivalDate,
        field26_intendedDepartureDate: departureDate15,
        field26_durationOfStayDays: "15",
        field29_invitingPersonOrHotelName: "Novotel Paris Centre Tour Eiffel",
        field29_hostAddressAndEmail: "61 Quai de Grenelle, 75015 Paris, France (contact@novotelparis.com)",
        field29_hostPhone: "+33 1 40 58 20 00",
        field31_coveredBy: "APPLICANT",
        field31_applicantMeans: ["CASH", "CREDIT_CARD", "PREPAID_ACCOMMODATION"],
      });
    } else if (presetType === "germany_business") {
      onChange({
        ...formData,
        field22_purposeOfJourney: ["BUSINESS"],
        field24_memberStateOfMainDestination: "GERMANY",
        field25_memberStateOfFirstEntry: "GERMANY",
        field26_numberOfEntries: "SINGLE",
        field26_intendedArrivalDate: arrivalDate,
        field26_intendedDepartureDate: departureDate7,
        field26_durationOfStayDays: "7",
        field29_invitingPersonOrHotelName: "Messe Frankfurt Hotel & Business Center",
        field29_hostAddressAndEmail: "Ludwig-Erhard-Anlage 1, 60327 Frankfurt am Main, Germany",
        field29_hostPhone: "+49 69 7575 0",
        field30_invitingCompany: "Frankfurt Trade Fair GmbH",
        field30_companyContactPerson: "Hans Mueller, International Relations",
        field30_companyAddressAndPhone: "Frankfurt, Germany - Tel: +49 69 7575 5000",
        field31_coveredBy: "APPLICANT",
        field31_applicantMeans: ["CREDIT_CARD", "PREPAID_ACCOMMODATION", "PREPAID_TRANSPORT"],
      });
    } else if (presetType === "italy_visit") {
      onChange({
        ...formData,
        field22_purposeOfJourney: ["TOURISM", "VISITING_FAMILY"],
        field24_memberStateOfMainDestination: "ITALY",
        field25_memberStateOfFirstEntry: "ITALY",
        field26_numberOfEntries: "SINGLE",
        field26_intendedArrivalDate: arrivalDate,
        field26_intendedDepartureDate: departureDate15,
        field26_durationOfStayDays: "15",
        field29_invitingPersonOrHotelName: "Hotel Artemide Roma",
        field29_hostAddressAndEmail: "Via Nazionale 22, 00184 Rome, Italy",
        field29_hostPhone: "+39 06 489911",
        field31_coveredBy: "APPLICANT",
        field31_applicantMeans: ["CASH", "CREDIT_CARD"],
      });
    } else if (presetType === "spain_tourism") {
      onChange({
        ...formData,
        field22_purposeOfJourney: ["TOURISM"],
        field24_memberStateOfMainDestination: "SPAIN",
        field25_memberStateOfFirstEntry: "SPAIN",
        field26_numberOfEntries: "SINGLE",
        field26_intendedArrivalDate: arrivalDate,
        field26_intendedDepartureDate: departureDate15,
        field26_durationOfStayDays: "15",
        field29_invitingPersonOrHotelName: "Hotel Catalonia Barcelona Plaza",
        field29_hostAddressAndEmail: "Placa Espanya 6-8, 08014 Barcelona, Spain",
        field29_hostPhone: "+34 93 426 26 00",
        field31_coveredBy: "APPLICANT",
        field31_applicantMeans: ["CASH", "CREDIT_CARD", "PREPAID_ACCOMMODATION"],
      });
    }
  };

  // Check passport expiry rule: Schengen requires passport valid at least 3 months after departure
  let expiryWarning: string | null = null;
  if (formData.field15_validUntil && formData.field26_intendedDepartureDate) {
    const exp = new Date(formData.field15_validUntil);
    const dep = new Date(formData.field26_intendedDepartureDate);
    const diffMonths = (exp.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24 * 30.5);
    if (diffMonths < 3) {
      expiryWarning = "تنبيه: تشترط لائحة الشنقن أن يكون جواز السفر صالحاً لمدة لا تقل عن 3 أشهر بعد تاريخ مغادرتك لمنطقة الشنقن.";
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Top Presets Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700">تعبئة سريعة لبيانات الرحلة بنقرة واحدة (Presets):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset("france_tourism")}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-all flex items-center gap-1.5"
            >
              <span>🇫🇷 سياحة فرنسا (15 يوماً)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("germany_business")}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium transition-all flex items-center gap-1.5"
            >
              <span>🇩🇪 مهمة عمل ألمانيا (7 أيام)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("italy_visit")}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition-all flex items-center gap-1.5"
            >
              <span>🇮🇹 سياحة وزيارة إيطاليا</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("spain_tourism")}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-medium transition-all flex items-center gap-1.5"
            >
              <span>🇪🇸 سياحة إسبانيا (برشلونة)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-100/70 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "personal"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. الجواز والبيانات الشخصية (1-16)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "contact"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>2. الاتصال والوظيفة (17-21)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("trip")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "trip"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>3. تفاصيل الرحلة (22-28)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sponsor")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "sponsor"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>4. الفندق والمصاريف (29-31)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sign")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "sign"
              ? "bg-white text-blue-700 shadow-sm border border-slate-200"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>5. المكان والتوقيع (32-33)</span>
        </button>
      </div>

      {/* Expiry Warning if applicable */}
      {expiryWarning && (
        <div className="m-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <span>{expiryWarning}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6">
        
        {/* ==================================================== */}
        {/* TAB 1: Personal & Passport Data (Fields 1 to 16) */}
        {/* ==================================================== */}
        {activeTab === "personal" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                الحقول 1 إلى 16 — مطابقة للنموذج الرسمي (Solicitud de visado Schengen)
              </h3>
              <p className="text-xs text-slate-500">
                يتم تعبئة معظم هذه الحقول تلقائياً عند رفع صورة جواز السفر، ويمكنك تعديلها هنا إن دعت الحاجة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Field 1: Surname */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 1. اللقب (اسم العائلة) / Surname:
                </label>
                <input
                  type="text"
                  value={formData.field1_surname}
                  onChange={(e) => updateField("field1_surname", e.target.value.toUpperCase())}
                  placeholder="ELZOWEY"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Field 2: Surname at birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. اللقب عند الولادة (إن اختلف) / Surname at birth:
                </label>
                <input
                  type="text"
                  value={formData.field2_surnameAtBirth}
                  onChange={(e) => updateField("field2_surnameAtBirth", e.target.value.toUpperCase())}
                  placeholder="اتركه فارغاً إن لم يتغير"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 3: First names */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 3. الاسم الأول والأسماء الأخرى / Given name(s):
                </label>
                <input
                  type="text"
                  value={formData.field3_firstNames}
                  onChange={(e) => updateField("field3_firstNames", e.target.value.toUpperCase())}
                  placeholder="TAREK ABDALLAH"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Field 4: Date of birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 4. تاريخ الميلاد / Date of birth:
                </label>
                <input
                  type="date"
                  value={formData.field4_dateOfBirth}
                  onChange={(e) => updateField("field4_dateOfBirth", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 5: Place of birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 5. مكان الميلاد / Place of birth:
                </label>
                <input
                  type="text"
                  value={formData.field5_placeOfBirth}
                  onChange={(e) => updateField("field5_placeOfBirth", e.target.value)}
                  placeholder="Tripoli"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 6: Country of birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 6. بلد الميلاد / Country of birth:
                </label>
                <input
                  type="text"
                  value={formData.field6_countryOfBirth}
                  onChange={(e) => updateField("field6_countryOfBirth", e.target.value)}
                  placeholder="Libya"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 7: Current Nationality */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 7. الجنسية الحالية / Current nationality:
                </label>
                <input
                  type="text"
                  value={formData.field7_currentNationality}
                  onChange={(e) => updateField("field7_currentNationality", e.target.value)}
                  placeholder="Libya"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  7. الجنسية عند الولادة إن اختلفت / Nationality at birth:
                </label>
                <input
                  type="text"
                  value={formData.field7_nationalityAtBirth}
                  onChange={(e) => updateField("field7_nationalityAtBirth", e.target.value)}
                  placeholder="نفس الحالية إن لم تختلف"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  7. جنسيات أخرى / Other nationalities:
                </label>
                <input
                  type="text"
                  value={formData.field7_otherNationalities}
                  onChange={(e) => updateField("field7_otherNationalities", e.target.value)}
                  placeholder="إن وجدت"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 8: Sex */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 8. الجنس / Sex:
                </label>
                <div className="flex gap-4 p-2.5 border border-slate-300 rounded-lg bg-slate-50">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="sex"
                      value="MALE"
                      checked={formData.field8_sex === "MALE"}
                      onChange={() => updateField("field8_sex", "MALE")}
                    />
                    <span>ذكر (Male)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="sex"
                      value="FEMALE"
                      checked={formData.field8_sex === "FEMALE"}
                      onChange={() => updateField("field8_sex", "FEMALE")}
                    />
                    <span>أنثى (Female)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="sex"
                      value="OTHER"
                      checked={formData.field8_sex === "OTHER"}
                      onChange={() => updateField("field8_sex", "OTHER")}
                    />
                    <span>آخر (Other)</span>
                  </label>
                </div>
              </div>

              {/* Field 9: Civil status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 9. الحالة الاجتماعية / Civil status:
                </label>
                <select
                  value={formData.field9_civilStatus}
                  onChange={(e) => updateField("field9_civilStatus", e.target.value as any)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SINGLE">أعزب (Single)</option>
                  <option value="MARRIED">متزوج (Married)</option>
                  <option value="REGISTERED_UNION">اتحاد مسجّل (Registered union)</option>
                  <option value="DIVORCED">مطلق (Divorced)</option>
                  <option value="WIDOWED">أرمل (Widow/er)</option>
                  <option value="SEPARATED">منفصل (Separated)</option>
                  <option value="OTHER">أخرى (Other)</option>
                </select>
              </div>

              {/* Field 11: National ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  11. الرقم الوطني (إن وجد) / National ID No:
                </label>
                <input
                  type="text"
                  value={formData.field11_nationalIdNumber}
                  onChange={(e) => updateField("field11_nationalIdNumber", e.target.value)}
                  placeholder="11989051400"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Field 12: Travel doc type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 12. نوع وثيقة السفر / Travel document type:
                </label>
                <select
                  value={formData.field12_travelDocType}
                  onChange={(e) => updateField("field12_travelDocType", e.target.value as any)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ORDINARY">جواز سفر عادي (Ordinary Passport)</option>
                  <option value="DIPLOMATIC">جواز سفر دبلوماسي (Diplomatic)</option>
                  <option value="SERVICE">جواز سفر خدمة (Service)</option>
                  <option value="OFFICIAL">جواز رسمي (Official)</option>
                  <option value="SPECIAL">جواز خاص (Special)</option>
                </select>
              </div>

              {/* Field 13: Passport number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 13. رقم جواز السفر / Travel document number:
                </label>
                <input
                  type="text"
                  value={formData.field13_travelDocNumber}
                  onChange={(e) => updateField("field13_travelDocNumber", e.target.value.toUpperCase())}
                  placeholder="11A987654"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                />
              </div>

              {/* Field 14: Issue date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 14. تاريخ الإصدار / Date of issue:
                </label>
                <input
                  type="date"
                  value={formData.field14_issueDate}
                  onChange={(e) => updateField("field14_issueDate", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Field 15: Valid until */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 15. صالح حتى (تاريخ الانتهاء) / Valid until:
                </label>
                <input
                  type="date"
                  value={formData.field15_validUntil}
                  onChange={(e) => updateField("field15_validUntil", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Field 16: Issued by */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 16. جهة الإصدار / Issued by (Country):
                </label>
                <input
                  type="text"
                  value={formData.field16_issuedBy}
                  onChange={(e) => updateField("field16_issuedBy", e.target.value)}
                  placeholder="Libya"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                التالي: بيانات الاتصال والوظيفة ←
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: Contact & Occupation (Fields 17 to 21) */}
        {/* ==================================================== */}
        {activeTab === "contact" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                الحقول 17 إلى 21: بيانات الاتصال والإقامة والوظيفة
              </h3>
              <p className="text-xs text-slate-500">
                أدخل عنوان السكن ومعلومات جهة العمل الحالية أو المؤسسة التعليمية.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 18: Home address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 18. عنوان السكن والرمز البريدي / Applicant's home address:
                </label>
                <input
                  type="text"
                  value={formData.field18_homeAddress}
                  onChange={(e) => updateField("field18_homeAddress", e.target.value)}
                  placeholder="شارع عمر المختار، طرابلس، ليبيا / Omar Al-Mukhtar St, Tripoli, Libya"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 18: Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 18. البريد الإلكتروني / E-mail address:
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.field18_email}
                  onChange={(e) => updateField("field18_email", e.target.value)}
                  placeholder="applicant@example.com"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 18: Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 18. رقم الهاتف المحمول / Telephone no.:
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.field18_phone}
                  onChange={(e) => updateField("field18_phone", e.target.value)}
                  placeholder="+218 91 1234567"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 19: Residence in other country */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 19. الإقامة في بلد آخر غير بلد جنسيتك الحالية؟
                </label>
                <div className="flex items-center gap-4 p-2.5 border border-slate-300 rounded-lg bg-slate-50">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="residence"
                      checked={formData.field19_residenceInOtherCountry === "NO"}
                      onChange={() => updateField("field19_residenceInOtherCountry", "NO")}
                    />
                    <span>لا (No) - أقيم في بلدي</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="residence"
                      checked={formData.field19_residenceInOtherCountry === "YES"}
                      onChange={() => updateField("field19_residenceInOtherCountry", "YES")}
                    />
                    <span>نعم (Yes) - لدي إقامة في بلد آخر</span>
                  </label>
                </div>
              </div>

              {/* Field 20: Occupation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 20. المهنة أو الوظيفة الحالية / Current occupation:
                </label>
                <input
                  type="text"
                  value={formData.field20_currentOccupation}
                  onChange={(e) => updateField("field20_currentOccupation", e.target.value)}
                  placeholder="مهندس برمجيات / Software Engineer أو رجل أعمال"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 21: Employer Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  21. هاتف جهة العمل / Employer Telephone:
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.field21_employerPhone}
                  onChange={(e) => updateField("field21_employerPhone", e.target.value)}
                  placeholder="+218 21 4445566"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 21: Employer Name and address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 21. اسم وعنوان جهة العمل (أو الجامعة/المدرسة للطلاب) / Employer name and address:
                </label>
                <input
                  type="text"
                  value={formData.field21_employerNameAndAddress}
                  onChange={(e) => updateField("field21_employerNameAndAddress", e.target.value)}
                  placeholder="شركة التقنية المتقدمة، برج طرابلس، الدور العاشر، طرابلس"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm"
              >
                → السابق
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("trip")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                التالي: تفاصيل الرحلة ←
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: Trip Details (Fields 22 to 28) */}
        {/* ==================================================== */}
        {activeTab === "trip" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                الحقول 22 إلى 28: الغرض من الرحلة وبلد الوجهة وتواريخ السفر
              </h3>
              <p className="text-xs text-slate-500">
                حدد بلد الوجهة الرئيسي، وتاريخ الدخول والمغادرة، وعدد مرات الدخول المطلوبة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Field 22: Purpose of journey */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  * 22. الغرض الأساسي من الرحلة / Purpose(s) of the journey:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "TOURISM", label: "سياحة (Tourism)" },
                    { id: "BUSINESS", label: "أعمال (Business)" },
                    { id: "VISITING_FAMILY", label: "زيارة عائلية (Visiting)" },
                    { id: "CULTURAL", label: "ثقافي (Cultural)" },
                    { id: "SPORTS", label: "رياضي (Sports)" },
                    { id: "OFFICIAL_VISIT", label: "رسمي (Official)" },
                    { id: "MEDICAL", label: "علاجي (Medical)" },
                    { id: "STUDY", label: "دراسة (Study)" },
                  ].map((p) => {
                    const checked = formData.field22_purposeOfJourney.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-all ${
                          checked
                            ? "bg-blue-50 border-blue-400 text-blue-900"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateField("field22_purposeOfJourney", [...formData.field22_purposeOfJourney, p.id]);
                            } else {
                              updateField(
                                "field22_purposeOfJourney",
                                formData.field22_purposeOfJourney.filter((x) => x !== p.id)
                              );
                            }
                          }}
                        />
                        <span>{p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Field 24: Main Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 24. بلد الوجهة الرئيسي / Member State of main destination:
                </label>
                <select
                  value={formData.field24_memberStateOfMainDestination}
                  onChange={(e) => {
                    const country = e.target.value;
                    updateField("field24_memberStateOfMainDestination", country);
                    if (!formData.field25_memberStateOfFirstEntry) {
                      updateField("field25_memberStateOfFirstEntry", country);
                    }
                  }}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-blue-800"
                >
                  {SCHENGEN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 25: First Entry */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 25. بلد الدخول الأول / Member State of first entry:
                </label>
                <select
                  value={formData.field25_memberStateOfFirstEntry}
                  onChange={(e) => updateField("field25_memberStateOfFirstEntry", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {SCHENGEN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 26: Entries requested */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 26. عدد مرات الدخول المطلوبة / Number of entries:
                </label>
                <select
                  value={formData.field26_numberOfEntries}
                  onChange={(e) => updateField("field26_numberOfEntries", e.target.value as any)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SINGLE">دخول لمرة واحدة (Single entry)</option>
                  <option value="TWO">دخول لمرتين (Two entries)</option>
                  <option value="MULTIPLE">دخول متعدد (Multiple entries)</option>
                </select>
              </div>

              {/* Field 26: Arrival Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 26. تاريخ الوصول المتوقع / Intended date of arrival:
                </label>
                <input
                  type="date"
                  value={formData.field26_intendedArrivalDate}
                  onChange={(e) => updateField("field26_intendedArrivalDate", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Field 26: Departure Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 26. تاريخ المغادرة المتوقع / Intended date of departure:
                </label>
                <input
                  type="date"
                  value={formData.field26_intendedDepartureDate}
                  onChange={(e) => updateField("field26_intendedDepartureDate", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Field 26: Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 26. مدة الإقامة بالأيام / Duration of stay (days):
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.field26_durationOfStayDays}
                  onChange={(e) => updateField("field26_durationOfStayDays", e.target.value)}
                  placeholder="15"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              {/* Field 27: Fingerprints */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 27. هل تم أخذ بصمات أصابعك سابقاً للحصول على تأشيرة شنقن؟
                </label>
                <div className="flex items-center gap-6 p-2.5 border border-slate-300 rounded-lg bg-slate-50">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="fingerprints"
                      checked={formData.field27_fingerprintsCollectedPreviously === "NO"}
                      onChange={() => updateField("field27_fingerprintsCollectedPreviously", "NO")}
                    />
                    <span>لا، لم تؤخذ بصماتي من قبل (No)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="radio"
                      name="fingerprints"
                      checked={formData.field27_fingerprintsCollectedPreviously === "YES"}
                      onChange={() => updateField("field27_fingerprintsCollectedPreviously", "YES")}
                    />
                    <span>نعم، أخذت بصماتي سابقاً (Yes)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  30. تصريح دخول الوجهة النهائية — صادر عن:
                </label>
                <input
                  type="text"
                  value={formData.field28_entryPermitIssuedBy}
                  onChange={(e) => updateField("field28_entryPermitIssuedBy", e.target.value)}
                  placeholder="إن وجد"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">30. صالح من:</label>
                <input
                  type="date"
                  value={formData.field28_entryPermitValidFrom}
                  onChange={(e) => updateField("field28_entryPermitValidFrom", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">30. صالح حتى:</label>
                <input
                  type="date"
                  value={formData.field28_entryPermitValidUntil}
                  onChange={(e) => updateField("field28_entryPermitValidUntil", e.target.value)}
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm"
              >
                → السابق
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sponsor")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                التالي: الفندق وتغطية المصاريف ←
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: Hotel & Financial Support (Fields 29 to 31) */}
        {/* ==================================================== */}
        {activeTab === "sponsor" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                الحقول 29 إلى 31: بيانات السكن / الفندق وتغطية نفقات السفر
              </h3>
              <p className="text-xs text-slate-500">
                حدد مقر الإقامة في بلد الشنقن وكيفية تمويل الرحلة (من طرفك أو بواسطة مستضيف/شركة).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Field 29: Hotel / Inviting person name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 29. اسم الفندق أو مقر الإقامة أو الشخص المستضيف:
                </label>
                <input
                  type="text"
                  value={formData.field29_invitingPersonOrHotelName}
                  onChange={(e) => updateField("field29_invitingPersonOrHotelName", e.target.value)}
                  placeholder="Novotel Paris Centre Tour Eiffel"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Field 29: Address and email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 29. عنوان الفندق / المستضيف والبريد الإلكتروني:
                </label>
                <input
                  type="text"
                  value={formData.field29_hostAddressAndEmail}
                  onChange={(e) => updateField("field29_hostAddressAndEmail", e.target.value)}
                  placeholder="61 Quai de Grenelle, 75015 Paris, France"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 29: Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 29. رقم هاتف الفندق أو الشخص المستضيف:
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={formData.field29_hostPhone}
                  onChange={(e) => updateField("field29_hostPhone", e.target.value)}
                  placeholder="+33 1 40 58 20 00"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field 31: Means of support */}
              <div className="md:col-span-2 pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  * 31. من يتحمل تكاليف ومصاريف السفر والإقامة؟ / Cost covered by:
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* By Applicant */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-blue-900">
                      <input
                        type="radio"
                        name="coveredBy"
                        value="APPLICANT"
                        checked={formData.field31_coveredBy === "APPLICANT"}
                        onChange={() => updateField("field31_coveredBy", "APPLICANT")}
                      />
                      <span>متحملة من طرف صاحب الطلب شخصياً</span>
                    </label>

                    <div className="space-y-2 pr-6">
                      {[
                        { id: "CASH", label: "نقداً (Cash)" },
                        { id: "CREDIT_CARD", label: "بطاقة ائتمان (Credit card)" },
                        { id: "PREPAID_ACCOMMODATION", label: "إقامة مدفوعة مسبقاً (Pre-paid hotel)" },
                        { id: "PREPAID_TRANSPORT", label: "تذاكر سفر مدفوعة مسبقاً (Pre-paid transport)" },
                      ].map((item) => {
                        const checked = formData.field31_applicantMeans.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateField("field31_applicantMeans", [...formData.field31_applicantMeans, item.id]);
                                } else {
                                  updateField(
                                    "field31_applicantMeans",
                                    formData.field31_applicantMeans.filter((x) => x !== item.id)
                                  );
                                }
                              }}
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* By Sponsor */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-slate-800">
                      <input
                        type="radio"
                        name="coveredBy"
                        value="SPONSOR"
                        checked={formData.field31_coveredBy === "SPONSOR"}
                        onChange={() => updateField("field31_coveredBy", "SPONSOR")}
                      />
                      <span>متحملة من طرف كفيل أو جهة مستضيفة</span>
                    </label>

                    <div className="space-y-2 pr-6">
                      {[
                        { id: "ALL_EXPENSES", label: "تغطية كامل النفقات أثناء الإقامة" },
                        { id: "ACCOMMODATION", label: "توفير السكن والإقامة" },
                        { id: "PREPAID_TRANSPORT", label: "توفير تذاكر المواصلات والتنقل" },
                      ].map((item) => {
                        const checked = formData.field31_sponsorMeans.includes(item.id);
                        return (
                          <label key={item.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateField("field31_sponsorMeans", [...formData.field31_sponsorMeans, item.id]);
                                } else {
                                  updateField(
                                    "field31_sponsorMeans",
                                    formData.field31_sponsorMeans.filter((x) => x !== item.id)
                                  );
                                }
                              }}
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("trip")}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm"
              >
                → السابق
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sign")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                التالي: المكان والتوقيع ←
              </button>
            </div>
          </div>
        )}

        {activeTab === "sign" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                الحقول 32 و 33: مكان وتاريخ التقديم والتوقيع
              </h3>
              <p className="text-xs text-slate-500">
                الخطوة النهائية قبل طباعة أو تنزيل ملف الـ PDF الرسمي للاستمارة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  * 32. مكان وتاريخ التقديم / Place and date:
                </label>
                <input
                  type="text"
                  value={formData.field32_placeAndDate}
                  onChange={(e) => updateField("field32_placeAndDate", e.target.value)}
                  placeholder="Tripoli, 2025-05-15"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التوقيع / Signature (ولي الأمر للقصر إن لزم):
                </label>
                <input
                  type="text"
                  value={formData.field33_signatureName || `${formData.field3_firstNames} ${formData.field1_surname}`}
                  onChange={(e) => updateField("field33_signatureName", e.target.value)}
                  placeholder="TAREK ABDALLAH ELZOWEY"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  34. اسم من يملأ الاستمارة إن كان مختلفاً عن صاحب الطلب (اختياري):
                </label>
                <input
                  type="text"
                  value={formData.field34_fillerName}
                  onChange={(e) => updateField("field34_fillerName", e.target.value)}
                  placeholder="اتركه فارغاً إذا كنت تملأ الاستمارة بنفسك"
                  className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed space-y-2">
              <p className="font-bold text-slate-800">
                إقرار نظام تأشيرات شنقن الرسمي (VIS & European Regulation):
              </p>
              <p>
                بإصدار وطباعة هذه الاستمارة، يقر صاحب الطلب بصحة كافة البيانات الواردة فيها، وعلمه بأنه ستتم معالجة بياناته في نظام معلومات التأشيرات الأوروبي (VIS)، وموافقته على الالتزام بمغادرة أراضي دول الشنقن قبل انتهاء صلاحية التأشيرة الممنوحة.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("sponsor")}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm"
              >
                → السابق
              </button>

              <button
                type="button"
                onClick={onGeneratePdf}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-base"
              >
                <FileCheck className="w-5 h-5" />
                <span>{isGeneratingPdf ? "جارٍ إعداد النموذج..." : "تصدير وتنزيل استمارة شنقن الرسمية (PDF)"}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}