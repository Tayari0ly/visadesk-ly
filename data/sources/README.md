# Hotel data sources and regional mappers

The application imports only records from declared sources. It does not claim complete Spain coverage and does not use booking-site scraping.

## Existing Madrid source

The official Comunidad de Madrid dataset is stored locally as `madrid-alojamientos_turisticos.csv`.

- Dataset: https://datos.comunidad.madrid/dataset/alojamientos_turisticos
- Direct CSV: https://datos.comunidad.madrid/catalogo/dataset/ef437c50-5b26-4843-92c3-d8eef5507fac/resource/260e80ac-2062-41f6-9f96-4902675b1078/download/alojamientos_turisticos.csv
- Licence: CC BY 4.0, according to the dataset page.
- Observed file coverage: 8,882 accommodation rows across 170 localities. The Madrid mapper includes 635 hotel-category candidates: `HOTEL`, `HOTEL RURAL`, and `HOTEL-APART.`.

## New regional sources

The downloader retrieves the current files into `data/sources/` and does not commit the large snapshots automatically.

| Region | Official source | Licence/provenance | Mapper filter | Dry-run candidates observed |
|---|---|---|---|---:|
| Castilla y León | https://datosabiertos.jcyl.es/web/jcyl/set/es/turismo/alojamientos_hoteleros/1284211831639 | CC BY 4.0, Junta de Castilla y León | Active `Hotel`, `Hotel Residencia`, `Hotel Apartamento`, or `Motel` types | 619 |
| Valencia | https://datos.gob.es/es/catalogo/a10002983-datos-de-turismo-sobre-hoteles-en-la-comunidad-valenciana | CC BY catalogue entry for Generalitat Valenciana data | `Estado=ALTA` and `Modalidad` equal to `HOTEL`, `HOTEL-APARTAMENTO`, or `HOTEL-BALNEARIO` | 905 |
| Catalonia | https://datos.gob.es/es/catalogo/a09002970-establecimientos-de-alojamiento-turistico-inscritos-en-el-registro-de-turismo-de-catalunya | Generalitat open-data licence; preserve current dataset notice | `Estat=Alta` and `Tipus establiment=Hotels` | 3,219 |

The observed counts are from the source files downloaded and tested on 2026-09-26. They are candidate counts before database-level deduplication and must not be presented as final inserted counts until an import against Neon completes.

## Commands

```bash
npm run download:regional-hotels
npm run import:castilla-y-leon-hotels -- --dry-run
npm run import:valencia-hotels -- --dry-run
npm run import:catalonia-hotels -- --dry-run
```

The import commands require `DATABASE_URL` unless `--dry-run` is supplied. A real import uses the source-specific identifier as `external_id`, maps the published address/city/province/postal-code fields, normalizes names and addresses, skips duplicate external IDs or normalized records, inserts approved global records, and writes one import summary to `audit_logs`.

## Other researched sources

OpenStreetMap/Geofabrik can extend geographic coverage, but OSM is crowd-sourced and is governed by ODbL 1.0. Any future OSM import must preserve attribution, source object IDs, retrieval metadata, and ODbL obligations. Source references: https://www.openstreetmap.org/copyright and https://download.geofabrik.de/europe/spain.html.
