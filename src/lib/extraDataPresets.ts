export const SCHENGEN_COUNTRIES = [
  "FRANCE",
  "GERMANY",
  "ITALY",
  "SPAIN",
  "SWITZERLAND",
  "NETHERLANDS",
  "AUSTRIA",
  "BELGIUM",
  "GREECE",
  "PORTUGAL",
  "POLAND",
  "SWEDEN",
  "NORWAY",
  "DENMARK",
  "FINLAND",
  "CZECH REPUBLIC",
  "HUNGARY",
  "MALTA",
];

export const OCCUPATIONS = [
  { ar: "موظف / موظف حكومي", en: "Employee / Civil servant" },
  { ar: "مهندس برمجيات", en: "Software Engineer" },
  { ar: "مهندس مدني", en: "Civil Engineer" },
  { ar: "طبيب", en: "Medical Doctor" },
  { ar: "صيدلي", en: "Pharmacist" },
  { ar: "محاسب", en: "Accountant" },
  { ar: "رجل أعمال / صاحب شركة", en: "Business owner / Self-employed" },
  { ar: "تاجر", en: "Merchant / Trader" },
  { ar: "معلم / أستاذ", en: "Teacher / Professor" },
  { ar: "طالب", en: "Student" },
  { ar: "ربة منزل", en: "Homemaker" },
  { ar: "متقاعد", en: "Retired" },
  { ar: "محامي", en: "Lawyer" },
  { ar: "صحفي", en: "Journalist" },
  { ar: "سائق", en: "Driver" },
  { ar: "فني", en: "Technician" },
];

export const DESTINATION_PRESETS: Record<
  string,
  {
    ar: string;
    firstEntry: string;
    hotels: { name: string; address: string; phone: string }[];
  }
> = {
  FRANCE: {
    ar: "فرنسا",
    firstEntry: "FRANCE",
    hotels: [
      {
        name: "Novotel Paris Centre Tour Eiffel",
        address: "61 Quai de Grenelle, 75015 Paris, France",
        phone: "+33 1 40 58 20 00",
      },
      {
        name: "Ibis Paris Gare du Nord",
        address: "31-33 Rue de Saint-Quentin, 75010 Paris, France",
        phone: "+33 1 44 65 70 00",
      },
      {
        name: "Hotel ibis Styles Marseille Centre",
        address: "25 Rue du Palais de Justice, 13002 Marseille, France",
        phone: "+33 4 91 90 70 20",
      },
    ],
  },
  GERMANY: {
    ar: "ألمانيا",
    firstEntry: "GERMANY",
    hotels: [
      {
        name: "Motel One Berlin-Hauptbahnhof",
        address: "Invalidenstrasse 54, 10557 Berlin, Germany",
        phone: "+49 30 36410050",
      },
      {
        name: "NH Collection Frankfurt City",
        address: "Vilbeler Strasse 2, 60313 Frankfurt, Germany",
        phone: "+49 69 928890",
      },
      {
        name: "Leonardo Hotel Munich City Center",
        address: "Marsstrasse 31, 80335 Munich, Germany",
        phone: "+49 89 551510",
      },
    ],
  },
  ITALY: {
    ar: "إيطاليا",
    firstEntry: "ITALY",
    hotels: [
      {
        name: "Hotel Artemide Roma",
        address: "Via Nazionale 22, 00184 Rome, Italy",
        phone: "+39 06 489911",
      },
      {
        name: "NH Milano Machiavelli",
        address: "Via Lazzaro Palazzi 5, 20124 Milan, Italy",
        phone: "+39 02 29525656",
      },
    ],
  },
  SPAIN: {
    ar: "إسبانيا",
    firstEntry: "SPAIN",
    hotels: [
      {
        name: "Hotel Catalonia Barcelona Plaza",
        address: "Placa Espanya 6-8, 08014 Barcelona, Spain",
        phone: "+34 93 426 26 00",
      },
      {
        name: "NH Madrid Nacional",
        address: "Paseo del Prado 48, 28014 Madrid, Spain",
        phone: "+34 91 429 66 29",
      },
    ],
  },
  NETHERLANDS: {
    ar: "هولندا",
    firstEntry: "NETHERLANDS",
    hotels: [
      {
        name: "Ibis Amsterdam Centre",
        address: "Stationsplein 49, 1012 AB Amsterdam, Netherlands",
        phone: "+31 20 638 9999",
      },
    ],
  },
  BELGIUM: {
    ar: "بلجيكا",
    firstEntry: "BELGIUM",
    hotels: [
      {
        name: "Hotel NH Brussels City Centre",
        address: "Chaussee de Charleroi 17, 1060 Brussels, Belgium",
        phone: "+32 2 222 57 00",
      },
    ],
  },
  SWITZERLAND: {
    ar: "سويسرا",
    firstEntry: "SWITZERLAND",
    hotels: [
      {
        name: "Ibis Zurich City West",
        address: "Schiffbaustrasse 11, 8005 Zurich, Switzerland",
        phone: "+41 44 276 21 00",
      },
    ],
  },
  AUSTRIA: {
    ar: "النمسا",
    firstEntry: "AUSTRIA",
    hotels: [
      {
        name: "Hotel Mercure Wien City",
        address: "Fleischmarkt 20, 1010 Vienna, Austria",
        phone: "+43 1 511130",
      },
    ],
  },
  GREECE: {
    ar: "اليونان",
    firstEntry: "GREECE",
    hotels: [
      {
        name: "Hotel Grande Bretagne Athens",
        address: "1 Vasileos Georgiou A, Syntagma Square, 10564 Athens, Greece",
        phone: "+30 21 0333 0000",
      },
    ],
  },
};

export const CITY_DEFAULTS: Record<string, { city: string; country: string; phonePrefix: string }> = {
  Libya: { city: "Tripoli", country: "Libya", phonePrefix: "+218" },
  Tunisia: { city: "Tunis", country: "Tunisia", phonePrefix: "+216" },
  Egypt: { city: "Cairo", country: "Egypt", phonePrefix: "+20" },
  Algeria: { city: "Algiers", country: "Algeria", phonePrefix: "+213" },
  Morocco: { city: "Casablanca", country: "Morocco", phonePrefix: "+212" },
  Sudan: { city: "Khartoum", country: "Sudan", phonePrefix: "+249" },
  Jordan: { city: "Amman", country: "Jordan", phonePrefix: "+962" },
  Lebanon: { city: "Beirut", country: "Lebanon", phonePrefix: "+961" },
  Syria: { city: "Damascus", country: "Syria", phonePrefix: "+963" },
  Iraq: { city: "Baghdad", country: "Iraq", phonePrefix: "+964" },
  "Saudi Arabia": { city: "Riyadh", country: "Saudi Arabia", phonePrefix: "+966" },
  "United Arab Emirates": { city: "Dubai", country: "United Arab Emirates", phonePrefix: "+971" },
  Turkey: { city: "Istanbul", country: "Turkey", phonePrefix: "+90" },
};

export function addDaysISO(base: Date, days: number): string {
  const d = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

export function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export const SCHENGEN_DOCUMENTS = [
  {
    id: "form",
    ar: "استمارة طلب التأشيرة الموحدة (هذا الملف بعد تنزيله وتوقيعه)",
    en: "Harmonised Schengen visa application form (signed)",
    required: true,
  },
  {
    id: "passport",
    ar: "جواز سفر صالح 3 أشهر بعد العودة + صورتان من صفحة البيانات",
    en: "Valid passport + copies of biodata page",
    required: true,
  },
  {
    id: "photos",
    ar: "صورتان شخصيتان حديثتان بمواصفات الشنقن (3.5 × 4.5 سم)",
    en: "Two recent Schengen-size photos",
    required: true,
  },
  {
    id: "insurance",
    ar: "تأمين سفر طبي يغطي دول الشنقن بقيمة لا تقل عن 30,000 يورو",
    en: "Travel medical insurance min. EUR 30,000",
    required: true,
  },
  {
    id: "flight",
    ar: "حجز تذكرة طيران ذهاب وعودة (أو خط سير الرحلة)",
    en: "Round-trip flight reservation / itinerary",
    required: true,
  },
  {
    id: "hotel",
    ar: "حجز فندق أو خطاب استضافة رسمي (Invitation / Verpflichtungserklärung)",
    en: "Hotel booking or official invitation letter",
    required: true,
  },
  {
    id: "bank",
    ar: "كشف حساب بنكي لآخر 3 إلى 6 أشهر يثبت القدرة المالية",
    en: "Bank statements last 3–6 months",
    required: true,
  },
  {
    id: "work",
    ar: "خطاب عمل / سجل تجاري / إثبات دراسة (حسب الحالة)",
    en: "Employment letter / trade register / student certificate",
    required: true,
  },
  {
    id: "civil",
    ar: "عقد الزواج / شهادات الميلاد للأطفال المرافقين (إن وجد)",
    en: "Marriage / birth certificates if applicable",
    required: false,
  },
  {
    id: "previous",
    ar: "صور التأشيرات السابقة (شنقن أو غيرها) إن وُجدت",
    en: "Copies of previous visas if any",
    required: false,
  },
];
