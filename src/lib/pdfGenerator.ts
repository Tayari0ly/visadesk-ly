import { jsPDF } from "jspdf";
import { SchengenFormData } from "@/types/schengen";
import { embedPdfFonts } from "@/lib/pdfFont";

function fmtDate(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return iso;
}

function up(v: string): string {
  return (v || "").toUpperCase();
}

export async function generateSchengenPDF(data: SchengenFormData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const unicode = await embedPdfFonts(doc);
  const FONT = unicode ? "DejaVu" : "helvetica";
  const W = 210;
  const H = 297;
  const L = 12;
  const R = 198;
  const TW = R - L;

  const BLACK: [number, number, number] = [15, 15, 15];
  const LINE: [number, number, number] = [30, 30, 30];

  const setStroke = (w = 0.28) => {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(w);
  };

  const rect = (x: number, y: number, w: number, h: number) => {
    setStroke();
    doc.rect(x, y, w, h);
  };

  const fillRect = (x: number, y: number, w: number, h: number, rgb: [number, number, number]) => {
    doc.setFillColor(...rgb);
    doc.rect(x, y, w, h, "F");
  };

  const label = (text: string, x: number, y: number, size = 6.2, bold = true) => {
    doc.setFont(FONT, bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...BLACK);
    doc.text(text, x, y);
  };

  const value = (text: string, x: number, y: number, maxW = 80, size = 8.5) => {
    if (!text) return;
      doc.setFont(FONT, "bold");
      doc.setFontSize(size);
      doc.setTextColor(10, 25, 80);
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, x, y);
  };

  const checkbox = (x: number, y: number, checked: boolean, text: string) => {
    setStroke(0.3);
    doc.rect(x, y - 2.4, 3.2, 3.2);
    if (checked) {
      doc.setFillColor(15, 15, 15);
      doc.rect(x + 0.55, y - 1.85, 2.1, 2.1, "F");
    }
    doc.setFont(FONT, "normal");
    doc.setFontSize(6.1);
    doc.setTextColor(...BLACK);
    doc.text(text, x + 4.2, y);
  };

  const star = (cx: number, cy: number, r: number) => {
    doc.setDrawColor(255, 204, 0);
    doc.setFillColor(255, 204, 0);
    doc.setLineWidth(0.15);
    for (let i = 0; i < 5; i++) {
      const a1 = (-90 + i * 72) * (Math.PI / 180);
      const a2 = (-90 + i * 72 + 144) * (Math.PI / 180);
      doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
    }
    doc.circle(cx, cy, r * 0.28, "F");
  };

  const drawEUFlag = (x: number, y: number, w: number, h: number) => {
    fillRect(x, y, w, h, [0, 51, 153]);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const ring = Math.min(w, h) * 0.32;
    for (let i = 0; i < 12; i++) {
      const ang = (i * 30 - 90) * (Math.PI / 180);
      star(cx + ring * Math.cos(ang), cy + ring * Math.sin(ang), 1.15);
    }
  };

  const pageFooter = (n: number) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(String(n), W / 2, H - 6, { align: "center" });
  };

  const purposes = data.field22_purposeOfJourney || [];
  const appMeans = data.field31_applicantMeans || [];
  const spMeans = data.field31_sponsorMeans || [];
  const entries = data.field26_numberOfEntries;
  const covered = data.field31_coveredBy;

  // =====================================================================
  // PAGE 1
  // =====================================================================
  const outerTop = 8;
  const outerH = 282;
  rect(L, outerTop, TW, outerH);

  // Header row
  const headerH = 28;
  rect(L, outerTop, TW, headerH);
  drawEUFlag(L + 1.2, outerTop + 3.2, 28, 21);

  doc.setFont(FONT, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text("Solicitud de visado Schengen", L + TW / 2 - 8, outerTop + 9, { align: "center" });
  doc.text("Application for Schengen Visa", L + TW / 2 - 8, outerTop + 15.5, { align: "center" });
  doc.setFont(FONT, "normal");
  doc.setFontSize(8);
  doc.text("Impreso gratuito", L + TW / 2 - 8, outerTop + 21, { align: "center" });
  doc.text("This application form is free", L + TW / 2 - 8, outerTop + 25.2, { align: "center" });

  // Photo box
  const photoW = 32;
  const photoH = 40;
  const photoX = R - photoW;
  rect(photoX, outerTop, photoW, photoH);
  doc.setFont(FONT, "bold");
  doc.setFontSize(8);
  doc.text("FOTO", photoX + photoW / 2, outerTop + 17, { align: "center" });
  doc.text("PHOTO", photoX + photoW / 2, outerTop + 22, { align: "center" });

  // Notes
  let y = outerTop + headerH;
  rect(L, y, TW, 14);
  doc.setFont(FONT, "normal");
  doc.setFontSize(5.4);
  const note1 =
    "Los miembros de la familia de un ciudadano de la UE, del EEE o de Suiza o de un nacional del Reino Unido beneficiario del Acuerdo de Retirada no deberán rellenar las casillas n.os 21, 22, 30, 31 y 32 (marcadas con *). / Family members of EU, EEA, CH citizens or British nationals covered by the withdrawal agreement shall not fill in fields no. 21, 22, 31, 32 and 33 (marked with *).";
  const note2 =
    "Las casillas número 1 a 3 deberán rellenarse con los datos que figuren en el documento de viaje / Fields 1-3 shall be filled in in accordance with the data in the travel document.";
  doc.text(doc.splitTextToSize(note1, TW - 3), L + 1.5, y + 4);
  doc.text(doc.splitTextToSize(note2, TW - 3), L + 1.5, y + 10.5);

  // Official use column
  const offX = 152;
  const offW = R - offX;
  const mainW = offX - L;

  y = outerTop + headerH + 14;

  // Field 1
  rect(L, y, mainW, 12);
  label("1. Apellido(s)/Surname(s):", L + 1.5, y + 3.6);
  value(up(data.field1_surname), L + 1.5, y + 9, mainW - 4);
  y += 12;

  // Field 2
  rect(L, y, mainW, 11);
  label("2. Apellido(s) de nacimiento [(apellido(s) anterior(es))]/Surname at birth (Former family name(s)):", L + 1.5, y + 3.4, 5.6);
  value(up(data.field2_surnameAtBirth), L + 1.5, y + 8.5, mainW - 4);
  y += 11;

  // Field 3
  rect(L, y, mainW, 11);
  label("3. Nombre(s)/First name(s) (Given name(s)):", L + 1.5, y + 3.4);
  value(up(data.field3_firstNames), L + 1.5, y + 8.5, mainW - 4);
  y += 11;

  // Fields 4 / 5-6 / 7
  const rowH = 22;
  const c4 = 42;
  const c56 = 50;
  const c7 = mainW - c4 - c56;
  rect(L, y, c4, rowH);
  label("4. Fecha de nacimiento (día-mes-año)/", L + 1.2, y + 3.2, 5.5);
  label("Date of birth (day-month-year):", L + 1.2, y + 6.4, 5.5);
  value(fmtDate(data.field4_dateOfBirth), L + 1.5, y + 14, c4 - 3, 9);

  rect(L + c4, y, c56, 11);
  label("5. Lugar de nacimiento/Place of birth:", L + c4 + 1.2, y + 3.2, 5.4);
  value(data.field5_placeOfBirth, L + c4 + 1.2, y + 8.4, c56 - 3, 7.5);

  rect(L + c4, y + 11, c56, 11);
  label("6. País de nacimiento/Country of birth:", L + c4 + 1.2, y + 14.2, 5.4);
  value(data.field6_countryOfBirth, L + c4 + 1.2, y + 19.4, c56 - 3, 7.5);

  rect(L + c4 + c56, y, c7, rowH);
  label("7. Nacionalidad actual/Current nationality:", L + c4 + c56 + 1.2, y + 3.2, 5.4);
  value(data.field7_currentNationality, L + c4 + c56 + 1.2, y + 8, c7 - 3, 7.5);
  label("Nacionalidad de nacimiento, si difiere de", L + c4 + c56 + 1.2, y + 12, 5.1, false);
  label("la actual/ Nationality at birth, if different:", L + c4 + c56 + 1.2, y + 14.6, 5.1, false);
  value(data.field7_nationalityAtBirth || "", L + c4 + c56 + 1.2, y + 19.5, c7 - 3, 7);
  y += rowH;

  // Other nationalities line inside field 7 area already used - extra thin row
  rect(L, y, mainW, 8);
  label("Otras nacionalidades/Other nationalities:", L + 1.5, y + 3.2, 5.5);
  value(data.field7_otherNationalities, L + 52, y + 5.5, mainW - 54, 7);
  y += 8;

  // 8 & 9
  const sexW = 70;
  rect(L, y, sexW, 16);
  label("8. Sexo/Sex:", L + 1.5, y + 3.4);
  checkbox(L + 2, y + 8.5, data.field8_sex === "MALE", "Varón/Male");
  checkbox(L + 28, y + 8.5, data.field8_sex === "FEMALE", "Mujer/Female");
  checkbox(L + 2, y + 13.2, data.field8_sex === "OTHER", "Otro/Other");

  rect(L + sexW, y, mainW - sexW, 16);
  label("9. Estado civil/Marital status:", L + sexW + 1.5, y + 3.2);
  checkbox(L + sexW + 1.5, y + 7.4, data.field9_civilStatus === "SINGLE", "Soltero-a/Single");
  checkbox(L + sexW + 32, y + 7.4, data.field9_civilStatus === "MARRIED", "Casado-a/Married");
  checkbox(L + sexW + 62, y + 7.4, data.field9_civilStatus === "REGISTERED_UNION", "Unión registrada/");
  checkbox(L + sexW + 1.5, y + 12.2, data.field9_civilStatus === "SEPARATED", "Separado-a/Separated");
  checkbox(L + sexW + 38, y + 12.2, data.field9_civilStatus === "DIVORCED", "Divorciado-a/Divorced");
  checkbox(L + sexW + 72, y + 12.2, data.field9_civilStatus === "WIDOWED", "Viudo-a/Widow-er");
  y += 16;

  // 10
  rect(L, y, mainW, 16);
  label(
    "10. Persona que ejerce la patria potestad (en caso de menores de edad)/tutor legal / In the case of minors: parental authority/legal guardian:",
    L + 1.3,
    y + 3.3,
    5.3
  );
  value(data.field10_parentalAuthority || "", L + 1.5, y + 9.5, mainW - 4, 7.5);
  y += 16;

  // 11
  rect(L, y, mainW, 9);
  label("11. Número de documento nacional de identidad, si procede/National identity number, where applicable:", L + 1.3, y + 3.2, 5.5);
  value(data.field11_nationalIdNumber, L + 1.5, y + 7.5, mainW - 4, 8);
  y += 9;

  // 12
  rect(L, y, mainW, 16);
  label("12. Tipo de documento de viaje/Type of travel document:", L + 1.3, y + 3.2, 5.6);
  checkbox(L + 1.5, y + 7.4, data.field12_travelDocType === "ORDINARY", "Pasaporte ordinario/Ordinary Passport");
  checkbox(L + 62, y + 7.4, data.field12_travelDocType === "DIPLOMATIC", "Pasaporte diplomatico/Diplomatic passport");
  checkbox(L + 1.5, y + 12.2, data.field12_travelDocType === "SERVICE", "Pasaporte de servicio/Service Passport");
  checkbox(L + 62, y + 12.2, data.field12_travelDocType === "OFFICIAL", "Pasaporte oficial/Official passport");
  checkbox(L + 110, y + 12.2, data.field12_travelDocType === "SPECIAL" || data.field12_travelDocType === "OTHER", "Especial/Otro / Special/Other");
  y += 16;

  // 13-16
  const q = mainW / 4;
  rect(L, y, q, 12);
  label("13. Número del documento de viaje/", L + 1, y + 3, 5.2);
  label("Number of travel document:", L + 1, y + 5.8, 5.2);
  value(up(data.field13_travelDocNumber), L + 1.2, y + 10.2, q - 2, 8);

  rect(L + q, y, q, 12);
  label("14. Fecha de expedición/", L + q + 1, y + 3, 5.2);
  label("Date of issue:", L + q + 1, y + 5.8, 5.2);
  value(fmtDate(data.field14_issueDate), L + q + 1.2, y + 10.2, q - 2, 8);

  rect(L + q * 2, y, q, 12);
  label("15. Valido hasta/Valid until:", L + q * 2 + 1, y + 3, 5.2);
  value(fmtDate(data.field15_validUntil), L + q * 2 + 1.2, y + 10.2, q - 2, 8);

  rect(L + q * 3, y, q, 12);
  label("16. Expedido por (pais)/Issued by (country):", L + q * 3 + 1, y + 3, 5.1);
  value(data.field16_issuedBy, L + q * 3 + 1.2, y + 10.2, q - 2, 7.5);
  y += 12;

  // 17
  const f17h = outerTop + outerH - y;
  rect(L, y, mainW, f17h);
  label(
    "17. Datos personales del miembro de la familia que sea ciudadano de la UE, del EEE o de Suiza o un nacional del Reino Unido / Personal data of the family member who is an EU, EEA, CH citizen or a United Kingdom citizen, if applicable:",
    L + 1.3,
    y + 3.4,
    5.2
  );
  const half = mainW / 2;
  label("Apellido(s)/Surname(family name):", L + 1.5, y + 10, 5.6);
  value(up(data.field17_euFamilyMemberSurname), L + 1.5, y + 16, half - 4, 8);
  setStroke(0.2);
  doc.line(L + half, y + 8, L + half, y + f17h);
  label("Nombre(s)/First name(s) (Given name(s)):", L + half + 1.5, y + 10, 5.6);
  value(up(data.field17_euFamilyMemberFirstName), L + half + 1.5, y + 16, half - 4, 8);

  // RIGHT official-use column
  const offTop = outerTop + headerH + 14;
  const offH = outerTop + outerH - offTop;
  rect(offX, offTop, offW, offH);
  fillRect(offX, offTop, offW, 10, [245, 245, 245]);
  doc.setFont(FONT, "bold");
  doc.setFontSize(5.6);
  doc.setTextColor(...BLACK);
  doc.text("PARTE RESERVADA A LA", offX + offW / 2, offTop + 4, { align: "center" });
  doc.text("ADMINISTRACION", offX + offW / 2, offTop + 6.8, { align: "center" });
  doc.setFontSize(5.3);
  doc.text("FOR OFFICIAL USE ONLY", offX + offW / 2, offTop + 9.2, { align: "center" });

  let oy = offTop + 12;
  const olabel = (t: string, extra = 0) => {
    doc.setFont(FONT, "bold");
    doc.setFontSize(5.4);
    doc.text(t, offX + 1.4, oy);
    oy += 4 + extra;
  };
  olabel("Fecha de la solicitud:");
  oy += 3;
  olabel("Numero de la solicitud:");
  oy += 3;
  olabel("Solicitud presentada en:");
  checkbox(offX + 1.5, oy, false, "Embajada/Consulado");
  oy += 4.2;
  checkbox(offX + 1.5, oy, false, "Proveedor de servicios");
  oy += 4.2;
  checkbox(offX + 1.5, oy, false, "Intermediario comercial");
  oy += 4.2;
  checkbox(offX + 1.5, oy, false, "Frontera (nombre)");
  oy += 6;
  checkbox(offX + 1.5, oy, false, "Otro");
  oy += 7;
  olabel("Expediente tramitado por:");
  oy += 6;
  olabel("Documentos justificativos:");
  checkbox(offX + 1.5, oy, false, "Documento de viaje");
  oy += 4;
  checkbox(offX + 1.5, oy, false, "Medios de subsistencia");
  oy += 4;
  checkbox(offX + 1.5, oy, false, "Invitacion");
  oy += 4;
  checkbox(offX + 1.5, oy, false, "Medio de transporte");
  oy += 4;
  checkbox(offX + 1.5, oy, false, "Seguro medico de viaje");
  oy += 4;
  checkbox(offX + 1.5, oy, false, "Otros:");
  oy += 8;
  olabel("Decision sobre el visado:");
  checkbox(offX + 1.5, oy, false, "Denegado");
  oy += 4.2;
  checkbox(offX + 1.5, oy, false, "Expedido:");
  oy += 4.2;
  checkbox(offX + 3.5, oy, false, "A");
  checkbox(offX + 14, oy, false, "C");
  checkbox(offX + 24, oy, false, "VTL");
  oy += 6;
  olabel("Valido:");
  olabel("desde .............. ..............");
  olabel("hasta .............. ..............");
  oy += 2;
  olabel("Numero de entradas:");
  checkbox(offX + 1.5, oy, entries === "SINGLE", "Una");
  checkbox(offX + 16, oy, entries === "TWO", "Dos");
  checkbox(offX + 30, oy, entries === "MULTIPLE", "multiples");
  oy += 6;
  olabel(`Numero de dias: ${data.field26_durationOfStayDays || ""}`);

  doc.setFont(FONT, "normal");
  doc.setFontSize(5);
  doc.text(
    "No se requiere logotipo para Noruega, Islandia, Liechtenstein y Suiza / No logo is required for Norway, Iceland, Liechtenstein and Switzerland.",
    L,
    H - 8
  );
  pageFooter(1);

  // =====================================================================
  // PAGE 2
  // =====================================================================
  doc.addPage();
  rect(L, 10, TW, 276);

  y = 10;
  // Continuation of 17
  const contH = 16;
  rect(L, y, 62, contH);
  label("Fecha de nacimiento (dia-mes-ano)/ Date of birth", L + 1.2, y + 3.2, 5.2);
  label("(day-month-year):", L + 1.2, y + 6.2, 5.2);
  value(fmtDate(data.field17_euFamilyMemberDob), L + 1.5, y + 12, 58, 8);

  rect(L + 62, y, 62, contH);
  label("Nacionalidad/Nationality:", L + 63.2, y + 3.2, 5.3);
  value(data.field17_euFamilyMemberNationality, L + 63.2, y + 12, 58, 8);

  rect(L + 124, y, TW - 124, contH);
  label("Numero de documento de viaje o del documento", L + 125.2, y + 3.2, 5.2);
  label("de identidad/ Number of travel documents or ID card:", L + 125.2, y + 6.2, 5.2);
  value(data.field17_euFamilyMemberDocNumber, L + 125.2, y + 12, 58, 8);
  y += contH;

  // 18 relationship
  rect(L, y, TW, 18);
  label(
    "18. Relacion de parentesco con un ciudadano de la UE, del EEE o de Suiza o un nacional del Reino Unido / Family relationship with an EU, EEA, CH citizen or a United Kingdom citizen, if applicable:",
    L + 1.2,
    y + 3.3,
    5.3
  );
  const rel = data.field17_euFamilyMemberRelationship;
  checkbox(L + 2, y + 9, rel === "SPOUSE", "Conyuge/Spouse");
  checkbox(L + 38, y + 9, rel === "CHILD", "Hijo-a/Child");
  checkbox(L + 68, y + 9, rel === "GRANDCHILD", "Nieto-a/Grandchild");
  checkbox(L + 108, y + 9, rel === "DEPENDENT_ASCENDANT", "Ascendiente dependiente/Dependent ascendant");
  checkbox(L + 2, y + 14.2, rel === "REGISTERED_PARTNERSHIP", "Pareja de hecho registrada/registered partnership");
  checkbox(L + 78, y + 14.2, rel === "OTHER", "Otras/Other:");
  y += 18;

  // 19 address + phone
  rect(L, y, 118, 20);
  label("19. Domicilio postal y direccion de correo electronico del solicitante/", L + 1.2, y + 3.2, 5.4);
  label("Applicant's home address and e-mail address:", L + 1.2, y + 6.2, 5.4);
  value(`${data.field18_homeAddress || ""}${data.field18_email ? " | " + data.field18_email : ""}`, L + 1.5, y + 12, 114, 7);

  rect(L + 118, y, TW - 118, 20);
  label("Numero(s) de telefono/Telephone number(s):", L + 119.2, y + 3.2, 5.4);
  value(data.field18_phone, L + 119.2, y + 12, 64, 8);
  y += 20;

  // 20 residence
  rect(L, y, TW, 16);
  label(
    "20. Residente en un pais distinto del pais de nacionalidad actual/ Residence in a country other than the country of current nationality:",
    L + 1.2,
    y + 3.2,
    5.4
  );
  checkbox(L + 2, y + 8, data.field19_residenceInOtherCountry !== "YES", "No/No");
  checkbox(L + 22, y + 8, data.field19_residenceInOtherCountry === "YES", "Si/Yes Permiso de residencia o documento equivalente/ Residence permit or equivalent");
  label(
    `valido hasta el/ valid until: ${fmtDate(data.field19_residencePermitValidUntil) || "...................."}    n./number ${data.field19_residencePermitNumber || "...................."}`,
    L + 2,
    y + 13.2,
    5.5,
    false
  );
  y += 16;

  // 21 occupation
  rect(L, y, TW, 12);
  label("*21. Profesion actual/ Current occupation:", L + 1.2, y + 3.4);
  value(data.field20_currentOccupation, L + 1.5, y + 9, TW - 4, 8);
  y += 12;

  // 22 employer
  rect(L, y, TW, 16);
  label(
    "*22. Nombre, direccion y numero de telefono del empleador. Para estudiantes, nombre y direccion del centro de ensenanza/ Employer and employer's address and telephone number. For students, name and address of educational establishment:",
    L + 1.2,
    y + 3.2,
    5.2
  );
  value(
    `${data.field21_employerNameAndAddress || ""}${data.field21_employerPhone ? "  Tel: " + data.field21_employerPhone : ""}`,
    L + 1.5,
    y + 11,
    TW - 4,
    7.5
  );
  y += 16;

  // 23 purpose
  rect(L, y, TW, 18);
  label("*23. Motivo(s) del viaje/ Main purpose(s) of the journey:", L + 1.2, y + 3.3);
  checkbox(L + 2, y + 7.6, purposes.includes("TOURISM"), "Turismo/Tourism");
  checkbox(L + 36, y + 7.6, purposes.includes("BUSINESS"), "Negocios/Business");
  checkbox(L + 74, y + 7.6, purposes.includes("VISITING_FAMILY"), "Visita a familiares o amigos/Visiting family or friends");
  checkbox(L + 2, y + 12.4, purposes.includes("CULTURAL"), "Cultural/Cultural");
  checkbox(L + 36, y + 12.4, purposes.includes("SPORTS"), "Deportes/Sports");
  checkbox(L + 68, y + 12.4, purposes.includes("OFFICIAL_VISIT"), "Visita oficial/Official visit");
  checkbox(L + 110, y + 12.4, purposes.includes("MEDICAL"), "Motivos medicos/Medical reasons");
  checkbox(L + 2, y + 16.4, purposes.includes("STUDY"), "Estudios/Study");
  checkbox(L + 36, y + 16.4, purposes.includes("AIRPORT_TRANSIT"), "Transito aeroportuario/Airport transit");
  checkbox(L + 90, y + 16.4, purposes.includes("OTHER"), "Otros/Other");
  y += 18;

  // 24 additional
  rect(L, y, TW, 12);
  label("24. Informacion adicional sobre el motivo de la estancia/Additional information on purpose of stay:", L + 1.2, y + 3.2, 5.5);
  value(data.field23_additionalInfoPurpose, L + 1.5, y + 8.5, TW - 4, 7.5);
  y += 12;

  // 25 & 26
  rect(L, y, TW / 2, 18);
  label("25. Estado miembro de destino principal (y otros Estados miembros de", L + 1.2, y + 3.2, 5.3);
  label("destino, si procede)/ Member State(s) of main destination:", L + 1.2, y + 6.2, 5.3);
  value(
    `${data.field24_memberStateOfMainDestination || ""}${data.field24_otherMemberStates ? " / " + data.field24_otherMemberStates : ""}`,
    L + 1.5,
    y + 13,
    TW / 2 - 4,
    8
  );

  rect(L + TW / 2, y, TW / 2, 18);
  label("26. Estado miembro de primera entrada/Member State of first entry:", L + TW / 2 + 1.2, y + 3.2, 5.3);
  value(data.field25_memberStateOfFirstEntry, L + TW / 2 + 1.5, y + 13, TW / 2 - 4, 8);
  y += 18;

  // 27 entries
  rect(L, y, TW, 12);
  label("27. Numero de entradas que solicita/ Number of entries requested:", L + 1.2, y + 3.3);
  checkbox(L + 2, y + 8.5, entries === "SINGLE", "Una/One entry");
  checkbox(L + 40, y + 8.5, entries === "TWO", "Dos/Two entries");
  checkbox(L + 80, y + 8.5, entries === "MULTIPLE", "Multiples/Multiple entries");
  y += 12;

  // 28 dates
  rect(L, y, TW, 16);
  label(
    "28. Fecha prevista de llegada de la primera estancia prevista en el espacio Schengen/ Intended date of arrival of the first intended stay in the Schengen area:",
    L + 1.2,
    y + 3.2,
    5.3
  );
  value(fmtDate(data.field26_intendedArrivalDate), L + 2, y + 8.2, 60, 8);
  label(
    "Fecha prevista de la salida del espacio Schengen despues de la primera estancia prevista/ Intended date of departure from the Schengen area after the first intended stay:",
    L + 1.2,
    y + 11.2,
    5.2
  );
  value(fmtDate(data.field26_intendedDepartureDate), L + 2, y + 15.2, 60, 8);
  y += 16;

  // 29 fingerprints
  rect(L, y, TW, 14);
  label(
    "29. Impresiones dactilares tomadas anteriormente para solicitudes de visado Schengen/ Fingerprints collected previously for the purpose of applying for a Schengen visa:",
    L + 1.2,
    y + 3.2,
    5.3
  );
  checkbox(L + 2, y + 8, data.field27_fingerprintsCollectedPreviously !== "YES", "NO/no");
  checkbox(L + 22, y + 8, data.field27_fingerprintsCollectedPreviously === "YES", "SI/yes");
  label(
    `Fecha, si se conoce/Date, if known: ${fmtDate(data.field27_fingerprintsDate) || "...................."}    Numero de visado, si se conoce/Visa sticker number, if known: ${data.field27_visaStickerNumber || "...................."}`,
    L + 2,
    y + 12.2,
    5.4,
    false
  );
  y += 14;

  // 30 entry permit
  rect(L, y, TW, 14);
  label(
    "30. Permiso de entrada al pais de destino final, si ha lugar/ Entry permit for the final country of destination, where applicable:",
    L + 1.2,
    y + 3.2,
    5.3
  );
  label(
    `Expedido por/Issued by: ${data.field28_entryPermitIssuedBy || data.field28_entryPermitFinalDestination || "...................."}    Valido desde/Valid from: ${fmtDate(data.field28_entryPermitValidFrom) || "...................."}    Hasta/Until: ${fmtDate(data.field28_entryPermitValidUntil) || "...................."}`,
    L + 2,
    y + 10,
    6,
    false
  );
  y += 14;

  // 31 hotel
  rect(L, y, TW, Math.max(18, 286 - y));
  label(
    "*31. Apellido(s) y nombre (s) de la persona o personas que han emitido la invitacion en el Estado o Estados miembros. Si no procede, nombre del hotel u hoteles, direccion del lugar y lugares de alojamiento temporal en el Estado o Estados miembros/ Surname and first name of the inviting person(s) in the Member State(s). If not applicable, name of hotel(s) or temporary accommodation(s) in the Member State(s):",
    L + 1.2,
    y + 3.4,
    5.2
  );
  value(data.field29_invitingPersonOrHotelName, L + 1.5, y + 14, TW - 4, 8);

  pageFooter(2);

  // =====================================================================
  // PAGE 3
  // =====================================================================
  doc.addPage();
  rect(L, 10, TW, 276);
  y = 10;

  // continuation of 31 address + phone
  rect(L, y, 118, 22);
  label("Domicilio postal y direccion de correo electronico de la persona o personas", L + 1.2, y + 3.2, 5.2);
  label("que han emitido la invitacion, del hotel u hoteles o del lugar o lugares de", L + 1.2, y + 5.8, 5.2);
  label("alojamiento temporal/ Address and e-mail address of inviting", L + 1.2, y + 8.4, 5.2);
  label("person(s)/hotel(s)/temporary accommodation(s):", L + 1.2, y + 11, 5.2);
  value(data.field29_hostAddressAndEmail, L + 1.5, y + 16.5, 114, 7);

  rect(L + 118, y, TW - 118, 22);
  label("Numero(s) de telefono/Telephone number(s):", L + 119.2, y + 3.2, 5.3);
  value(data.field29_hostPhone, L + 119.2, y + 12, 64, 8);
  y += 22;

  // 32 company
  rect(L, y, TW, 10);
  label("*32. Nombre y direccion de la empresa u organizacion que ha emitido la invitacion/ Name and address of inviting company/organisation:", L + 1.2, y + 3.3, 5.3);
  value(data.field30_invitingCompany, L + 1.5, y + 8, TW - 4, 7.5);
  y += 10;

  rect(L, y, 118, 16);
  label("Apellido(s), nombre (s), direccion, y correo electronico de la persona de", L + 1.2, y + 3.2, 5.2);
  label("contacto en la empresa u organizacion/ Surname, first name, address and e-", L + 1.2, y + 5.8, 5.2);
  label("mail address of contact person in company/organisation:", L + 1.2, y + 8.4, 5.2);
  value(data.field30_companyContactPerson, L + 1.5, y + 13.5, 114, 7);

  rect(L + 118, y, TW - 118, 16);
  label("Numero(s) de telefono la empresa u organizacion/ Telephone number of", L + 119.2, y + 3.2, 5.1);
  label("company/organisation:", L + 119.2, y + 5.8, 5.1);
  value(data.field30_companyAddressAndPhone, L + 119.2, y + 12, 64, 7);
  y += 16;

  // 33 costs
  rect(L, y, TW, 8);
  label("*33. Los gastos de viaje y subsistencia del solicitante durante su estancia estan cubiertos/ Cost of travelling and living during the applicant's stay is covered:", L + 1.2, y + 3.4, 5.3);
  y += 8;

  const col = TW / 2;
  rect(L, y, col, 42);
  checkbox(L + 2, y + 5, covered === "APPLICANT" || covered === "BOTH", "por el propio solicitante/ by the applicant himself/herself.");
  label("Medios de subsistencia/Means of subsistence:", L + 2, y + 10, 5.5);
  checkbox(L + 3, y + 15, appMeans.includes("CASH"), "Efectivo/Cash");
  checkbox(L + 3, y + 19.5, appMeans.includes("TRAVELLER_CHEQUES"), "Cheques de viaje/Traveller's cheques");
  checkbox(L + 3, y + 24, appMeans.includes("CREDIT_CARD"), "Tarjeta de credito/Credit card");
  checkbox(L + 3, y + 28.5, appMeans.includes("PREPAID_ACCOMMODATION"), "Alojamiento ya pagado/Pre-paid accomodation");
  checkbox(L + 3, y + 33, appMeans.includes("PREPAID_TRANSPORT"), "Transporte ya pagado/Pre-paid transport");
  checkbox(L + 3, y + 37.5, appMeans.includes("OTHER"), "Otros (especifiquese)/Other (please specify)");

  rect(L + col, y, col, 42);
  checkbox(L + col + 2, y + 5, covered === "SPONSOR" || covered === "BOTH", "por un patrocinador (anfitrion, empresa u organizacion), especifiquese:");
  checkbox(L + col + 4, y + 10, spMeans.includes("HOST_REFERRED"), "indicado en las casillas 30 o 31");
  checkbox(L + col + 4, y + 14.5, Boolean(data.field31_sponsorMeansOther), "otro (especifiquese)");
  label("Medios de subsistencia/Means of subsistence:", L + col + 2, y + 19.5, 5.4);
  checkbox(L + col + 3, y + 24, spMeans.includes("CASH") || false, "Efectivo/Cash");
  checkbox(L + col + 3, y + 28.5, spMeans.includes("ACCOMMODATION"), "Se facilita alojamiento al solicitante/Accomodation provided");
  checkbox(L + col + 3, y + 33, spMeans.includes("ALL_EXPENSES"), "Todos los gastos de estancia estan cubiertos/All expenses covered during the stay");
  checkbox(L + col + 3, y + 38, spMeans.includes("PREPAID_TRANSPORT"), "Transporte ya pagado/ Pre-paid transport");
  y += 42;

  // 34 filler
  rect(L, y, TW, 10);
  label("34. Nombre y apellidos de la persona que completa el formulario, si es diferente al solicitante / Surname and first name of the person filling in the application form, if different from the applicant:", L + 1.2, y + 3.2, 5.2);
  value(data.field34_fillerName, L + 1.5, y + 8, TW - 4, 7.5);
  y += 10;

  rect(L, y, col, 12);
  label("Direccion y correo electronico de la persona que completa el formulario /", L + 1.2, y + 3.2, 5.1);
  label("Address and e-mail of the person filling in the form:", L + 1.2, y + 5.8, 5.1);
  value(data.field34_fillerAddressEmail, L + 1.5, y + 10, col - 3, 7);

  rect(L + col, y, col, 12);
  label("Numero de telefono / Phone number:", L + col + 1.2, y + 3.2, 5.2);
  value(data.field34_fillerPhone, L + col + 1.5, y + 9, col - 3, 8);
  y += 14;

  // Legal texts page 3
  const legal = (es: string, en: string) => {
    doc.setFont(FONT, "bold");
    doc.setFontSize(6.3);
    doc.setTextColor(...BLACK);
    const esLines = doc.splitTextToSize(es, TW - 4);
    doc.text(esLines, L + 2, y);
    y += esLines.length * 2.7 + 1.2;
    doc.setFont(FONT, "normal");
    doc.setFontSize(6);
    const enLines = doc.splitTextToSize(en, TW - 4);
    doc.text(enLines, L + 2, y);
    y += enLines.length * 2.6 + 2.5;
  };

  legal(
    "Tengo conocimiento de que la denegacion del visado no da lugar al reembolso de la tasa de visado.",
    "I am aware that the visa fee is not refunded if the visa is refused."
  );
  legal(
    "Aplicable si se solicita un visado para entradas multiples: Tengo conocimiento de que necesito un seguro medico de viaje adecuado para mi primera estancia y para cualquier visita posterior al territorio de los Estados miembros.",
    "Applicable in case a multiple-entry visa is applied for: I am aware of the need to have an adequate travel medical insurance for my first stay and any subsequent visits to the territory of Member States."
  );
  legal(
    "Tengo conocimiento de lo siguiente y consiento en ello: la recogida de los datos que se exigen en el presente impreso, la toma de mi fotografia y, si procede, de mis impresiones dactilares, son obligatorias para el examen de la solicitud de visado; y los datos personales que me conciernen y que figuran en el impreso de solicitud de visado, asi como mis impresiones dactilares y mi fotografia, se suministraran a las autoridades competentes de los Estados miembros y seran tratados por dichas autoridades a efectos de la decision sobre mi solicitud de visado.",
    "I am aware of and consent to the following: the collection of the data required by this application form and the taking of my photograph and, if applicable, the taking of fingerprints, are mandatory for the examination of the visa application; and any personal data concerning me which appear on the visa application form, as well as my fingerprints and my photograph will be supplied to the relevant authorities of the Member States and processed by those authorities, for the purposes of a decision on my visa application."
  );

  pageFooter(3);

  // =====================================================================
  // PAGE 4
  // =====================================================================
  doc.addPage();
  rect(L, 10, TW, 276);
  y = 14;

  const para = (text: string, italic = false) => {
    doc.setFont(FONT, "normal");
    doc.setFontSize(6.4);
    doc.setTextColor(...BLACK);
    const lines = doc.splitTextToSize(text, TW - 6);
    doc.text(lines, L + 3, y);
    y += lines.length * 2.75 + 3.2;
  };

  para(
    "Such data as well as data concerning the decision taken on my application or a decision whether to annul, revoke or extend a visa issued will be entered into, and stored in the Visa Information System (VIS) for a maximum period of five years, during which it will be accessible to the visa authorities and the authorities competent for carrying out checks on visas at external borders and within the Member States, immigration and asylum authorities in the Member States for the purposes of verifying whether the conditions for the legal entry into, stay and residence on the territory of the Member States are fulfilled, of identifying persons who do not or who no longer fulfil these conditions, of examining an asylum application and of determining responsibility for such examination. Under certain conditions the data will be also available to designated authorities of the Member States and to Europol for the purpose of the prevention, detection and investigation of terrorist offences and of other serious criminal offences. The authority responsible for data processing in the case of Spain is the Ministry of Foreign Affairs, European Union and Cooperation (dpd@maec.es)."
  );

  para(
    "Conozco mi derecho a exigir, en cualquiera de los Estados miembros, que se me notifiquen los datos que me conciernen que estan registrados en el VIS y el Estado miembro que los ha transmitido, y a solicitar que se corrijan aquellos de mis datos personales que sean inexactos y que se supriman los datos relativos a mi persona que hayan sido tratados ilegalmente. Si lo solicito expresamente, la autoridad que examine mi solicitud me informara de la forma en que puedo ejercer mi derecho a comprobar los datos personales que me conciernen y hacer que se modifiquen o supriman, y de las vias de recurso contempladas en el Derecho interno del Estado de que se trate. La autoridad nacional de supervision [en el caso de Espana, la Agencia Espanola de Proteccion de Datos, con sede en Madrid, calle Jorge Juan, numero 6, C.P.28001 (www.aepd.es)] atendera las reclamaciones en materia de proteccion de datos personales."
  );

  para(
    "I am aware that I have the right to obtain in any of the Member States notification of the data relating to me recorded in the VIS and of the Member State which transmitted the data, and to request that data relating to me which are inaccurate be corrected and that data relating to me processed unlawfully be deleted. At my express request, the authority examining my application will inform me of the manner in which I may exercise my right to check the personal data concerning me and have them corrected or deleted, including the related remedies according to the national law of the State concerned. The national supervisory authority of that Member State [in the Spanish case, the Agencia Espanola de Proteccion de Datos; calle Jorge Juan, numero 6, C.P.28001 (www.aepd.es)], will hear claims concerning the protection of personal data.",
    true
  );

  para(
    "Declaro que a mi leal entender todos los datos por mi presentados son correctos y completos. Tengo conocimiento de que toda declaracion falsa podra ser motivo de denegacion de mi solicitud o de anulacion del visado concedido y dar lugar a actuaciones judiciales contra mi persona con arreglo a la legislacion del Estado Miembro que tramite mi solicitud."
  );

  para(
    "I declare that to the best of my knowledge all particulars supplied by me are correct and complete. I am aware that any false statements will lead to my application being rejected or to the annulment of a visa already granted and may also render me liable to prosecution under the law of the Member State which deals with the application.",
    true
  );

  para(
    "Me comprometo a abandonar el territorio de los Estados miembros antes de que expire el visado que se me conceda. He sido informado de que la posesion de un visado es unicamente uno de los requisitos de entrada al territorio europeo de los Estados miembros. El mero hecho de que se me haya concedido un visado no significa que tenga derecho a indemnizacion si incumplo las disposiciones pertinentes del articulo 6, apartado 1, del Reglamento (CE) N 399/2016 (Codigo de fronteras Schengen) y se me deniega por ello la entrada. El cumplimiento de los requisitos de entrada volvera a comprobarse a la entrada en el territorio de los Estados miembros."
  );

  para(
    "I undertake to leave the territory of the Member States before the expiry of the visa, if granted. I have been informed that possession of a visa is only one of the prerequisites for entry into the European territory of the Member States. The mere fact that a visa has been granted to me does not mean that I will be entitled to compensation if I fail to comply with the relevant provisions of Article 6(1) of Regulation (EC) No 399/2016 (Schengen Borders Code) and I am therefore refused entry. The prerequisites for entry will be checked again on entry into the European territory of the Member States.",
    true
  );

  // Place, date, signature
  const boxY = Math.max(y + 4, 232);
  rect(L, boxY, TW / 2, 28);
  label("Lugar y fecha/Place and date:", L + 2, boxY + 5, 7);
  value(data.field32_placeAndDate, L + 2, boxY + 14, TW / 2 - 6, 10);

  rect(L + TW / 2, boxY, TW / 2, 28);
  label("Firma (firma de la persona que ejerce la patria potestad o del", L + TW / 2 + 2, boxY + 4.5, 5.4);
  label("tutor legal, su procede)/ Signature (for minors, signature of", L + TW / 2 + 2, boxY + 7.4, 5.4);
  label("parental authority/legal guardian):", L + TW / 2 + 2, boxY + 10.3, 5.4);
  const sig = data.field33_signatureName || `${data.field3_firstNames} ${data.field1_surname}`;
  value(up(sig), L + TW / 2 + 2, boxY + 20, TW / 2 - 6, 9);

  pageFooter(4);

  return doc;
}
