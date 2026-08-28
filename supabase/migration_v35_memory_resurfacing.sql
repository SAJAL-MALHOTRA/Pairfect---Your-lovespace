-- Migration v35: Memory Resurfacing — "On This Day" RPC
-- Queries existing memory sources for entries matching the same month and day from previous years.

DROP FUNCTION IF EXISTS public.get_on_this_day(UUID, DATE, INT);
DROP FUNCTION IF EXISTS public.get_on_this_day(UUID, DATE);
DROP FUNCTION IF EXISTS public.get_on_this_day(UUID);
DROP TYPE IF EXISTS public.on_this_day_memory CASCADE;

CREATE OR REPLACE FUNCTION public.get_on_this_day(
  p_pair_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  memory_type TEXT,
  memory_id UUID,
  preview_text TEXT,
  image_url TEXT,
  years_ago INT,
  memory_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_month INT := EXTRACT(MONTH FROM p_target_date);
  v_day   INT := EXTRACT(DAY   FROM p_target_date);
  v_year  INT := EXTRACT(YEAR  FROM p_target_date);
BEGIN
  -- Verify the calling user is a member of this active pair
  IF NOT EXISTS (
    SELECT 1 FROM public.pairs
    WHERE id = p_pair_id
      AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Access denied: not an active pair member';
  END IF;

  RETURN QUERY
  SELECT * FROM (
    -- 1. Shared Moments
    SELECT
      'moment'::TEXT AS memory_type,
      sm.id AS memory_id,
      COALESCE(sm.title, 'A shared moment')::TEXT AS preview_text,
      sm.photo_url::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM sm.moment_date)::INT)::INT AS years_ago,
      sm.created_at AS memory_date
    FROM public.shared_moments sm
    WHERE sm.pair_id = p_pair_id
      AND EXTRACT(MONTH FROM sm.moment_date) = v_month
      AND EXTRACT(DAY   FROM sm.moment_date) = v_day
      AND EXTRACT(YEAR  FROM sm.moment_date) < v_year

    UNION ALL

    -- 2. Love Letters (only opened)
    SELECT
      'letter'::TEXT AS memory_type,
      ll.id AS memory_id,
      CASE
        WHEN ll.content IS NULL THEN 'A love letter written for you'
        WHEN jsonb_typeof(ll.content) = 'array' THEN
          COALESCE(
            (SELECT elem->>'value'
             FROM jsonb_array_elements(ll.content) AS elem
             WHERE elem->>'type' = 'text' AND elem->>'value' IS NOT NULL
             LIMIT 1),
            'A love letter written for you'
          )
        WHEN jsonb_typeof(ll.content) = 'string' THEN
          CASE
            WHEN ll.content#>>'{}' LIKE 'enc:%' THEN 'A love letter written for you'
            ELSE LEFT(ll.content#>>'{}', 120)
          END
        ELSE 'A love letter written for you'
      END::TEXT AS preview_text,
      NULL::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM ll.sent_at)::INT)::INT AS years_ago,
      ll.sent_at AS memory_date
    FROM public.love_letters ll
    WHERE ll.pair_id = p_pair_id
      AND ll.is_opened = true
      AND EXTRACT(MONTH FROM ll.sent_at) = v_month
      AND EXTRACT(DAY   FROM ll.sent_at) = v_day
      AND EXTRACT(YEAR  FROM ll.sent_at) < v_year

    UNION ALL

    -- 3. Gratitude Entries
    SELECT
      'gratitude'::TEXT AS memory_type,
      ge.id AS memory_id,
      CASE
        WHEN ge.content LIKE 'enc:%' THEN 'A note of gratitude'
        ELSE LEFT(ge.content, 120)
      END::TEXT AS preview_text,
      NULL::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM ge.created_at)::INT)::INT AS years_ago,
      ge.created_at AS memory_date
    FROM public.gratitude_entries ge
    WHERE ge.pair_id = p_pair_id
      AND EXTRACT(MONTH FROM ge.created_at) = v_month
      AND EXTRACT(DAY   FROM ge.created_at) = v_day
      AND EXTRACT(YEAR  FROM ge.created_at) < v_year

    UNION ALL

    -- 4. Polaroids
    SELECT
      'polaroid'::TEXT AS memory_type,
      pol.id AS memory_id,
      COALESCE(pol.caption, 'A polaroid moment')::TEXT AS preview_text,
      pol.image_path::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM pol.created_at)::INT)::INT AS years_ago,
      pol.created_at AS memory_date
    FROM public.polaroids pol
    WHERE pol.pair_id = p_pair_id
      AND EXTRACT(MONTH FROM pol.created_at) = v_month
      AND EXTRACT(DAY   FROM pol.created_at) = v_day
      AND EXTRACT(YEAR  FROM pol.created_at) < v_year

    UNION ALL

    -- 5. Photo Strips
    SELECT
      'photo_strip'::TEXT AS memory_type,
      ps.id AS memory_id,
      COALESCE(ps.caption, ps.title, 'A photobooth strip')::TEXT AS preview_text,
      (SELECT psi.url FROM public.photo_strip_images psi WHERE psi.strip_id = ps.id ORDER BY psi.position ASC LIMIT 1)::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM ps.created_at)::INT)::INT AS years_ago,
      ps.created_at AS memory_date
    FROM public.photo_strips ps
    WHERE ps.pair_id = p_pair_id
      AND EXTRACT(MONTH FROM ps.created_at) = v_month
      AND EXTRACT(DAY   FROM ps.created_at) = v_day
      AND EXTRACT(YEAR  FROM ps.created_at) < v_year

    UNION ALL

    -- 6. Bouquets (only opened)
    SELECT
      'bouquet'::TEXT AS memory_type,
      bq.id AS memory_id,
      COALESCE(LEFT(bq.message, 120), 'A flower bouquet')::TEXT AS preview_text,
      NULL::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM bq.sent_at)::INT)::INT AS years_ago,
      bq.sent_at AS memory_date
    FROM public.bouquets bq
    WHERE bq.pair_id = p_pair_id
      AND bq.is_opened = true
      AND EXTRACT(MONTH FROM bq.sent_at) = v_month
      AND EXTRACT(DAY   FROM bq.sent_at) = v_day
      AND EXTRACT(YEAR  FROM bq.sent_at) < v_year

    UNION ALL

    -- 7. Mixtapes
    SELECT
      'mixtape'::TEXT AS memory_type,
      mx.id AS memory_id,
      COALESCE(mx.title, 'A mixtape')::TEXT AS preview_text,
      NULL::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM mx.created_at)::INT)::INT AS years_ago,
      mx.created_at AS memory_date
    FROM public.mixtapes mx
    WHERE mx.pair_id = p_pair_id
      AND EXTRACT(MONTH FROM mx.created_at) = v_month
      AND EXTRACT(DAY   FROM mx.created_at) = v_day
      AND EXTRACT(YEAR  FROM mx.created_at) < v_year

    UNION ALL

    -- 8. Mood Logs (with notes)
    SELECT
      'mood'::TEXT AS memory_type,
      ml.id AS memory_id,
      (ml.mood || ': ' || LEFT(ml.note, 100))::TEXT AS preview_text,
      ml.spotify_album_art::TEXT AS image_url,
      (v_year - EXTRACT(YEAR FROM ml.created_at)::INT)::INT AS years_ago,
      ml.created_at AS memory_date
    FROM public.mood_logs ml
    WHERE ml.pair_id = p_pair_id
      AND ml.note IS NOT NULL
      AND ml.note != ''
      AND EXTRACT(MONTH FROM ml.created_at) = v_month
      AND EXTRACT(DAY   FROM ml.created_at) = v_day
      AND EXTRACT(YEAR  FROM ml.created_at) < v_year
  ) results
  ORDER BY results.years_ago ASC
  LIMIT p_limit;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.get_on_this_day(UUID, DATE, INT) TO authenticated;
