import { PDFCheckBox, PDFDocument, PDFPage, PDFRadioGroup, PDFRef, PDFTextField, StandardFonts } from "pdf-lib";
import { SchengenFormData } from "@/types/schengen";

const FORM_URL = "/forms/schengen_visa_application_form.pdf";

function fmt(iso: string): string {
  if (!iso || iso.length < 10) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

const up = (s: string) => (s || "").toUpperCase();

function setText(
  form: ReturnType<PDFDocument["getForm"]>,
  name: string,
  value: string
) {
  if (!value) return;
  try {
    const field = form.getField(name);
    if (field instanceof PDFTextField) field.setText(value);
  } catch {
    /* field name drifted — skip rather than break the export */
  }
}

function setCheck(
  form: ReturnType<PDFDocument["getForm"]>,
  name: string,
  on: boolean
) {
  try {
    const field = form.getField(name);
    if (field instanceof PDFCheckBox) {
      if (on) field.check();
      else field.uncheck();
    }
  } catch {
    /* ignore */
  }
}

function setRadio(
  form: ReturnType<PDFDocument["getForm"]>,
  name: string,
  optionIndex: number
) {
  try {
    const field = form.getField(name);
    if (field instanceof PDFRadioGroup) {
      const opts = field.getOptions();
      if (opts[optionIndex]) field.select(opts[optionIndex]);
    }
  } catch {
    /* ignore */
  }
}

function removeAllWidgets(doc: PDFDocument, form: ReturnType<PDFDocument["getForm"]>, name: string) {
  try {
    const field = form.getField(name);
    if (!(field instanceof PDFTextField)) return;
    for (const widget of field.acroField.getWidgets()) {
      for (const page of doc.getPages()) {
        const annots = page.node.Annots();
        if (!annots) continue;
        for (let i = annots.size() - 1; i >= 0; i -= 1) {
          const ref = annots.get(i) as PDFRef;
          if (doc.context.lookup(ref) === widget.dict) page.node.removeAnnot(ref);
        }
      }
    }
    for (let i = field.acroField.getWidgets().length - 1; i >= 0; i -= 1) field.acroField.removeWidget(i);
  } catch {
    /* Ignore template field drift. */
  }
}

function drawOneLine(page: PDFPage, value: string, x: number, y: number, max = 80) {
  const text = String(value || "").trim().slice(0, max);
  if (text) page.drawText(text, { x, y, size: 8 });
}

function drawLines(page: PDFPage, value: string, x: number, y: number, chars = 34, maxLines = 4) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > chars) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((item, index) => page.drawText(item, { x, y: y - index * 11, size: 8 }));
}

async function drawFallbackSummary(doc: PDFDocument, data: SchengenFormData) {
  const page = doc.addPage([595.56, 842.04]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const rows: Array<[string, string]> = [
    ["Surname", up(data.field1_surname)],
    ["Given names", up(data.field3_firstNames)],
    ["Date of birth", fmt(data.field4_dateOfBirth)],
    ["Nationality", data.field7_currentNationality],
    ["Passport number", up(data.field13_travelDocNumber)],
    ["Issued by", data.field16_issuedBy],
    ["Valid until", fmt(data.field15_validUntil)],
    ["Main destination", data.field24_memberStateOfMainDestination],
    ["Arrival", fmt(data.field26_intendedArrivalDate)],
    ["Departure", fmt(data.field26_intendedDepartureDate)],
    ["Accommodation", data.field29_invitingPersonOrHotelName],
    ["Address", data.field29_hostAddressAndEmail],
  ];
  page.drawText("VisaDesk LY - Schengen application data", { x: 42, y: 790, size: 16, font });
  page.drawText("Additional application data summary", { x: 42, y: 768, size: 9, font });
  rows.filter(([, value]) => value).forEach(([label, value], index) => {
    const y = 725 - index * 32;
    page.drawText(`${label}:`, { x: 48, y, size: 10, font });
    page.drawText(String(value).slice(0, 90), { x: 190, y, size: 10, font });
  });
}

/** Fills the official harmonised Schengen form (4 pages) with the applicant data. */
export async function buildOfficialFormPdf(
  data: SchengenFormData
): Promise<Uint8Array> {
  const res = await fetch(FORM_URL);
  if (!res.ok) throw new Error("Official form template missing");
  const bytes = await res.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = doc.getForm();

  // The BLS template has a few duplicated, slightly-offset widgets. If both
  // are filled, text is printed twice; one of them also inherits an oversized
  // font. Keep the first widget, preserve the printed form lines, and set an
  // explicit readable size.
  const repairTextField = (name: string, fontSize: number) => {
    try {
      const field = form.getField(name);
      if (field instanceof PDFTextField) {
        while (field.acroField.getWidgets().length > 1) {
          const widgetIndex = field.acroField.getWidgets().length - 1;
          const duplicateWidget = field.acroField.getWidgets()[widgetIndex];
          // removeWidget updates the AcroForm tree, but some PDF viewers still
          // render an orphaned page annotation unless it is removed from /Annots too.
          for (const page of doc.getPages()) {
            const annots = page.node.Annots();
            if (!annots) continue;
            for (let i = annots.size() - 1; i >= 0; i -= 1) {
              const ref = annots.get(i) as PDFRef;
              const dict = doc.context.lookup(ref);
              if (dict === duplicateWidget.dict) page.node.removeAnnot(ref);
            }
          }
          field.acroField.removeWidget(widgetIndex);
        }
        field.setFontSize(fontSize);
      }
    } catch {
      /* Template versions without this field need no repair. */
    }
  };

  // These four fields are removed completely below and drawn once after the
  // regular AcroForm fields are populated. The BLS file contains two page
  // annotations for each of them, which is why font-size-only repair is not
  // sufficient in some PDF viewers.
  removeAllWidgets(doc, form, "Números de teléfonoTelephone numbers-0");
  removeAllWidgets(doc, form, "32 Nombre y dirección de la empresa u organización");
  removeAllWidgets(doc, form, "Texto27");
  removeAllWidgets(doc, form, "Texto28");

  // ---- Page 1: 1..17 ----------------------------------------------------
  setText(form, "1 ApellidosSumames", up(data.field1_surname));
  setText(
    form,
    "2 Apellidos de nacimiento apellidos anterioresSuma",
    up(data.field2_surnameAtBirth)
  );
  setText(form, "3 NombresFirst names Given names", up(data.field3_firstNames));

  setText(form, "Texto1", fmt(data.field4_dateOfBirth)); // 4  date of birth
  setText(form, "Texto2", data.field5_placeOfBirth); // 5  place of birth
  setText(form, "Texto3", data.field6_countryOfBirth); // 6  country of birth
  setText(form, "Texto4", data.field7_currentNationality); // 7  current nationality
  setText(form, "Texto5", data.field7_nationalityAtBirth); //    nationality at birth
  setText(form, "Texto6", data.field7_otherNationalities); //    other nationalities

  setCheck(form, "VarónMale", data.field8_sex === "MALE");
  setCheck(form, "MujerFemale", data.field8_sex === "FEMALE");
  setCheck(form, "OtroOther", data.field8_sex === "OTHER");

  const cs = data.field9_civilStatus;
  setCheck(form, "ChkBox", cs === "SINGLE");
  setCheck(form, "ChkBox-0", cs === "MARRIED");
  setCheck(form, "Unión registrada", cs === "REGISTERED_UNION");
  setCheck(form, "SeparadoaSeparated", cs === "SEPARATED");
  setCheck(form, "ChkBox-1", cs === "DIVORCED");
  setCheck(form, "ChkBox-2", cs === "WIDOWED");
  setCheck(form, "OtrosOther", cs === "OTHER");
  setText(form, "Texto7", data.field9_civilStatusOther); // 9 other

  setText(form, "Texto8", data.field10_parentalAuthority); // 10 minors guardian
  setText(
    form,
    "11 Número de documento nacional de identidad si pr",
    data.field11_nationalIdNumber
  );

  const dt = data.field12_travelDocType;
  setCheck(form, "Pasaporte ordinarioOrdinary Passport", dt === "ORDINARY");
  setCheck(form, "Pasaporte diplomáticoDiplomatic passport", dt === "DIPLOMATIC");
  setCheck(form, "Pasaporte de servicioService", dt === "SERVICE");
  setCheck(form, "Pasaporte oficialOfficial passport", dt === "OFFICIAL");
  setCheck(form, "Pasaporte especialSpecial Passport", dt === "SPECIAL");
  setCheck(form, "Otro documento de viajeOther", dt === "OTHER");
  setText(form, "Texto9", data.field12_travelDocTypeOther); // 12 other

  setText(form, "Texto10", up(data.field13_travelDocNumber)); // 13
  setText(form, "Texto11", fmt(data.field14_issueDate)); // 14
  setText(form, "Texto12", fmt(data.field15_validUntil)); // 15
  setText(form, "Texto13", data.field16_issuedBy); // 16

  // 17 — family member of EU/EEA/CH citizen
  setText(
    form,
    "Texto14",
    [data.field17_euFamilyMemberDob && `DOB ${fmt(data.field17_euFamilyMemberDob)}`, data.field17_euFamilyMemberNationality, data.field17_euFamilyMemberDocNumber]
      .filter(Boolean)
      .join("  |  ")
  );
  setText(
    form,
    "ApellidosSumamefamily name",
    up(data.field17_euFamilyMemberSurname)
  );
  setText(
    form,
    "NombresFirst names Given names",
    up(data.field17_euFamilyMemberFirstName)
  );

  // ---- Page 2 -----------------------------------------------------------
  setText(form, "Texto15", fmt(data.field17_euFamilyMemberDob));
  setText(form, "NacionalidadNationality", data.field17_euFamilyMemberNationality);
  setText(form, "Texto16", data.field17_euFamilyMemberDocNumber);

  const rel = data.field17_euFamilyMemberRelationship;
  setCheck(form, "CónyugeSpouse", rel === "SPOUSE");
  setCheck(form, "HijoaChild", rel === "CHILD");
  setCheck(form, "ChkBox-3", rel === "GRANDCHILD");
  setCheck(form, "Ascendiente dependiente Dpendent ascendant", rel === "DEPENDENT_ASCENDANT");
  setCheck(form, "Pareja de hecho registradaregistered", rel === "REGISTERED_PARTNERSHIP");
  setCheck(form, "OtrasOther", rel === "OTHER");

  setText(
    form,
    "Texto18",
    [data.field18_homeAddress, data.field18_email].filter(Boolean).join("\n")
  ); // 19 address + e-mail
  setText(form, "Números de teléfonoTelephone numbers", data.field18_phone); // 19 phone

  setRadio(
    form,
    "20 Residente en un país distinto del país de nacio",
    data.field19_residenceInOtherCountry === "YES" ? 1 : 0
  );
  setText(
    form,
    "SiYes Permiso de residencia o documento equivalent",
    data.field19_residencePermitNumber
  );
  setText(form, "nnumber", data.field19_residencePermitNumber);
  setText(
    form,
    "válido hasta el valid until",
    fmt(data.field19_residencePermitValidUntil)
  );

  setText(form, "21 Profesión actual Current occupation", data.field20_currentOccupation); // 21
  setText(
    form,
    "Texto19",
    [data.field21_employerNameAndAddress, data.field21_employerPhone && `Tel: ${data.field21_employerPhone}`]
      .filter(Boolean)
      .join("  |  ")
  ); // 22

  const p = data.field22_purposeOfJourney || [];
  setCheck(form, "TurismoTourism", p.includes("TOURISM"));
  setCheck(form, "NegociosBusiness", p.includes("BUSINESS"));
  setCheck(form, "Visita a familiares o amigosVisiting family or fri", p.includes("VISITING_FAMILY"));
  setCheck(form, "CulturalCultural", p.includes("CULTURAL"));
  setCheck(form, "DeportesSports", p.includes("SPORTS"));
  setCheck(form, "Visita oficial", p.includes("OFFICIAL_VISIT"));
  setCheck(form, "Motivos médicosMedical reasons", p.includes("MEDICAL"));
  setCheck(form, "EstudiosStudy", p.includes("STUDY"));
  setCheck(form, "Tránsito aeroportuarioAirport transit", p.includes("AIRPORT_TRANSIT"));
  setCheck(form, "OtrosOther especifrqueseplease specify", p.includes("OTHER"));
  setText(form, "Texto20", data.field22_purposeOther); // 23 other

  setText(
    form,
    "24 Información adicional sobre el motivo de la est",
    data.field23_additionalInfoPurpose
  ); // 24

  setText(
    form,
    "Texto21",
    [data.field24_memberStateOfMainDestination, data.field24_otherMemberStates]
      .filter(Boolean)
      .join(" / ")
  ); // 25
  setText(
    form,
    "26 Estado miembro de primera entradaMember State o",
    data.field25_memberStateOfFirstEntry
  ); // 26

  const en = data.field26_numberOfEntries;
  setCheck(form, "UnaOne entry", en === "SINGLE");
  setCheck(form, "DosTwo entries", en === "TWO");
  setCheck(form, "MúltiplesMultiple entries", en === "MULTIPLE");

  setText(form, "Texto22", fmt(data.field26_intendedArrivalDate)); // 28 in
  setText(form, "Texto23", fmt(data.field26_intendedDepartureDate)); // 28 out

  const fp = data.field27_fingerprintsCollectedPreviously;
  setCheck(form, "NOno", fp !== "YES");
  setCheck(form, "SÍyes", fp === "YES");
  setText(form, "Fecha si se conoceDate if known", fmt(data.field27_fingerprintsDate));
  setText(form, "Texto24", data.field27_visaStickerNumber);

  setText(form, "Expedido porTssued by", data.field28_entryPermitIssuedBy); // 30
  setText(form, "Válido desdeValid from", fmt(data.field28_entryPermitValidFrom));
  setText(form, "I3astaUntil", fmt(data.field28_entryPermitValidUntil));

  setText(form, "Texto25", data.field29_invitingPersonOrHotelName); // 31

  // ---- Page 3 -----------------------------------------------------------
  setText(form, "Texto26", data.field29_hostAddressAndEmail);
  const page3 = doc.getPages()[2];
  // Hotel phone: BLS places it in the right-hand box beside the hotel address.
  drawLines(page3, data.field29_hostPhone, 301, 777, 34, 4);
  // Invitation/company data: one controlled rendering per printed box.
  drawOneLine(page3, data.field30_invitingCompany, 52, 697, 80);
  drawLines(page3, data.field30_companyContactPerson, 52, 655, 34, 3);
  drawLines(page3, data.field30_companyAddressAndPhone, 301, 664, 34, 4);

  // 33 — cost of travelling and living
  const cov = data.field31_coveredBy;
  setCheck(
    form,
    "por el propio solicitante by the applicant himself",
    cov === "APPLICANT" || cov === "BOTH"
  );
  setCheck(
    form,
    "por un patrocinador anfitrión empresa u organizaci",
    cov === "SPONSOR" || cov === "BOTH"
  );

  const am = data.field31_applicantMeans || [];
  setCheck(form, "EfectivoCash", am.includes("CASH"));
  setCheck(form, "Cheques de viajeTravellers cheques", am.includes("TRAVELLER_CHEQUES"));
  setCheck(form, "Tarjeta de créditoCredit card", am.includes("CREDIT_CARD"));
  setCheck(form, "Alojamiento ya pagadoPrepaid accomodation", am.includes("PREPAID_ACCOMMODATION"));
  setCheck(form, "Transporte ya pagadoPrepaid transport", am.includes("PREPAID_TRANSPORT"));
  setCheck(form, "Otros especifiqueseOther please specify", am.includes("OTHER"));

  const sp = data.field31_sponsorMeans || [];
  setCheck(form, "indicado en las casillas 30 031", sp.includes("HOST_REFERRED"));
  setCheck(form, "otro especifiquese-0", sp.includes("OTHER"));
  setCheck(form, "EfectivoCash-0", sp.includes("CASH"));
  setCheck(form, "Se facilita alojamiento al solicitanteAccomodation", sp.includes("ACCOMMODATION"));
  setCheck(form, "Todos los gastos de estancia están cubiertosAll ex", sp.includes("ALL_EXPENSES"));
  setCheck(form, "Transporte ya pagado Prepaid transport", sp.includes("PREPAID_TRANSPORT"));
  setCheck(form, "Otros especifiqueseyOther please specify", sp.includes("OTHER2"));

  setText(form, "otro especifiquese", data.field31_sponsorMeansOther);
  setText(form, "Texto29", data.field31_applicantMeansOther); // 33 applicant other
  setText(form, "Texto30", data.field31_sponsorMeansOther); // 33 sponsor other

  // 34 — person filling the form
  setText(form, "Texto31", data.field34_fillerName);
  setText(form, "Texto32", data.field34_fillerAddressEmail);
  setText(form, "Número de teléfono  Phone number", data.field34_fillerPhone);

  // ---- Page 4 -----------------------------------------------------------
  setText(form, "Lugar y fechaPlace and date", data.field32_placeAndDate);
  // "Firma33" is a hand signature field — intentionally left blank.

  if (form.getFields().length === 0) {
    await drawFallbackSummary(doc, data);
  }

  try {
    form.updateFieldAppearances();
  } catch {
    /* some fields use custom appearances */
  }

  return doc.save();
}

export async function downloadOfficialForm(
  data: SchengenFormData
): Promise<string> {
  const bytes = await buildOfficialFormPdf(data);
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const name = `Schengen_Visa_Application_${up(data.field1_surname) || "Applicant"}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return name;
}

export async function officialFormObjectUrl(
  data: SchengenFormData
): Promise<string> {
  const bytes = await buildOfficialFormPdf(data);
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
