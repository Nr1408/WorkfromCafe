-- Migration: Make cafe_id nullable now that place_id is primary reference for new check-ins
-- Run this in Supabase SQL editor.

BEGIN;

-- 1. Drop existing NOT NULL constraint on cafe_id (Postgres syntax requires ALTER COLUMN DROP NOT NULL)
ALTER TABLE public.check_ins ALTER COLUMN cafe_id DROP NOT NULL;

-- 2. (Optional but recommended) Ensure at least one of place_id or cafe_id is present
-- First drop existing constraint if we already added a similar one earlier (ignore errors)
DO $$ BEGIN
  ALTER TABLE public.check_ins DROP CONSTRAINT IF EXISTS check_ins_place_or_cafe_present;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

ALTER TABLE public.check_ins
  ADD CONSTRAINT check_ins_place_or_cafe_present
  CHECK (place_id IS NOT NULL OR cafe_id IS NOT NULL);

COMMIT;

-- ROLLBACK;  -- Uncomment to test without applying
