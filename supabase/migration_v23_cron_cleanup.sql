-- SQL Migration & Documentation: Data Minimization Cleanup Strategy
-- Purges temporary Snap Hunt media older than 30 days unless saved to Moments.

-- Option A: Database function for pg_cron (if pg_cron extension is enabled)
CREATE OR REPLACE FUNCTION public.cleanup_expired_snap_hunts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete entries older than 30 days that are not referenced in shared_moments
  DELETE FROM public.snap_hunt_entries
  WHERE submitted_at < NOW() - INTERVAL '30 days'
    AND photo_url NOT IN (
      SELECT photo_url FROM public.shared_moments WHERE photo_url IS NOT NULL
    );
END;
$$;

-- Schedule daily at 3:00 AM UTC via pg_cron (uncomment if pg_cron is enabled):
-- SELECT cron.schedule('0 3 * * *', 'SELECT public.cleanup_expired_snap_hunts();');

-- Option B: Next.js Serverless Cron Endpoint
-- Send a daily POST request to: https://<your-domain>/api/cron/cleanup-temp-media
-- with Header: Authorization: Bearer <CRON_SECRET>
