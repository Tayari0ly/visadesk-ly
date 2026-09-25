import { SchengenFormData } from "@/types/schengen";

export interface CompletenessItem {
  official: string;
  ar: string;
  ok: boolean;
  required: boolean;
}

export interface CompletenessReport {
  percent: number;
  requiredTotal: number;
  requiredDone: number;
  items: CompletenessItem[];
  readyToExport: boolean;
}

export function checkFormCompleteness(data: SchengenFormData): CompletenessReport {
  const items: CompletenessItem[] = [
    { official: "1", ar: "اللقب / Surname", ok: Boolean(data.field1_surname), required: true },
    { official: "3", ar: "الاسم / First name(s)", ok: Boolean(data.field3_firstNames), required: true },
    { official: "4", ar: "تاريخ الميلاد", ok: Boolean(data.field4_dateOfBirth), required: true },
    { official: "5", ar: "مكان الميلاد", ok: Boolean(data.field5_placeOfBirth), required: true },
    { official: "6", ar: "بلد الميلاد", ok: Boolean(data.field6_countryOfBirth), required: true },
    { official: "7", ar: "الجنسية الحالية", ok: Boolean(data.field7_currentNationality), required: true },
    { official: "8", ar: "الجنس", ok: Boolean(data.field8_sex), required: true },
    { official: "9", ar: "الحالة المدنية", ok: Boolean(data.field9_civilStatus), required: true },
    { official: "12", ar: "نوع وثيقة السفر", ok: Boolean(data.field12_travelDocType), required: true },
    { official: "13", ar: "رقم الجواز", ok: Boolean(data.field13_travelDocNumber), required: true },
    { official: "14", ar: "تاريخ إصدار الجواز", ok: Boolean(data.field14_issueDate), required: true },
    { official: "15", ar: "صلاحية الجواز", ok: Boolean(data.field15_validUntil), required: true },
    { official: "16", ar: "جهة إصدار الجواز", ok: Boolean(data.field16_issuedBy), required: true },
    { official: "19", ar: "عنوان السكن", ok: Boolean(data.field18_homeAddress), required: true },
    { official: "19", ar: "البريد الإلكتروني", ok: Boolean(data.field18_email), required: true },
    { official: "19", ar: "رقم الهاتف", ok: Boolean(data.field18_phone), required: true },
    { official: "21", ar: "المهنة الحالية", ok: Boolean(data.field20_currentOccupation), required: true },
    { official: "22", ar: "جهة العمل", ok: Boolean(data.field21_employerNameAndAddress), required: true },
    { official: "23", ar: "غرض الرحلة", ok: Boolean(data.field22_purposeOfJourney?.length), required: true },
    { official: "25", ar: "بلد الوجهة الرئيسي", ok: Boolean(data.field24_memberStateOfMainDestination), required: true },
    { official: "26", ar: "بلد الدخول الأول", ok: Boolean(data.field25_memberStateOfFirstEntry), required: true },
    { official: "27", ar: "عدد مرات الدخول", ok: Boolean(data.field26_numberOfEntries), required: true },
    { official: "28", ar: "تاريخ الوصول", ok: Boolean(data.field26_intendedArrivalDate), required: true },
    { official: "28", ar: "تاريخ المغادرة", ok: Boolean(data.field26_intendedDepartureDate), required: true },
    { official: "31", ar: "الفندق / المستضيف", ok: Boolean(data.field29_invitingPersonOrHotelName), required: true },
    { official: "31", ar: "عنوان الفندق", ok: Boolean(data.field29_hostAddressAndEmail), required: true },
    { official: "33", ar: "تغطية المصاريف", ok: Boolean(data.field31_coveredBy), required: true },
    { official: "—", ar: "المكان والتاريخ", ok: Boolean(data.field32_placeAndDate), required: true },
    { official: "—", ar: "اسم التوقيع", ok: Boolean(data.field33_signatureName || (data.field3_firstNames && data.field1_surname)), required: true },
    { official: "2", ar: "اللقب عند الولادة", ok: Boolean(data.field2_surnameAtBirth), required: false },
    { official: "11", ar: "الرقم الوطني", ok: Boolean(data.field11_nationalIdNumber), required: false },
    { official: "24", ar: "معلومات إضافية عن الغرض", ok: Boolean(data.field23_additionalInfoPurpose), required: false },
  ];

  const required = items.filter((i) => i.required);
  const requiredDone = required.filter((i) => i.ok).length;
  const percent = Math.round((requiredDone / required.length) * 100);

  return {
    percent,
    requiredTotal: required.length,
    requiredDone,
    items,
    readyToExport: percent >= 90,
  };
}
