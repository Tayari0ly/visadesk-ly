"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SchengenFormData } from "@/types/schengen";
import { apiFetch } from "@/lib/client";
import {
  OCCUPATIONS,
  DESTINATION_PRESETS,
  CITY_DEFAULTS,
  addDaysISO,
  daysBetween,
} from "@/lib/extraDataPresets";
import { SCHENGEN_COUNTRIES } from "@/lib/extraDataPresets";
import {
  Wand2,
  MapPin,
  Briefcase,
  Plane,
  Building2,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

interface ExtraDataQuickFillProps {
  formData: SchengenFormData;
  onChange: (data: SchengenFormData) => void;
}

export function ExtraDataQuickFill({ formData, onChange }: ExtraDataQuickFillProps) {
  const [applied, setApplied] = useState(false);
  const [hotelSearch, setHotelSearch] = useState("");
  const [remoteHotels, setRemoteHotels] = useState<Array<{ id: number; hotelName: string; address: string; city: string; phone: string }>>([]);
  const [hotelLoading, setHotelLoading] = useState(false);

  const hotels = DESTINATION_PRESETS[formData.field24_memberStateOfMainDestination]?.hotels || [];
  const filteredHotels = useMemo(() => {
    const query = hotelSearch.trim().toLowerCase();
    if (!query) return hotels;
    return hotels.filter((hotel) => `${hotel.name} ${hotel.address} ${hotel.phone}`.toLowerCase().includes(query));
  }, [hotelSearch, hotels]);

  useEffect(() => {
    const query = hotelSearch.trim();
    if (query.length < 2) {
      setRemoteHotels([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setHotelLoading(true);
      try {
        const response = await apiFetch(`/api/hotels?q=${encodeURIComponent(query)}&limit=20`);
        const json = await response.json();
        if (json.success) setRemoteHotels(json.hotels || []);
      } catch {
        setRemoteHotels([]);
      } finally {
        setHotelLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [hotelSearch]);

  const suggestedCity = useMemo(() => {
    return CITY_DEFAULTS[formData.field7_currentNationality] || CITY_DEFAULTS.Libya;
  }, [formData.field7_currentNationality]);

  const fillSmartDefaults = () => {
    const today = new Date();
    const arrival = formData.field26_intendedArrivalDate || addDaysISO(today, 35);
    const departure =
      formData.field26_intendedDepartureDate ||
      addDaysISO(new Date(arrival), Number(formData.field26_durationOfStayDays || 15));
    const dest = formData.field24_memberStateOfMainDestination || "FRANCE";
    const hotel = DESTINATION_PRESETS[dest]?.hotels[0];
    const city = CITY_DEFAULTS[formData.field7_currentNationality] || suggestedCity;

    onChange({
      ...formData,
      field5_placeOfBirth: formData.field5_placeOfBirth || city.city,
      field6_countryOfBirth: formData.field6_countryOfBirth || city.country,
      field18_homeAddress:
        formData.field18_homeAddress || `${city.city}, ${city.country}`,
      field18_phone: formData.field18_phone || `${city.phonePrefix} `,
      field18_email:
        formData.field18_email ||
        `${(formData.field3_firstNames || "applicant").split(" ")[0].toLowerCase()}.${(
          formData.field1_surname || "visa"
        ).toLowerCase()}@email.com`.replace(/\s+/g, ""),
      field20_currentOccupation: formData.field20_currentOccupation || "Employee / Civil servant",
      field21_employerNameAndAddress:
        formData.field21_employerNameAndAddress || `Private company, ${city.city}, ${city.country}`,
      field21_employerPhone: formData.field21_employerPhone || `${city.phonePrefix} `,
      field22_purposeOfJourney:
        formData.field22_purposeOfJourney?.length ? formData.field22_purposeOfJourney : ["TOURISM"],
      field24_memberStateOfMainDestination: dest,
      field25_memberStateOfFirstEntry: formData.field25_memberStateOfFirstEntry || dest,
      field26_numberOfEntries: formData.field26_numberOfEntries || "SINGLE",
      field26_intendedArrivalDate: arrival,
      field26_intendedDepartureDate: departure,
      field26_durationOfStayDays: String(daysBetween(arrival, departure) || 15),
      field29_invitingPersonOrHotelName: formData.field29_invitingPersonOrHotelName || hotel?.name || "",
      field29_hostAddressAndEmail: formData.field29_hostAddressAndEmail || hotel?.address || "",
      field29_hostPhone: formData.field29_hostPhone || hotel?.phone || "",
      field31_coveredBy: formData.field31_coveredBy || "APPLICANT",
      field31_applicantMeans:
        formData.field31_applicantMeans?.length
          ? formData.field31_applicantMeans
          : ["CASH", "CREDIT_CARD", "PREPAID_ACCOMMODATION"],
      field32_placeAndDate:
        formData.field32_placeAndDate || `${city.city}, ${today.toISOString().split("T")[0]}`,
      field33_signatureName:
        formData.field33_signatureName ||
        `${formData.field3_firstNames} ${formData.field1_surname}`.trim(),
    });
    setApplied(true);
  };

  const update = (partial: Partial<SchengenFormData>) => {
    const next = { ...formData, ...partial };
    if (partial.field26_intendedArrivalDate || partial.field26_intendedDepartureDate) {
      const days = daysBetween(next.field26_intendedArrivalDate, next.field26_intendedDepartureDate);
      if (days > 0) next.field26_durationOfStayDays = String(days);
    }
    if (partial.field24_memberStateOfMainDestination && !formData.field25_memberStateOfFirstEntry) {
      next.field25_memberStateOfFirstEntry = partial.field24_memberStateOfMainDestination;
    }
    onChange(next);
  };

  const applyHotel = (name: string) => {
    const dest = formData.field24_memberStateOfMainDestination;
    const remote = remoteHotels.find((h) => h.hotelName === name);
    if (remote) {
      update({ hotelId: remote.id, field29_invitingPersonOrHotelName: remote.hotelName, field29_hostAddressAndEmail: [remote.address, remote.city].filter(Boolean).join(", "), field29_hostPhone: remote.phone });
      return;
    }
    const hotel = (DESTINATION_PRESETS[dest]?.hotels || []).find((h) => h.name === name);
    if (!hotel) {
      update({ hotelId: null, field29_invitingPersonOrHotelName: name });
      return;
    }
    update({
      hotelId: null,
      field29_invitingPersonOrHotelName: hotel.name,
      field29_hostAddressAndEmail: hotel.address,
      field29_hostPhone: hotel.phone,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">بيانات الرحلة</h2>
        <button
          type="button"
          onClick={fillSmartDefaults}
          className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Wand2 className="w-3.5 h-3.5" />
          تعبئة تلقائية
        </button>
      </div>

      {applied && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold px-6 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          تم تطبيق التعبئة الذكية. يمكنك تعديل أي حقل أدناه وسيظهر فوراً في الاستمارة والـ PDF.
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact */}
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> السكن والتواصل (حقل 18)
          </h3>
          <input
            className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
            placeholder="عنوان السكن الكامل"
            value={formData.field18_homeAddress}
            onChange={(e) => update({ field18_homeAddress: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              dir="ltr"
              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
              placeholder="email@example.com"
              value={formData.field18_email}
              onChange={(e) => update({ field18_email: e.target.value })}
            />
            <input
              dir="ltr"
              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
              placeholder={suggestedCity.phonePrefix + " 91xxxxxxx"}
              value={formData.field18_phone}
              onChange={(e) => update({ field18_phone: e.target.value })}
            />
          </div>
        </div>

        {/* Work */}
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" /> الوظيفة وجهة العمل (20-21)
          </h3>
          <select
            className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
            value={formData.field20_currentOccupation}
            onChange={(e) => update({ field20_currentOccupation: e.target.value })}
          >
            <option value="">اختر المهنة...</option>
            {OCCUPATIONS.map((o) => (
              <option key={o.en} value={o.en}>
                {o.ar} — {o.en}
              </option>
            ))}
          </select>
          <input
            className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
            placeholder="اسم وعنوان جهة العمل أو الجامعة"
            value={formData.field21_employerNameAndAddress}
            onChange={(e) => update({ field21_employerNameAndAddress: e.target.value })}
          />
        </div>

        {/* Trip */}
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Plane className="w-4 h-4 text-sky-600" /> وجهة وتواريخ الرحلة (22-26)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-blue-800"
              value={formData.field24_memberStateOfMainDestination}
              onChange={(e) =>
                update({
                  field24_memberStateOfMainDestination: e.target.value,
                  field25_memberStateOfFirstEntry: e.target.value,
                })
              }
            >
              {SCHENGEN_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {DESTINATION_PRESETS[c]?.ar || c} — {c}
                </option>
              ))}
            </select>
            <select
              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
              value={formData.field22_purposeOfJourney[0] || "TOURISM"}
              onChange={(e) => update({ field22_purposeOfJourney: [e.target.value] })}
            >
              <option value="TOURISM">سياحة / Tourism</option>
              <option value="BUSINESS">أعمال / Business</option>
              <option value="VISITING_FAMILY">زيارة عائلية / Visiting</option>
              <option value="STUDY">دراسة / Study</option>
              <option value="MEDICAL">علاج / Medical</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-600">
              تاريخ الوصول
              <input
                type="date"
                className="mt-1 w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                value={formData.field26_intendedArrivalDate}
                onChange={(e) => update({ field26_intendedArrivalDate: e.target.value })}
              />
            </label>
            <label className="text-xs text-slate-600">
              تاريخ المغادرة
              <input
                type="date"
                className="mt-1 w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white font-mono"
                value={formData.field26_intendedDepartureDate}
                onChange={(e) => update({ field26_intendedDepartureDate: e.target.value })}
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            مدة الإقامة المحسوبة تلقائياً:{" "}
            <strong className="text-blue-700">{formData.field26_durationOfStayDays || "—"} يوماً</strong>
          </p>
        </div>

        {/* Hotel */}
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" /> الفندق أو المستضيف (29)
          </h3>
          <input
            type="search"
            dir="auto"
            value={hotelSearch}
            onChange={(e) => setHotelSearch(e.target.value)}
            placeholder="ابحث في قاعدة الفنادق أو القائمة المحلية..."
            className="w-full text-sm p-2.5 border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
          />
          <select
            className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
            value={formData.field29_invitingPersonOrHotelName}
            onChange={(e) => applyHotel(e.target.value)}
          >
            <option value="">اختر فندقاً من نتائج البحث أو اكتب يدوياً أدناه...</option>
            {remoteHotels.map((h) => (
              <option key={`db-${h.id}`} value={h.hotelName}>
                {h.hotelName}{h.city ? ` — ${h.city}` : ""}
              </option>
            ))}
            {filteredHotels.map((h) => (
              <option key={h.name} value={h.name}>
                {h.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">{hotelLoading ? "جارٍ البحث في قاعدة الفنادق..." : `تظهر ${remoteHotels.length + filteredHotels.length} نتيجة. اختر الفندق ليتم ملء البيانات وحفظ hotel_id.`}</p>
          <button
            type="button"
            className="text-xs font-bold text-emerald-700 underline"
            onClick={async () => {
              const name = window.prompt("اسم الفندق لإرساله للمراجعة:", hotelSearch || formData.field29_invitingPersonOrHotelName);
              if (!name?.trim()) return;
              const address = window.prompt("العنوان (اختياري):", formData.field29_hostAddressAndEmail || "") || "";
              try {
                const response = await apiFetch("/api/hotels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hotelName: name, address, country: formData.field24_memberStateOfMainDestination === "SPAIN" ? "Spain" : formData.field24_memberStateOfMainDestination }) });
                const json = await response.json();
                if (json.success) update({ hotelId: json.hotel.id, field29_invitingPersonOrHotelName: json.hotel.hotelName, field29_hostAddressAndEmail: json.hotel.address });
                else window.alert(json.error === "DUPLICATE" ? "هذا الفندق موجود مسبقاً أو قيد المراجعة." : json.error || "تعذر إرسال الفندق");
              } catch { window.alert("تعذر الاتصال بقاعدة الفنادق"); }
            }}
          >
            + إضافة فندق غير موجود للمراجعة
          </button>
          <input
            className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
            placeholder="اسم الفندق أو الشخص المستضيف"
            value={formData.field29_invitingPersonOrHotelName}
            onChange={(e) => update({ hotelId: null, field29_invitingPersonOrHotelName: e.target.value })}
          />
          <input
            className="w-full text-sm p-2.5 border border-slate-300 rounded-lg bg-white"
            placeholder="العنوان والبريد الإلكتروني"
            value={formData.field29_hostAddressAndEmail}
            onChange={(e) => update({ field29_hostAddressAndEmail: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
