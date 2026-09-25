export interface SchengenFormData {
  // Field 1-3: Personal Information
  field1_surname: string;
  field2_surnameAtBirth: string;
  field3_firstNames: string;
  field4_dateOfBirth: string; // YYYY-MM-DD
  field5_placeOfBirth: string;
  field6_countryOfBirth: string;
  field7_currentNationality: string;
  field7_nationalityAtBirth: string;
  field7_otherNationalities: string;
  field8_sex: "MALE" | "FEMALE" | "OTHER" | "";
  field9_civilStatus: "SINGLE" | "MARRIED" | "REGISTERED_UNION" | "SEPARATED" | "DIVORCED" | "WIDOWED" | "OTHER" | "";
  field9_civilStatusOther: string;
  
  // Field 10-11: Parental & National ID
  field10_parentalAuthority: string; // for minors: Surname, first name, address, nationality, phone
  field11_nationalIdNumber: string;

  // Field 12-16: Travel Document (Passport)
  field12_travelDocType: "ORDINARY" | "DIPLOMATIC" | "SERVICE" | "OFFICIAL" | "SPECIAL" | "OTHER";
  field12_travelDocTypeOther: string;
  field13_travelDocNumber: string;
  field14_issueDate: string; // YYYY-MM-DD
  field15_validUntil: string; // YYYY-MM-DD
  field16_issuedBy: string;

  // Field 17: EU/EEA/CH family member
  field17_euFamilyMemberSurname: string;
  field17_euFamilyMemberFirstName: string;
  field17_euFamilyMemberDob: string;
  field17_euFamilyMemberNationality: string;
  field17_euFamilyMemberDocNumber: string;
  field17_euFamilyMemberRelationship: "SPOUSE" | "CHILD" | "GRANDCHILD" | "DEPENDENT_ASCENDANT" | "REGISTERED_PARTNERSHIP" | "OTHER" | "";

  // Field 18-21: Address & Occupation
  field18_homeAddress: string;
  field18_email: string;
  field18_phone: string;
  field19_residenceInOtherCountry: "NO" | "YES" | "";
  field19_residencePermitNumber: string;
  field19_residencePermitValidUntil: string;
  field20_currentOccupation: string;
  field21_employerNameAndAddress: string;
  field21_employerPhone: string;

  // Field 22-26: Trip Details
  field22_purposeOfJourney: string[]; // TOURISM, BUSINESS, VISITING_FAMILY, CULTURAL, SPORTS, OFFICIAL_VISIT, MEDICAL, STUDY, AIRPORT_TRANSIT, OTHER
  field22_purposeOther: string;
  field23_additionalInfoPurpose: string;
  field24_memberStateOfMainDestination: string;
  field24_otherMemberStates: string;
  field25_memberStateOfFirstEntry: string;
  field26_numberOfEntries: "SINGLE" | "TWO" | "MULTIPLE" | "";
  field26_intendedArrivalDate: string; // YYYY-MM-DD
  field26_intendedDepartureDate: string; // YYYY-MM-DD
  field26_durationOfStayDays: string;

  // Field 27-28: Prior Schengen visas & entry permits
  field27_fingerprintsCollectedPreviously: "NO" | "YES" | "";
  field27_fingerprintsDate: string;
  field27_visaStickerNumber: string;
  field28_entryPermitFinalDestination: string;
  field28_entryPermitIssuedBy: string;
  field28_entryPermitValidFrom: string;
  field28_entryPermitValidUntil: string;

  // Field 29-30: Host / Accommodation
  field29_invitingPersonOrHotelName: string;
  field29_hostAddressAndEmail: string;
  field29_hostPhone: string;
  field30_invitingCompany: string;
  field30_companyContactPerson: string;
  field30_companyAddressAndPhone: string;

  // Field 31: Means of Support
  field31_coveredBy: "APPLICANT" | "SPONSOR" | "BOTH" | "";
  field31_applicantMeans: string[]; // CASH, TRAVELLER_CHEQUES, CREDIT_CARD, PREPAID_ACCOMMODATION, PREPAID_TRANSPORT, OTHER
  field31_applicantMeansOther: string;
  field31_sponsorMeans: string[]; // HOST_REFERRED, ALL_EXPENSES, ACCOMMODATION, PREPAID_TRANSPORT, OTHER
  field31_sponsorMeansOther: string;
  field31_sponsorType: "HOST" | "COMPANY" | "OTHER" | "";

  // Field 32-33: Place, Date & Signature (official form: unnumbered boxes on page 4)
  field32_placeAndDate: string;
  field33_signatureName: string;

  // Official Spanish form field 34: person filling the form if different
  field34_fillerName: string;
  field34_fillerAddressEmail: string;
  field34_fillerPhone: string;
}

export const defaultSchengenFormData: SchengenFormData = {
  field1_surname: "",
  field2_surnameAtBirth: "",
  field3_firstNames: "",
  field4_dateOfBirth: "",
  field5_placeOfBirth: "",
  field6_countryOfBirth: "",
  field7_currentNationality: "",
  field7_nationalityAtBirth: "",
  field7_otherNationalities: "",
  field8_sex: "",
  field9_civilStatus: "SINGLE",
  field9_civilStatusOther: "",

  field10_parentalAuthority: "",
  field11_nationalIdNumber: "",

  field12_travelDocType: "ORDINARY",
  field12_travelDocTypeOther: "",
  field13_travelDocNumber: "",
  field14_issueDate: "",
  field15_validUntil: "",
  field16_issuedBy: "",

  field17_euFamilyMemberSurname: "",
  field17_euFamilyMemberFirstName: "",
  field17_euFamilyMemberDob: "",
  field17_euFamilyMemberNationality: "",
  field17_euFamilyMemberDocNumber: "",
  field17_euFamilyMemberRelationship: "",

  field18_homeAddress: "",
  field18_email: "",
  field18_phone: "",
  field19_residenceInOtherCountry: "NO",
  field19_residencePermitNumber: "",
  field19_residencePermitValidUntil: "",
  field20_currentOccupation: "",
  field21_employerNameAndAddress: "",
  field21_employerPhone: "",

  field22_purposeOfJourney: ["TOURISM"],
  field22_purposeOther: "",
  field23_additionalInfoPurpose: "",
  field24_memberStateOfMainDestination: "FRANCE",
  field24_otherMemberStates: "",
  field25_memberStateOfFirstEntry: "FRANCE",
  field26_numberOfEntries: "SINGLE",
  field26_intendedArrivalDate: "",
  field26_intendedDepartureDate: "",
  field26_durationOfStayDays: "15",

  field27_fingerprintsCollectedPreviously: "NO",
  field27_fingerprintsDate: "",
  field27_visaStickerNumber: "",
  field28_entryPermitFinalDestination: "",
  field28_entryPermitIssuedBy: "",
  field28_entryPermitValidFrom: "",
  field28_entryPermitValidUntil: "",

  field29_invitingPersonOrHotelName: "",
  field29_hostAddressAndEmail: "",
  field29_hostPhone: "",
  field30_invitingCompany: "",
  field30_companyContactPerson: "",
  field30_companyAddressAndPhone: "",

  field31_coveredBy: "APPLICANT",
  field31_applicantMeans: ["CASH", "CREDIT_CARD", "PREPAID_ACCOMMODATION"],
  field31_applicantMeansOther: "",
  field31_sponsorMeans: [],
  field31_sponsorMeansOther: "",
  field31_sponsorType: "",

  field32_placeAndDate: "Tripoli, " + new Date().toISOString().split("T")[0],
  field33_signatureName: "",
  field34_fillerName: "",
  field34_fillerAddressEmail: "",
  field34_fillerPhone: "",
};

export interface ExtractedPassportData {
  surname?: string;
  firstNames?: string;
  passportNumber?: string;
  nationality?: string;
  nationalityCode?: string;
  dateOfBirth?: string;
  sex?: "MALE" | "FEMALE" | "";
  expiryDate?: string;
  issueDate?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  personalNumber?: string;
  mrzRaw?: string;
  confidenceScore?: number;
  extractionEngine?: string;
}
