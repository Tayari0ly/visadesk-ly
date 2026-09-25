import type { UserRole } from "@/db/schema";

export type HotelInput = {
  hotelName: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  country?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  stars?: number | string | null;
  source?: string;
  externalId?: string | null;
  status?: string;
};

export function normalizeHotelText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function cleanHotelInput(body: HotelInput) {
  const hotelName = String(body.hotelName ?? "").trim().slice(0, 240);
  const address = String(body.address ?? "").trim().slice(0, 500);
  const city = String(body.city ?? "").trim().slice(0, 160);
  const province = String(body.province ?? "").trim().slice(0, 160);
  const postalCode = String(body.postalCode ?? "").trim().slice(0, 32);
  const country = String(body.country ?? "Spain").trim().slice(0, 80) || "Spain";
  const starsNumber = body.stars === null || body.stars === undefined || body.stars === "" ? undefined : Number(body.stars);
  return {
    hotelName,
    address,
    city,
    province,
    postalCode,
    phone: String(body.phone ?? "").trim().slice(0, 80),
    email: String(body.email ?? "").trim().slice(0, 240),
    website: String(body.website ?? "").trim().slice(0, 500),
    country,
    latitude: body.latitude === null || body.latitude === undefined || body.latitude === "" ? null : String(body.latitude).slice(0, 40),
    longitude: body.longitude === null || body.longitude === undefined || body.longitude === "" ? null : String(body.longitude).slice(0, 40),
    stars: starsNumber !== undefined && Number.isInteger(starsNumber) && starsNumber >= 0 && starsNumber <= 7 ? starsNumber : null,
    source: String(body.source ?? "manual").trim().slice(0, 120) || "manual",
    externalId: body.externalId ? String(body.externalId).trim().slice(0, 240) : null,
    normalizedName: normalizeHotelText(hotelName),
    normalizedAddress: normalizeHotelText(address),
    normalizedCity: normalizeHotelText(city),
    normalizedPostalCode: normalizeHotelText(postalCode),
  };
}

export function canManageHotels(role: UserRole) {
  return role === "owner" || role === "super_admin" || role === "admin" || role === "company_admin" || role === "branch_admin";
}

export function canReviewHotels(role: UserRole) {
  return canManageHotels(role);
}
