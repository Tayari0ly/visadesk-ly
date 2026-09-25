"use client";

import type { ReactNode } from "react";
import { SchengenFormData } from "@/types/schengen";

function Box({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`border border-black ${className}`}>{children}</div>;
}

function L({ children }: { children: ReactNode }) {
  return <div className="text-[8px] font-bold leading-tight px-1 pt-0.5">{children}</div>;
}

function V({ children }: { children: ReactNode }) {
  return <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wide min-h-[16px]">{children || "\u00a0"}</div>;
}

function Cb({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 mr-2 text-[8px]">
      <span className="inline-block w-2.5 h-2.5 border border-black text-[8px] leading-[10px] text-center">
        {on ? "■" : ""}
      </span>
      {label}
    </span>
  );
}

function fmt(iso: string) {
  if (!iso || iso.length < 10) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export function OfficialPaperForm({ data }: { data: SchengenFormData }) {
  const p = data.field22_purposeOfJourney || [];
  const means = data.field31_applicantMeans || [];
  const sp = data.field31_sponsorMeans || [];

  return (
    <div className="space-y-6 text-black bg-slate-200 p-3 sm:p-6" dir="ltr">
      {/* PAGE 1 */}
      <div className="bg-white mx-auto max-w-[210mm] shadow-xl border border-slate-400 p-[8mm] text-[9px]">
        <Box className="flex">
          <div className="w-[28mm] h-[22mm] bg-[#003399] flex items-center justify-center text-yellow-400 text-[8px] font-bold">EU</div>
          <div className="flex-1 text-center py-2">
            <div className="text-[13px] font-bold">Solicitud de visado Schengen</div>
            <div className="text-[13px] font-bold">Application for Schengen Visa</div>
            <div className="text-[9px] mt-1">Impreso gratuito / This application form is free</div>
          </div>
          <div className="w-[32mm] h-[40mm] border-l border-black flex items-center justify-center text-center font-bold">
            FOTO
            <br />
            PHOTO
          </div>
        </Box>
        <Box className="p-1 text-[7px] leading-snug">
          Family members of EU, EEA, CH citizens shall not fill fields 21, 22, 31, 32 and 33 (*). Fields 1-3 shall be filled in accordance with the travel document.
        </Box>
        <div className="flex">
          <div className="flex-1">
            <Box><L>1. Apellido(s) / Surname(s):</L><V>{data.field1_surname}</V></Box>
            <Box><L>2. Apellido(s) de nacimiento / Surname at birth:</L><V>{data.field2_surnameAtBirth}</V></Box>
            <Box><L>3. Nombre(s) / First name(s):</L><V>{data.field3_firstNames}</V></Box>
            <div className="grid grid-cols-3">
              <Box><L>4. Date of birth:</L><V>{fmt(data.field4_dateOfBirth)}</V></Box>
              <Box><L>5. Place of birth:</L><V>{data.field5_placeOfBirth}</V></Box>
              <Box><L>6. Country of birth:</L><V>{data.field6_countryOfBirth}</V></Box>
            </div>
            <Box>
              <L>7. Current nationality:</L><V>{data.field7_currentNationality}</V>
              <L>Nationality at birth:</L><V>{data.field7_nationalityAtBirth}</V>
              <L>Other nationalities:</L><V>{data.field7_otherNationalities}</V>
            </Box>
            <div className="grid grid-cols-2">
              <Box className="p-1">
                <L>8. Sexo / Sex:</L>
                <div className="px-1 py-1">
                  <Cb on={data.field8_sex === "MALE"} label="Varón/Male" />
                  <Cb on={data.field8_sex === "FEMALE"} label="Mujer/Female" />
                  <Cb on={data.field8_sex === "OTHER"} label="Otro/Other" />
                </div>
              </Box>
              <Box className="p-1">
                <L>9. Estado civil / Marital status:</L>
                <div className="px-1 py-1">
                  <Cb on={data.field9_civilStatus === "SINGLE"} label="Single" />
                  <Cb on={data.field9_civilStatus === "MARRIED"} label="Married" />
                  <Cb on={data.field9_civilStatus === "DIVORCED"} label="Divorced" />
                  <Cb on={data.field9_civilStatus === "WIDOWED"} label="Widow(er)" />
                </div>
              </Box>
            </div>
            <Box><L>10. Parental authority (minors):</L><V>{data.field10_parentalAuthority}</V></Box>
            <Box><L>11. National identity number:</L><V>{data.field11_nationalIdNumber}</V></Box>
            <Box className="p-1">
              <L>12. Type of travel document:</L>
              <div className="px-1 py-1">
                <Cb on={data.field12_travelDocType === "ORDINARY"} label="Ordinary passport" />
                <Cb on={data.field12_travelDocType === "DIPLOMATIC"} label="Diplomatic" />
                <Cb on={data.field12_travelDocType === "SERVICE"} label="Service" />
                <Cb on={data.field12_travelDocType === "OFFICIAL"} label="Official" />
              </div>
            </Box>
            <div className="grid grid-cols-4">
              <Box><L>13. Document no:</L><V>{data.field13_travelDocNumber}</V></Box>
              <Box><L>14. Date of issue:</L><V>{fmt(data.field14_issueDate)}</V></Box>
              <Box><L>15. Valid until:</L><V>{fmt(data.field15_validUntil)}</V></Box>
              <Box><L>16. Issued by:</L><V>{data.field16_issuedBy}</V></Box>
            </div>
            <Box>
              <L>17. EU/EEA/CH family member (if applicable) — Surname / First name:</L>
              <V>{data.field17_euFamilyMemberSurname} {data.field17_euFamilyMemberFirstName}</V>
            </Box>
          </div>
          <div className="w-[38mm] border border-black bg-slate-50 p-1 text-[7px] leading-tight">
            <div className="font-bold text-center mb-1">FOR OFFICIAL USE ONLY<br />PARTE RESERVADA A LA ADMINISTRACIÓN</div>
            Fecha de la solicitud:<br /><br />
            Número de la solicitud:<br /><br />
            Solicitud presentada en:<br />
            □ Embajada/Consulado<br />□ Proveedor de servicios<br />□ Frontera<br /><br />
            Documentos justificativos:<br />
            □ Documento de viaje □ Invitación<br />□ Seguro médico<br /><br />
            Decisión: □ Denegado □ Expedido A/C/VTL<br /><br />
            Número de entradas: □ Una □ Dos □ múltiples<br />
            Número de días: {data.field26_durationOfStayDays}
          </div>
        </div>
        <div className="text-center text-[8px] mt-2">1</div>
      </div>

      {/* PAGE 2 */}
      <div className="bg-white mx-auto max-w-[210mm] shadow-xl border border-slate-400 p-[8mm]">
        <div className="grid grid-cols-3">
          <Box><L>17. Date of birth:</L><V>{fmt(data.field17_euFamilyMemberDob)}</V></Box>
          <Box><L>Nationality:</L><V>{data.field17_euFamilyMemberNationality}</V></Box>
          <Box><L>Travel document / ID no:</L><V>{data.field17_euFamilyMemberDocNumber}</V></Box>
        </div>
        <Box className="p-1">
          <L>18. Family relationship with EU/EEA/CH citizen:</L>
          <div className="px-1 py-1">
            <Cb on={data.field17_euFamilyMemberRelationship === "SPOUSE"} label="Spouse" />
            <Cb on={data.field17_euFamilyMemberRelationship === "CHILD"} label="Child" />
            <Cb on={data.field17_euFamilyMemberRelationship === "GRANDCHILD"} label="Grandchild" />
            <Cb on={data.field17_euFamilyMemberRelationship === "DEPENDENT_ASCENDANT"} label="Dependent ascendant" />
          </div>
        </Box>
        <div className="grid grid-cols-2">
          <Box><L>19. Applicant home address and e-mail:</L><V>{data.field18_homeAddress} {data.field18_email}</V></Box>
          <Box><L>19. Telephone number(s):</L><V>{data.field18_phone}</V></Box>
        </div>
        <Box className="p-1">
          <L>20. Residence in a country other than current nationality:</L>
          <div className="px-1 py-1">
            <Cb on={data.field19_residenceInOtherCountry !== "YES"} label="No" />
            <Cb on={data.field19_residenceInOtherCountry === "YES"} label={`Yes — permit ${data.field19_residencePermitNumber} until ${fmt(data.field19_residencePermitValidUntil)}`} />
          </div>
        </Box>
        <Box><L>*21. Current occupation:</L><V>{data.field20_currentOccupation}</V></Box>
        <Box><L>*22. Employer name, address and telephone / school:</L><V>{data.field21_employerNameAndAddress} {data.field21_employerPhone}</V></Box>
        <Box className="p-1">
          <L>*23. Main purpose(s) of the journey:</L>
          <div className="px-1 py-1">
            <Cb on={p.includes("TOURISM")} label="Tourism" />
            <Cb on={p.includes("BUSINESS")} label="Business" />
            <Cb on={p.includes("VISITING_FAMILY")} label="Visiting family/friends" />
            <Cb on={p.includes("CULTURAL")} label="Cultural" />
            <Cb on={p.includes("SPORTS")} label="Sports" />
            <Cb on={p.includes("OFFICIAL_VISIT")} label="Official visit" />
            <Cb on={p.includes("MEDICAL")} label="Medical" />
            <Cb on={p.includes("STUDY")} label="Study" />
            <Cb on={p.includes("AIRPORT_TRANSIT")} label="Airport transit" />
          </div>
        </Box>
        <Box><L>24. Additional information on purpose of stay:</L><V>{data.field23_additionalInfoPurpose}</V></Box>
        <div className="grid grid-cols-2">
          <Box><L>25. Member State of main destination:</L><V>{data.field24_memberStateOfMainDestination} {data.field24_otherMemberStates}</V></Box>
          <Box><L>26. Member State of first entry:</L><V>{data.field25_memberStateOfFirstEntry}</V></Box>
        </div>
        <Box className="p-1">
          <L>27. Number of entries requested:</L>
          <div className="px-1 py-1">
            <Cb on={data.field26_numberOfEntries === "SINGLE"} label="One entry" />
            <Cb on={data.field26_numberOfEntries === "TWO"} label="Two entries" />
            <Cb on={data.field26_numberOfEntries === "MULTIPLE"} label="Multiple entries" />
          </div>
        </Box>
        <Box>
          <L>28. Intended date of arrival / departure:</L>
          <V>Arrival {fmt(data.field26_intendedArrivalDate)} — Departure {fmt(data.field26_intendedDepartureDate)} ({data.field26_durationOfStayDays} days)</V>
        </Box>
        <Box className="p-1">
          <L>29. Fingerprints collected previously:</L>
          <div className="px-1 py-1">
            <Cb on={data.field27_fingerprintsCollectedPreviously !== "YES"} label="NO" />
            <Cb on={data.field27_fingerprintsCollectedPreviously === "YES"} label={`YES date ${fmt(data.field27_fingerprintsDate)} sticker ${data.field27_visaStickerNumber}`} />
          </div>
        </Box>
        <Box>
          <L>30. Entry permit for final destination:</L>
          <V>Issued by {data.field28_entryPermitIssuedBy} from {fmt(data.field28_entryPermitValidFrom)} until {fmt(data.field28_entryPermitValidUntil)}</V>
        </Box>
        <Box><L>*31. Inviting person / hotel name:</L><V>{data.field29_invitingPersonOrHotelName}</V></Box>
        <div className="text-center text-[8px] mt-2">2</div>
      </div>

      {/* PAGE 3 */}
      <div className="bg-white mx-auto max-w-[210mm] shadow-xl border border-slate-400 p-[8mm]">
        <div className="grid grid-cols-2">
          <Box><L>Address and e-mail of inviting person / hotel:</L><V>{data.field29_hostAddressAndEmail}</V></Box>
          <Box><L>Telephone:</L><V>{data.field29_hostPhone}</V></Box>
        </div>
        <Box><L>*32. Inviting company / organisation:</L><V>{data.field30_invitingCompany}</V></Box>
        <div className="grid grid-cols-2">
          <Box><L>Contact person:</L><V>{data.field30_companyContactPerson}</V></Box>
          <Box><L>Company telephone:</L><V>{data.field30_companyAddressAndPhone}</V></Box>
        </div>
        <Box className="p-1">
          <L>*33. Cost of travelling and living is covered:</L>
          <div className="grid grid-cols-2 gap-2 p-1">
            <div>
              <Cb on={data.field31_coveredBy === "APPLICANT" || data.field31_coveredBy === "BOTH"} label="by the applicant" />
              <div className="mt-1">
                <Cb on={means.includes("CASH")} label="Cash" />
                <Cb on={means.includes("CREDIT_CARD")} label="Credit card" />
                <Cb on={means.includes("PREPAID_ACCOMMODATION")} label="Pre-paid accommodation" />
                <Cb on={means.includes("PREPAID_TRANSPORT")} label="Pre-paid transport" />
              </div>
            </div>
            <div>
              <Cb on={data.field31_coveredBy === "SPONSOR" || data.field31_coveredBy === "BOTH"} label="by a sponsor" />
              <div className="mt-1">
                <Cb on={sp.includes("ALL_EXPENSES")} label="All expenses covered" />
                <Cb on={sp.includes("ACCOMMODATION")} label="Accommodation provided" />
                <Cb on={sp.includes("PREPAID_TRANSPORT")} label="Pre-paid transport" />
              </div>
            </div>
          </div>
        </Box>
        <Box><L>34. Person filling the form if different from applicant:</L><V>{data.field34_fillerName}</V></Box>
        <div className="mt-3 text-[8px] leading-relaxed space-y-2">
          <p className="font-bold">I am aware that the visa fee is not refunded if the visa is refused.</p>
          <p>I am aware of and consent to the collection of the data required by this application form and the taking of my photograph and fingerprints for the examination of the visa application and storage in the Visa Information System (VIS).</p>
        </div>
        <div className="text-center text-[8px] mt-2">3</div>
      </div>

      {/* PAGE 4 */}
      <div className="bg-white mx-auto max-w-[210mm] shadow-xl border border-slate-400 p-[8mm]">
        <div className="text-[8px] leading-relaxed space-y-2 mb-6">
          <p>I declare that to the best of my knowledge all particulars supplied by me are correct and complete. I am aware that any false statements will lead to my application being rejected or to the annulment of a visa already granted.</p>
          <p>I undertake to leave the territory of the Member States before the expiry of the visa, if granted.</p>
        </div>
        <div className="grid grid-cols-2 mt-8">
          <Box className="h-24">
            <L>Lugar y fecha / Place and date:</L>
            <V>{data.field32_placeAndDate}</V>
          </Box>
          <Box className="h-24">
            <L>Firma / Signature (for minors: parental authority):</L>
            <V>{data.field33_signatureName || `${data.field3_firstNames} ${data.field1_surname}`}</V>
          </Box>
        </div>
        <div className="text-center text-[8px] mt-4">4</div>
      </div>
    </div>
  );
}
