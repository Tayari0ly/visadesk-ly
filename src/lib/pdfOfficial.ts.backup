import { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField, StandardFonts } from "pdf-lib";
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

  // The BLS template contains the hotel-phone field twice as two overlapping
  // widgets (one inherits a very large font). Keep one widget to avoid the
  // same number being rendered twice at different sizes.
  try {
    const hotelPhone = form.getField("Números de teléfonoTelephone numbers-0");
    while (hotelPhone.acroField.getWidgets().length > 1) {
      hotelPhone.acroField.removeWidget(hotelPhone.acroField.getWidgets().length - 1);
    }
  } catch {
    /* Template versions without the duplicate widget need no repair. */
  }

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
  setText(form, "Números de teléfonoTelephone numbers-0", data.field29_hostPhone);
  setText(
    form,
    "32 Nombre y dirección de la empresa u organización",
    data.field30_invitingCompany
  ); // 32
  setText(form, "Texto27", data.field30_companyContactPerson);
  setText(form, "Texto28", data.field30_companyAddressAndPhone);

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
