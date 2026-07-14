-- Migration v8: Digital Bouquet Tables and Seeds

-- =====================================================================
-- 1. CREATE TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.flowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- Rose, Peony, Tulip, etc.
  meaning text NOT NULL, -- Short symbolism
  icon_name text NOT NULL, -- Key mapping to inline React SVG paths
  color_theme text NOT NULL -- Tailwind border/accent color string
);

CREATE TABLE IF NOT EXISTS public.card_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- Botanical, Velvet, Gold, Midnight
  css_theme jsonb NOT NULL -- Fonts, border, background stylings
);

CREATE TABLE IF NOT EXISTS public.bouquets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  flower_ids uuid[] NOT NULL, -- Array of selected flower UUIDs
  card_style_id uuid REFERENCES public.card_styles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_opened boolean DEFAULT false NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  opened_at timestamptz
);

-- =====================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.flowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouquets ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. RLS POLICIES
-- =====================================================================

-- flowers & card_styles: Read-only for authenticated users
CREATE POLICY "Allow authenticated users to read flowers"
  ON public.flowers FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to read card styles"
  ON public.card_styles FOR SELECT USING (true);

-- bouquets
CREATE POLICY "Users can view bouquets for their pair"
  ON public.bouquets FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = bouquets.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert bouquets for their active pair"
  ON public.bouquets FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
        AND pairs.status = 'active'
    )
  );

CREATE POLICY "Users can update bouquets for their active pair"
  ON public.bouquets FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = bouquets.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

-- =====================================================================
-- 4. SEED SELECTION DATA
-- =====================================================================

-- Seed 8 Flowers
INSERT INTO public.flowers (id, name, meaning, icon_name, color_theme) VALUES
('f0000000-0000-0000-0000-000000000001', 'Red Rose', 'Love, passion, and deep affection.', 'rose', 'from-rose-500 to-red-600'),
('f0000000-0000-0000-0000-000000000002', 'White Lily', 'Purity, devotion, and new beginnings.', 'lily', 'from-stone-100 to-amber-50'),
('f0000000-0000-0000-0000-000000000003', 'Pink Peony', 'Prosperity, good fortune, and honor.', 'peony', 'from-pink-400 to-rose-300'),
('f0000000-0000-0000-0000-000000000004', 'Purple Tulip', 'Royalty, admiration, and deep respect.', 'tulip', 'from-fuchsia-600 to-purple-500'),
('f0000000-0000-0000-0000-000000000005', 'Sunflower', 'Adoration, loyalty, and bright energy.', 'sunflower', 'from-yellow-400 to-amber-500'),
('f0000000-0000-0000-0000-000000000006', 'Blue Hydrangea', 'Gratitude, understanding, and harmony.', 'hydrangea', 'from-blue-400 to-indigo-500'),
('f0000000-0000-0000-0000-000000000007', 'Pink Carnation', 'Unconditional maternal love and gratitude.', 'carnation', 'from-rose-300 to-pink-500'),
('f0000000-0000-0000-0000-000000000008', 'Lavender Orchid', 'Refinement, elegance, and beauty.', 'orchid', 'from-purple-300 to-lavender-500');

-- Seed 4 Card Styles
INSERT INTO public.card_styles (id, name, css_theme) VALUES
('c0000000-0000-0000-0000-000000000001', 'Soft Botanical', '{"border": "border-emerald-600/20", "bg": "bg-emerald-500/5", "font": "font-serif", "text": "text-emerald-800 dark:text-emerald-300"}'),
('c0000000-0000-0000-0000-000000000002', 'Velvet Romance', '{"border": "border-rose-500/20", "bg": "bg-rose-500/5", "font": "font-serif", "text": "text-rose-800 dark:text-rose-300"}'),
('c0000000-0000-0000-0000-000000000003', 'Golden Luxe', '{"border": "border-amber-500/20", "bg": "bg-amber-500/5", "font": "font-sans", "text": "text-amber-800 dark:text-amber-300"}'),
('c0000000-0000-0000-0000-000000000004', 'Midnight Mystery', '{"border": "border-indigo-500/20", "bg": "bg-indigo-950/20 dark:bg-indigo-950/40", "font": "font-sans", "text": "text-indigo-900 dark:text-indigo-200"}');
