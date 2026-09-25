import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { auditLogs, hotels } from "@/db/schema";
import { cleanHotelInput } from "@/lib/hotels";
import { regionalMappers } from "./hotel-mappers";

function parseCsvLine(line: string, delimiter: string) {
  const result: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === delimiter && !quoted) { result.push(value); value = ""; }
    else value += ch;
  }
  result.push(value);
  return result;
}

function parseArgs() {
  const args = process.argv.slice(2); const values: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--")) continue;
    const key = args[i].slice(2);
    if (args[i + 1] && !args[i + 1].startsWith("--")) values[key] = args[++i]; else values[key] = true;
  }
  return values;
}

async function main() {
  const args = parseArgs();
  const region = String(args.region || "");
  const mapper = regionalMappers[region];
  if (!mapper) throw new Error(`Unknown --region. Use: ${Object.keys(regionalMappers).join(", ")}`);
  const file = String(args.file || "");
  if (!file) throw new Error("Missing --file pointing to the downloaded CSV.");
  const absoluteFile = path.resolve(file);
  const content = fs.readFileSync(absoluteFile).toString(mapper.encoding).replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error("The CSV is empty.");
  const headerValues = parseCsvLine(lines[0], mapper.delimiter).map((name) => name.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line, mapper.delimiter);
    return Object.fromEntries(headerValues.map((header, index) => [header, String(values[index] ?? "").trim()]));
  });
  const dryRun = Boolean(args["dry-run"]);
  const database = dryRun ? null : (await import("@/db")).db;
  const max = args.limit ? Math.max(1, Number(args.limit)) : Number.POSITIVE_INFINITY;
  const seen = new Set<string>(); let candidates = 0; let inserted = 0; let skipped = 0; let invalid = 0;
  for (const row of rows) {
    if (candidates >= max) break;
    if (!mapper.hotelRows(row)) continue;
    candidates++;
    const input = cleanHotelInput(mapper.map(row));
    if (!input.hotelName) { invalid++; continue; }
    const key = input.externalId ? `${input.source}|${input.externalId}` : [input.normalizedName, input.normalizedAddress, input.normalizedCity, input.normalizedPostalCode].join("|");
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);
    if (dryRun) { inserted++; continue; }
    const duplicate = await database!.select({ id: hotels.id }).from(hotels).where(input.externalId ? and(eq(hotels.source, input.source), eq(hotels.externalId, input.externalId)) : and(eq(hotels.normalizedName, input.normalizedName), eq(hotels.normalizedAddress, input.normalizedAddress), eq(hotels.normalizedCity, input.normalizedCity), eq(hotels.normalizedPostalCode, input.normalizedPostalCode))).limit(1);
    if (duplicate.length) { skipped++; continue; }
    await database!.insert(hotels).values({ ...input, branchId: null, status: "approved", createdBy: null });
    inserted++;
  }
  if (!dryRun) await database!.insert(auditLogs).values({ action: "IMPORT_HOTEL_SOURCE", entityType: "hotel_import", entityId: mapper.source, newValue: { source: mapper.source, file: absoluteFile, candidates, inserted, skipped, invalid }, metadata: { label: mapper.label } });
  console.log(JSON.stringify({ region, source: mapper.source, label: mapper.label, file: absoluteFile, dryRun, candidates, inserted, skipped, invalid }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
