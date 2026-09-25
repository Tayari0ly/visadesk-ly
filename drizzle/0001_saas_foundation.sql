BEGIN;

CREATE TABLE IF NOT EXISTS branches (
  id serial PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS licenses (
  id serial PRIMARY KEY,
  branch_id integer NOT NULL REFERENCES branches(id),
  license_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamp NOT NULL,
  expires_at timestamp NOT NULL,
  max_employees integer,
  max_forms integer,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'employee',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id),
  created_by_username text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT 'طلب تأشيرة شنقن جديد',
  applicant_name text NOT NULL DEFAULT '',
  passport_number text NOT NULL DEFAULT '',
  destination_country text NOT NULL DEFAULT 'France',
  travel_date text NOT NULL DEFAULT '',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  has_passport_scan boolean DEFAULT false,
  passport_image_preview text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id integer REFERENCES branches(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();
ALTER TABLE applications ADD COLUMN IF NOT EXISTS branch_id integer REFERENCES branches(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_by integer REFERENCES users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_by integer REFERENCES users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS form_type text NOT NULL DEFAULT 'schengen';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS printed_at timestamp;

CREATE TABLE IF NOT EXISTS roles (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS permissions (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS user_roles (
  user_id integer NOT NULL REFERENCES users(id),
  role_id integer NOT NULL REFERENCES roles(id),
  UNIQUE(user_id, role_id)
);
CREATE TABLE IF NOT EXISTS form_versions (
  id serial PRIMARY KEY,
  application_id integer NOT NULL REFERENCES applications(id),
  version integer NOT NULL,
  form_data jsonb NOT NULL,
  changed_fields jsonb NOT NULL,
  changed_by integer REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(application_id, version)
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id),
  branch_id integer REFERENCES branches(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  ip_address text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activity_logs (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id),
  branch_id integer REFERENCES branches(id),
  action text NOT NULL,
  record_id text,
  metadata jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_extraction_logs (
  id serial PRIMARY KEY,
  source_type text NOT NULL DEFAULT 'passport_scan',
  extracted_data jsonb NOT NULL,
  confidence text DEFAULT 'high',
  ai_model_used text DEFAULT 'local_rule_engine',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_branch_updated_idx ON applications(branch_id, updated_at);
CREATE INDEX IF NOT EXISTS applications_user_updated_idx ON applications(user_id, updated_at);
CREATE INDEX IF NOT EXISTS applications_passport_idx ON applications(passport_number);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS users_branch_idx ON users(branch_id);
CREATE INDEX IF NOT EXISTS form_versions_application_idx ON form_versions(application_id, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_branch_created_idx ON audit_logs(branch_id, created_at);
CREATE INDEX IF NOT EXISTS activity_logs_branch_created_idx ON activity_logs(branch_id, created_at);
CREATE INDEX IF NOT EXISTS ai_extraction_logs_created_idx ON ai_extraction_logs(created_at);

COMMIT;
