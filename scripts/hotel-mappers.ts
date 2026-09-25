import type { HotelInput } from "@/lib/hotels";

export type RegionalRow = Record<string, string>;
export type RegionalMapper = {
  source: string;
  label: string;
  delimiter: ";" | ",";
  encoding: "latin1" | "utf8";
  hotelRows: (row: RegionalRow) => boolean;
  map: (row: RegionalRow) => HotelInput;
};

const first = (row: RegionalRow, ...keys: string[]) => {
  for (const key of keys) {
    const value = String(row[key] ?? "").trim();
    if (value) return value;
  }
  return "";
};

const joinAddress = (...parts: string[]) => parts.map((part) => part.trim()).filter(Boolean).join(", ");
const numericStars = (value: string) => {
  const match = value.match(/[1-7]/);
  return match ? Number(match[0]) : null;
};

export const regionalMappers: Record<string, RegionalMapper> = {
  "castilla-y-leon": {
    source: "castilla_y_leon_alojamientos_hoteleros",
    label: "Junta de Castilla y León — Alojamientos hoteleros",
    delimiter: ";",
    encoding: "latin1",
    hotelRows: (row) => /^(Hotel|Hotel Residencia|Hotel Apartamento|Motel)(\s|$)/i.test(first(row, "Tipo")),
    map: (row) => ({
      hotelName: first(row, "Nombre"),
      address: first(row, "Dirección"),
      city: first(row, "Municipio", "Localidad"),
      province: first(row, "Provincia"),
      postalCode: first(row, "C.Postal"),
      phone: first(row, "Teléfono 1", "Teléfono 2", "Teléfono 3"),
      email: first(row, "Email"),
      website: first(row, "web"),
      country: "Spain",
      latitude: first(row, "GPS.Latitud"),
      longitude: first(row, "GPS.Longitud"),
      stars: numericStars(first(row, "Categoría")),
      source: "castilla_y_leon_alojamientos_hoteleros",
      externalId: first(row, "N.Registro"),
    }),
  },
  valencia: {
    source: "generalitat_valenciana_registro_hoteles",
    label: "Generalitat Valenciana — Registro de establecimientos hoteleros",
    delimiter: ";",
    encoding: "latin1",
    hotelRows: (row) => /^(ALTA|EN ALTA)$/i.test(first(row, "Estado")) && /^(HOTEL|HOTEL-APARTAMENTO|HOTEL-BALNEARIO)$/i.test(first(row, "Modalidad")),
    map: (row) => ({
      hotelName: first(row, "Nombre"),
      address: joinAddress(first(row, "Tipo Via"), first(row, "Via"), first(row, "Nºmero", "Número")) || first(row, "Dirección"),
      city: first(row, "Municipio"),
      province: first(row, "Provincia"),
      postalCode: first(row, "CP"),
      email: first(row, "Email"),
      website: first(row, "Web"),
      country: "Spain",
      stars: numericStars(first(row, "Categoría")),
      source: "generalitat_valenciana_registro_hoteles",
      externalId: first(row, "Signatura"),
    }),
  },
  catalonia: {
    source: "generalitat_catalunya_registre_allotjaments",
    label: "Generalitat de Catalunya — Registre de turisme",
    delimiter: ",",
    encoding: "utf8",
    hotelRows: (row) => /^Alta$/i.test(first(row, "Estat")) && /^Hotels$/i.test(first(row, "Tipus establiment")),
    map: (row) => ({
      hotelName: first(row, "Rètol"),
      address: joinAddress(first(row, "Tipus de via"), first(row, "Nom de la via"), first(row, "Número"), first(row, "Pis"), first(row, "Porta")),
      city: first(row, "Municipi"),
      province: first(row, "Província"),
      postalCode: first(row, "Codi Postal"),
      country: "Spain",
      stars: numericStars(first(row, "Categoria")),
      source: "generalitat_catalunya_registre_allotjaments",
      externalId: [first(row, "Número inscripció"), first(row, "Dígit de control")].filter(Boolean).join("-"),
    }),
  },
};
