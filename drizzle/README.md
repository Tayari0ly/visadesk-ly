# Database migrations

Run `npx drizzle-kit generate` after reviewing the current production database and then apply the generated migration with `npx drizzle-kit migrate`.

This project intentionally does not auto-reset or auto-migrate a live database. Before applying the new SaaS schema, take a PostgreSQL backup and review the generated SQL, especially the nullable `branch_id` columns added for legacy rows.
