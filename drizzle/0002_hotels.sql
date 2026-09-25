BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS hotels (
  id serial PRIMARY KEY,
  branch_id integer REFERENCES branches(id),
  hotel_name text NOT NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Spain',
  latitude text,
  longitude text,
  stars integer,
  source text NOT NULL DEFAULT 'manual',
  external_id text,
  status text NOT NULL DEFAULT 'pending_review',
  normalized_name text NOT NULL DEFAULT '',
  normalized_address text NOT NULL DEFAULT '',
  normalized_city text NOT NULL DEFAULT '',
  normalized_postal_code text NOT NULL DEFAULT '',
  created_by integer REFERENCES users(id),
  reviewed_by integer REFERENCES users(id),
  reviewed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS hotel_id integer REFERENCES hotels(id);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS branch_id integer REFERENCES branches(id);

CREATE INDEX IF NOT EXISTS hotels_name_idx ON hotels(normalized_name);
CREATE INDEX IF NOT EXISTS hotels_name_trgm_idx ON hotels USING gin (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS hotels_city_idx ON hotels(normalized_city);
CREATE INDEX IF NOT EXISTS hotels_city_trgm_idx ON hotels USING gin (normalized_city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS hotels_province_idx ON hotels(province);
CREATE INDEX IF NOT EXISTS hotels_postal_idx ON hotels(normalized_postal_code);
CREATE INDEX IF NOT EXISTS hotels_status_idx ON hotels(status);
CREATE INDEX IF NOT EXISTS hotels_branch_status_idx ON hotels(branch_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS hotels_external_source_unique ON hotels(source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS applications_hotel_idx ON applications(hotel_id);

COMMIT;
