/**
 * Official Spanish Schengen visa form coordinate map
 * Source template: origin (0,0) bottom-left, page ~575 x 825 units
 * Red + marks from the provided official grid.
 */
export const FORM_PAGE_UNITS = { width: 575, height: 825 };

export interface FieldAnchor {
  page: 1 | 2 | 3 | 4;
  x: number;
  y: number;
  officialField: string;
  ourKey: string;
}

export const OFFICIAL_FIELD_ANCHORS: FieldAnchor[] = [
  { page: 1, x: 100, y: 590, officialField: "1", ourKey: "field1_surname" },
  { page: 1, x: 100, y: 555, officialField: "2", ourKey: "field2_surnameAtBirth" },
  { page: 1, x: 100, y: 525, officialField: "3", ourKey: "field3_firstNames" },
  { page: 1, x: 100, y: 450, officialField: "4", ourKey: "field4_dateOfBirth" },
  { page: 1, x: 275, y: 480, officialField: "5", ourKey: "field5_placeOfBirth" },
  { page: 1, x: 275, y: 430, officialField: "6", ourKey: "field6_countryOfBirth" },
  { page: 1, x: 375, y: 480, officialField: "7", ourKey: "field7_currentNationality" },
  { page: 1, x: 175, y: 280, officialField: "10", ourKey: "field10_parentalAuthority" },
  { page: 1, x: 200, y: 240, officialField: "11", ourKey: "field11_nationalIdNumber" },
  { page: 1, x: 100, y: 155, officialField: "13", ourKey: "field13_travelDocNumber" },
  { page: 1, x: 200, y: 155, officialField: "14", ourKey: "field14_issueDate" },
  { page: 1, x: 290, y: 155, officialField: "15", ourKey: "field15_validUntil" },
  { page: 1, x: 390, y: 155, officialField: "16", ourKey: "field16_issuedBy" },
  { page: 2, x: 125, y: 655, officialField: "19", ourKey: "field18_homeAddress" },
  { page: 2, x: 400, y: 655, officialField: "19 phone", ourKey: "field18_phone" },
  { page: 2, x: 125, y: 550, officialField: "21", ourKey: "field20_currentOccupation" },
  { page: 2, x: 150, y: 525, officialField: "22", ourKey: "field21_employerNameAndAddress" },
  { page: 2, x: 150, y: 380, officialField: "25", ourKey: "field24_memberStateOfMainDestination" },
  { page: 2, x: 375, y: 380, officialField: "26", ourKey: "field25_memberStateOfFirstEntry" },
  { page: 2, x: 200, y: 285, officialField: "28 in", ourKey: "field26_intendedArrivalDate" },
  { page: 2, x: 200, y: 265, officialField: "28 out", ourKey: "field26_intendedDepartureDate" },
  { page: 2, x: 200, y: 235, officialField: "29", ourKey: "field27_fingerprintsCollectedPreviously" },
  { page: 2, x: 150, y: 185, officialField: "30 no", ourKey: "field28_entryPermitIssuedBy" },
  { page: 2, x: 325, y: 185, officialField: "30 from", ourKey: "field28_entryPermitValidFrom" },
  { page: 2, x: 475, y: 185, officialField: "30 until", ourKey: "field28_entryPermitValidUntil" },
  { page: 2, x: 150, y: 140, officialField: "31", ourKey: "field29_invitingPersonOrHotelName" },
  { page: 3, x: 175, y: 700, officialField: "32", ourKey: "field30_invitingCompany" },
  { page: 3, x: 125, y: 655, officialField: "32 part1", ourKey: "field30_companyContactPerson" },
  { page: 3, x: 400, y: 655, officialField: "32 part2", ourKey: "field30_companyAddressAndPhone" },
  { page: 3, x: 175, y: 605, officialField: "33", ourKey: "field31_coveredBy" },
  { page: 4, x: 100, y: 200, officialField: "date", ourKey: "field32_placeAndDate" },
];

/** Convert template units (origin bottom-left) to jsPDF mm (origin top-left, A4). */
export function unitsToMm(x: number, y: number) {
  const pageW = 210;
  const pageH = 297;
  return {
    x: (x / FORM_PAGE_UNITS.width) * pageW,
    y: pageH - (y / FORM_PAGE_UNITS.height) * pageH,
  };
}
