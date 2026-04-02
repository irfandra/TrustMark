-- Remove deprecated brand compliance fields
-- Request letter and company registry are no longer used by backend/frontend.
ALTER TABLE brands DROP COLUMN IF EXISTS statement_letter_url;
ALTER TABLE brands DROP COLUMN IF EXISTS company_registry_id;
