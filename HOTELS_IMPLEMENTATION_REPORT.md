# Hotels Database Implementation Report

## Executive result

The system now has a database-backed hotel module integrated with the existing Schengen form. It supports server-side search, pagination, debouncing in the form editor, hotel selection with persisted `hotel_id`, manual hotel submission as `pending_review`, administrator review, audit logging, statistics, and an authoritative-data import path.

The implementation does **not** claim to contain all hotels in Spain. The verified dataset downloaded during this task covers the Community of Madrid only. Because this sandbox did not contain `DATABASE_URL`, no records were written to Neon during this task. The downloaded source contains **635 hotel-category candidates** before database-level deduplication: 523 `HOTEL`, 63 `HOTEL RURAL`, and 49 `HOTEL-APART.` records. The official file contains 8,882 accommodation records across 170 localities, including non-hotel categories that the importer intentionally excludes.

## Real data source

The imported-source file is the official **Comunidad de Madrid — Alojamientos turísticos** CSV:

- Dataset page: <https://datos.comunidad.madrid/dataset/alojamientos_turisticos>
- Direct CSV: <https://datos.comunidad.madrid/catalogo/dataset/ef437c50-5b26-4843-92c3-d8eef5507fac/resource/260e80ac-2062-41f6-9f96-4902675b1078/download/alojamientos_turisticos.csv>
- Published licence: CC BY 4.0, according to the dataset page.
- Retrieval date: 2026-09-26.
- Mapped source fields: `denominacion`, address components, `localidad`, `cdpostal`, province Madrid, country Spain, and `signatura` as `external_id`.

Other researched sources are documented in [`data/sources/README.md`](data/sources/README.md), including Castilla y León, Valencia, Catalonia, and OpenStreetMap/Geofabrik. OSM is treated as ODbL data and is not mixed into the official-registry count.

Three regional mappers have now been added in [`scripts/hotel-mappers.ts`](scripts/hotel-mappers.ts), with a shared importer in [`scripts/import-regional-hotels.ts`](scripts/import-regional-hotels.ts). Dry-run validation against the official files produced 619 Castilla y León candidates, 905 Valencia candidates, and 3,219 Catalonia candidates. These are pre-deduplication candidate counts, not Neon insertion counts. The source downloader is [`scripts/download-regional-hotel-sources.sh`](scripts/download-regional-hotel-sources.sh); the large regional snapshots are intentionally not committed to keep the repository small.

## Database changes

Migration: [`drizzle/0002_hotels.sql`](drizzle/0002_hotels.sql)

The new `hotels` table contains:

| Requirement | Column |
|---|---|
| Hotel name | `hotel_name` |
| Address | `address` |
| City | `city` |
| Province | `province` |
| Postal code | `postal_code` |
| Phone | `phone` |
| Email | `email` |
| Website | `website` |
| Country | `country` |
| Latitude / longitude | `latitude`, `longitude` |
| Stars | `stars` |
| Source / external identifier | `source`, `external_id` |
| Review lifecycle | `status` (`pending_review`, `approved`, `rejected`, `merged`) |
| Tenant ownership | `branch_id` |
| Audit/review metadata | `created_by`, `reviewed_by`, `reviewed_at` |
| Timestamps | `created_at`, `updated_at` |

Normalized fields are stored for deterministic deduplication. Indexes cover name, city, province, postal code, status, branch/status, and application usage. `pg_trgm` GIN indexes are created for name and city search where Neon permits the extension.

`applications.hotel_id` was added as a nullable foreign key. Existing applications are preserved because their original accommodation strings remain in `form_data`; old records are not deleted or rewritten automatically.

## New APIs

| Route | Purpose |
|---|---|
| `GET /api/hotels` | Authenticated, paginated, server-side search by free text, city, province, postal code, and status. Non-admin users see approved global records plus their branch’s records. |
| `POST /api/hotels` | Create a manually entered hotel. Employees create `pending_review` records; administrators may create approved records. Duplicate matches are returned with HTTP 409. |
| `GET /api/hotels/:id` | Read a visible hotel record. |
| `PUT /api/hotels/:id` | Edit or approve/reject/merge a hotel, with audit logging and branch checks. |
| `GET /api/hotels/stats` | Totals, approved/pending/rejected counts, duplicate groups, city distribution, and most-used hotels in applications. |
| `POST /api/hotels/import` | Import up to 5,000 authoritative JSON records per request, deduplicating by source/external ID or normalized name/address/city/postal code. |

## Form workflow

The form flow is now:

`Hotel Search → server-side autocomplete → Select Hotel → auto-fill name/address/phone → save hotel_id + legacy text → print/PDF`

The quick-fill component uses a 300 ms debounce against `/api/hotels`. The selected database record is written to `formData.hotelId` and to `applications.hotel_id`, while the legacy text fields remain populated for compatibility and PDF output. Manual entry is offered as a pending-review submission and is never presented as an approved official record.

## Management UI and portals

- [`/hotels`](src/app/hotels/page.tsx) provides search filters, pagination, status review actions, statistics, and controlled JSON import.
- The authenticated header now exposes the Hotels Database page.
- Owner overview now reports total hotels and pending hotels.
- Company overview now reports branch-owned hotels and pending branch reviews.
- Hotel changes and imports create `audit_logs` records.

## Import command

The reproducible importer is [`scripts/import-madrid-hotels.ts`](scripts/import-madrid-hotels.ts). After applying the migration and configuring Neon:

```bash
npm ci
npm run import:madrid-hotels
```

The default input is `data/sources/madrid-alojamientos_turisticos.csv`; an alternate CSV path can be passed after the script command. The importer filters the three hotel categories above, uses the official registry identifier as `external_id`, stores the source string, and skips duplicate records.

## Neon deployment steps

1. In Neon, select the production branch/database and copy its pooled `DATABASE_URL`.
2. Apply [`drizzle/0001_saas_foundation.sql`](drizzle/0001_saas_foundation.sql) if the existing database has not been initialized.
3. Apply [`drizzle/0002_hotels.sql`](drizzle/0002_hotels.sql) once. It is additive and uses `IF NOT EXISTS` for tables, columns, and indexes.
4. Redeploy Vercel with the same `DATABASE_URL` configured for the required environments.
5. Run `npm run import:madrid-hotels` from a trusted environment with the same Neon URL, or paste an authoritative JSON dataset into the Hotels Database page as an administrator.

## Validation

- `npm run typecheck` passed.
- `git diff --check` passed.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/placeholder npm run build` passed; the placeholder was used only to satisfy build-time configuration and was not used for data access.
- No hotel rows were inserted into Neon in this sandbox because `DATABASE_URL` was unavailable.

## Remaining data-coverage work

To expand beyond Madrid, download the current official distributions for Castilla y León, Valencia, Catalonia, and additional autonomous communities, create one mapper per schema, preserve each source licence and retrieval timestamp, then run the same importer. The system is prepared for this expansion but should report actual imported counts per source rather than claiming complete Spain coverage.
