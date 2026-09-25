import fs from "node:fs";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cleanHotelInput } from "@/lib/hotels";

const file = process.argv[2] || "data/sources/madrid-alojamientos_turisticos.csv";
const source = "comunidad_madrid_alojamientos_turisticos";
const attribution = "Comunidad de Madrid, Alojamientos turísticos, CC BY 4.0";

function csvLine(line: string) {
  const result: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; } else if (ch === '"') quoted = !quoted; else if (ch === ";" && !quoted) { result.push(value); value = ""; } else value += ch; }
  result.push(value); return result;
}

async function main() {
  const lines = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = csvLine(lines[0]);
  const index = new Map(header.map((name, i) => [name.trim(), i]));
  const get = (values: string[], name: string) => values[index.get(name) ?? -1]?.trim() || "";
  const seen = new Set<string>(); let candidates = 0; let inserted = 0; let skipped = 0;
  const hotelTypes = new Set(["HOTEL", "HOTEL RURAL", "HOTEL-APART."]);
  for (const line of lines.slice(1)) {
    const values = csvLine(line); const type = get(values, "alojamiento_tipo"); if (!hotelTypes.has(type)) continue;
    const externalId = get(values, "signatura"); const name = get(values, "denominacion"); if (!name) { skipped++; continue; }
    candidates++;
    const address = [get(values, "via_tipo"), get(values, "via_nombre"), get(values, "numero")].filter(Boolean).join(" ");
    const input = cleanHotelInput({ hotelName: name, address, city: get(values, "localidad"), province: "Madrid", postalCode: get(values, "cdpostal"), country: "Spain", source, externalId });
    const key = [input.normalizedName, input.normalizedAddress, input.normalizedCity, input.normalizedPostalCode, externalId].join("|");
    if (seen.has(key)) { skipped++; continue; } seen.add(key);
    const duplicate = await db.select({ id: hotels.id }).from(hotels).where(externalId ? and(eq(hotels.source, source), eq(hotels.externalId, externalId)) : and(eq(hotels.normalizedName, input.normalizedName), eq(hotels.normalizedAddress, input.normalizedAddress), eq(hotels.normalizedCity, input.normalizedCity), eq(hotels.normalizedPostalCode, input.normalizedPostalCode))).limit(1);
    if (duplicate.length) { skipped++; continue; }
    await db.insert(hotels).values({ ...input, status: "approved", branchId: null, createdBy: null });
    inserted++;
  }
  console.log(JSON.stringify({ source, attribution, file, candidates, inserted, skipped }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
