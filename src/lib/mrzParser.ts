// ICAO 9303 TD3 Machine Readable Zone parser with check digits + OCR repair

export const ICAO_COUNTRIES: Record<string, { en: string; ar: string }> = {
  LBY: { en: "Libya", ar: "ليبيا" },
  TUN: { en: "Tunisia", ar: "تونس" },
  EGY: { en: "Egypt", ar: "مصر" },
  DZA: { en: "Algeria", ar: "الجزائر" },
  MAR: { en: "Morocco", ar: "المغرب" },
  SDN: { en: "Sudan", ar: "السودان" },
  JOR: { en: "Jordan", ar: "الأردن" },
  LBN: { en: "Lebanon", ar: "لبنان" },
  SYR: { en: "Syria", ar: "سوريا" },
  IRQ: { en: "Iraq", ar: "العراق" },
  SAU: { en: "Saudi Arabia", ar: "السعودية" },
  ARE: { en: "United Arab Emirates", ar: "الإمارات" },
  QAT: { en: "Qatar", ar: "قطر" },
  KWT: { en: "Kuwait", ar: "الكويت" },
  OMN: { en: "Oman", ar: "عمان" },
  BHR: { en: "Bahrain", ar: "البحرين" },
  YEM: { en: "Yemen", ar: "اليمن" },
  PSE: { en: "Palestine", ar: "فلسطين" },
  MRT: { en: "Mauritania", ar: "موريتانيا" },
  TUR: { en: "Turkey", ar: "تركيا" },
  FRA: { en: "France", ar: "فرنسا" },
  DEU: { en: "Germany", ar: "ألمانيا" },
  D: { en: "Germany", ar: "ألمانيا" },
  ITA: { en: "Italy", ar: "إيطاليا" },
  ESP: { en: "Spain", ar: "إسبانيا" },
  GBR: { en: "United Kingdom", ar: "المملكة المتحدة" },
  USA: { en: "United States", ar: "الولايات المتحدة" },
  CAN: { en: "Canada", ar: "كندا" },
  CHE: { en: "Switzerland", ar: "سويسرا" },
  AUT: { en: "Austria", ar: "النمسا" },
  NLD: { en: "Netherlands", ar: "هولندا" },
  BEL: { en: "Belgium", ar: "بلجيكا" },
  SWE: { en: "Sweden", ar: "السويد" },
  NOR: { en: "Norway", ar: "النرويج" },
  DNK: { en: "Denmark", ar: "الدنمارك" },
  FIN: { en: "Finland", ar: "فنلندا" },
  GRC: { en: "Greece", ar: "اليونان" },
  PRT: { en: "Portugal", ar: "البرتغال" },
  POL: { en: "Poland", ar: "بولندا" },
  CZE: { en: "Czech Republic", ar: "التشيك" },
  HUN: { en: "Hungary", ar: "المجر" },
  MLT: { en: "Malta", ar: "مالطا" },
  PAK: { en: "Pakistan", ar: "باكستان" },
  IND: { en: "India", ar: "الهند" },
  BGD: { en: "Bangladesh", ar: "بنغلاديش" },
  CHN: { en: "China", ar: "الصين" },
  RUS: { en: "Russia", ar: "روسيا" },
  UKR: { en: "Ukraine", ar: "أوكرانيا" },
  NGA: { en: "Nigeria", ar: "نيجيريا" },
  SEN: { en: "Senegal", ar: "السنغال" },
  SOM: { en: "Somalia", ar: "الصومال" },
  ERI: { en: "Eritrea", ar: "إريتريا" },
  ETH: { en: "Ethiopia", ar: "إثيوبيا" },
  TCD: { en: "Chad", ar: "تشاد" },
};

const WEIGHTS = [7, 3, 1];

function charValue(ch: string): number {
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55;
  return 0; // <
}

export function mrzCheckDigit(data: string): string {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += charValue(data[i]) * WEIGHTS[i % 3];
  }
  return String(sum % 10);
}

function onlyMrz(s: string): string {
  return (s || "")
    .toUpperCase()
    .replace(/[\s]/g, "")
    .replace(/[«»]/g, "<<")
    .replace(/[_=\-]/g, "<")
    .replace(/[^A-Z0-9<]/g, "");
}

function toDigitField(s: string): string {
  return s
    .replace(/O/g, "0")
    .replace(/Q/g, "0")
    .replace(/D/g, "0")
    .replace(/I/g, "1")
    .replace(/L/g, "1")
    .replace(/Z/g, "2")
    .replace(/S/g, "5")
    .replace(/B/g, "8")
    .replace(/G/g, "6")
    .replace(/U/g, "0");
}

function toAlphaField(s: string): string {
  return s.replace(/0/g, "O").replace(/1/g, "I").replace(/5/g, "S").replace(/8/g, "B").replace(/6/g, "G");
}

function repairLine1(line: string): string {
  let s = onlyMrz(line).padEnd(44, "<").slice(0, 44);
  if (s[0] !== "P") {
    if (s.startsWith("F<") || s.startsWith("R<")) s = "P" + s.slice(1);
    else s = "P<" + s.replace(/^P/, "").slice(0, 42);
    s = s.padEnd(44, "<").slice(0, 44);
  }
  const issuing = toAlphaField(s.slice(2, 5)).replace(/</g, "A").slice(0, 3).padEnd(3, "<");
  const names = s.slice(5).replace(/0/g, "O");
  return (s[0] + (s[1] === "<" || s[1] === "P" ? s[1] === "P" ? "<" : s[1] : "<") + issuing + names).padEnd(44, "<").slice(0, 44);
}

function repairLine2(line: string): string {
  let s = onlyMrz(line).padEnd(44, "<").slice(0, 44);
  const num = s.slice(0, 9);
  const nat = toAlphaField(s.slice(10, 13));
  const dob = toDigitField(s.slice(13, 19));
  let sex = s[20];
  if (sex !== "M" && sex !== "F" && sex !== "<") {
    if (sex === "H" || sex === "N") sex = "M";
    else if (sex === "E" || sex === "P") sex = "F";
    else sex = "<";
  }
  const exp = toDigitField(s.slice(21, 27));
  const optional = s.slice(28, 42);
  const rebuilt =
    num +
    toDigitField(s[9] || "0") +
    nat.padEnd(3, "<").slice(0, 3) +
    dob +
    toDigitField(s[19] || "0") +
    sex +
    exp +
    toDigitField(s[27] || "0") +
    optional +
    toDigitField(s[42] || "0") +
    toDigitField(s[43] || "0");
  return rebuilt.padEnd(44, "<").slice(0, 44);
}

function parseDateYYMMDD(raw: string, kind: "birth" | "expiry"): string {
  const s = toDigitField(raw);
  if (!/^\d{6}$/.test(s)) return "";
  const yy = parseInt(s.slice(0, 2), 10);
  const mm = parseInt(s.slice(2, 4), 10);
  const dd = parseInt(s.slice(4, 6), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const now = new Date().getFullYear();
  const nowYY = now % 100;
  let year: number;
  if (kind === "expiry") {
    year = yy >= 0 && yy <= 79 ? 2000 + yy : 1900 + yy;
    if (year < now - 1) year = 2000 + yy;
  } else {
    year = yy > nowYY + 1 ? 1900 + yy : 2000 + yy;
    if (year > now) year = 1900 + yy;
    if (now - year > 120) year = 2000 + yy;
  }
  const candidate = new Date(Date.UTC(year, mm - 1, dd));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== mm - 1 || candidate.getUTCDate() !== dd) return "";
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export interface ParsedMRZResult {
  valid: boolean;
  docType: string;
  issuingCountryCode: string;
  issuingCountryName: string;
  surname: string;
  firstNames: string;
  passportNumber: string;
  nationalityCode: string;
  nationalityName: string;
  dateOfBirth: string;
  sex: "MALE" | "FEMALE" | "";
  expiryDate: string;
  personalNumber: string;
  estimatedIssueDate?: string;
  rawLines: [string, string];
  checks?: {
    passport: boolean;
    dob: boolean;
    expiry: boolean;
    composite: boolean;
  };
}

export function parseMRZTD3(line1Raw: string, line2Raw: string): ParsedMRZResult | null {
  const line1 = repairLine1(line1Raw);
  const line2 = repairLine2(line2Raw);

  if (line1[0] !== "P") return null;

  const issuingCode = line1.slice(2, 5).replace(/</g, "");
  const nameSection = line1.slice(5);
  const nameParts = nameSection.split("<<");
  const surname = (nameParts[0] || "").replace(/</g, " ").replace(/\s+/g, " ").trim();
  const firstNames = nameParts.slice(1).join(" ").replace(/</g, " ").replace(/\s+/g, " ").trim();

  const passportNumber = line2.slice(0, 9).replace(/</g, "").trim();
  const nationalityCode = line2.slice(10, 13).replace(/</g, "").trim();
  const dateOfBirth = parseDateYYMMDD(line2.slice(13, 19), "birth");
  const sexRaw = line2[20];
  const expiryDate = parseDateYYMMDD(line2.slice(21, 27), "expiry");
  const personalNumber = line2.slice(28, 42).replace(/</g, "").trim();

  if (!surname || surname.length < 2) return null;
  if (!passportNumber || passportNumber.length < 5) return null;
  if (!dateOfBirth && !expiryDate) return null;

  const passportOk = mrzCheckDigit(line2.slice(0, 9)) === line2[9];
  const dobOk = mrzCheckDigit(line2.slice(13, 19)) === line2[19];
  const expOk = mrzCheckDigit(line2.slice(21, 27)) === line2[27];
  const compositeData = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 28) + line2.slice(28, 42);
  const compositeOk = mrzCheckDigit(compositeData) === line2[43];

  let sex: "MALE" | "FEMALE" | "" = "";
  if (sexRaw === "M") sex = "MALE";
  else if (sexRaw === "F") sex = "FEMALE";

  let estimatedIssueDate = "";
  if (expiryDate) {
    const [y, m, d] = expiryDate.split("-");
    const year = parseInt(y, 10) - 5;
    estimatedIssueDate = `${year}-${m}-${d}`;
  }

  return {
    valid: Boolean(surname && passportNumber && dateOfBirth && expiryDate && passportOk && dobOk && expOk && compositeOk),
    docType: "P",
    issuingCountryCode: issuingCode,
    issuingCountryName: ICAO_COUNTRIES[issuingCode]?.en || issuingCode,
    surname,
    firstNames,
    passportNumber,
    nationalityCode,
    nationalityName: ICAO_COUNTRIES[nationalityCode]?.en || nationalityCode,
    dateOfBirth,
    sex,
    expiryDate,
    personalNumber,
    estimatedIssueDate,
    rawLines: [line1, line2],
    checks: { passport: passportOk, dob: dobOk, expiry: expOk, composite: compositeOk },
  };
}

export function extractMRZFromText(text: string): ParsedMRZResult | null {
  const compact = onlyMrz(text);
  const idx = compact.indexOf("P<");
  if (idx >= 0 && compact.length >= idx + 88) {
    const parsed = parseMRZTD3(compact.slice(idx, idx + 44), compact.slice(idx + 44, idx + 88));
    if (parsed) return parsed;
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => onlyMrz(l))
    .filter((l) => l.length >= 20);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("P<") || lines[i].startsWith("P")) {
      const l1 = lines[i];
      const l2 = lines[i + 1] || "";
      const parsed = parseMRZTD3(l1, l2);
      if (parsed) return parsed;
    }
  }

  // Sliding window on compact string
  for (let i = 0; i < compact.length - 80; i++) {
    if (compact[i] === "P" && (compact[i + 1] === "<" || /[A-Z]/.test(compact[i + 1]))) {
      const parsed = parseMRZTD3(compact.slice(i, i + 44), compact.slice(i + 44, i + 88));
      if (parsed && parsed.surname.length >= 2 && parsed.passportNumber.length >= 6) return parsed;
    }
  }
  return null;
}
