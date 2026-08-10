-- Migration v30: Add city column to users table for Meanwhile ♥ feature
-- Stores only city name, country, and timezone. NO coordinates.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS city JSONB DEFAULT NULL;

-- Example stored value:
-- {"name": "Delhi", "country": "India", "timezone": "Asia/Kolkata"}
--
-- IMPORTANT: This column must NEVER contain latitude, longitude,
-- GPS coordinates, or exact addresses. The server-side city catalog
-- (src/lib/city-catalog.ts) holds internal coordinates for distance
-- and weather calculations.

COMMENT ON COLUMN public.users.city IS 'User-selected city for Meanwhile feature. Contains only {name, country, timezone}. No coordinates.';
