-- Migration v10: Love Letter (Cat Edition) Schema

-- =====================================================================
-- 1. CREATE TABLES
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cat_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text DEFAULT 'image' NOT NULL, -- 'image' | 'gif'
  media_url text NOT NULL,
  category text NOT NULL, -- 'sleepy' | 'playful' | 'love' | 'silly'
  source_credit text
);

CREATE TABLE IF NOT EXISTS public.love_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id uuid REFERENCES public.pairs(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  recipient_name text DEFAULT '' NOT NULL,
  sender_name text DEFAULT '' NOT NULL,
  content jsonb NOT NULL, -- Array of blocks: [{type:'text', value:'...'}, {type:'cat', media_url:'...'}]
  envelope_style text DEFAULT 'classic' NOT NULL, -- classic, velvet, midnight, kraft
  is_opened boolean DEFAULT false NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  opened_at timestamptz
);

-- =====================================================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.cat_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.love_letters ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. RLS POLICIES
-- =====================================================================

-- cat_media: Read-only for authenticated users
CREATE POLICY "Allow authenticated users to select cat media"
  ON public.cat_media FOR SELECT USING (true);

-- love_letters
CREATE POLICY "Users can view love letters for their pair"
  ON public.love_letters FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = love_letters.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert love letters for their active pair"
  ON public.love_letters FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
        AND pairs.status = 'active'
    )
  );

CREATE POLICY "Users can update love letters for their pair"
  ON public.love_letters FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pairs
      WHERE pairs.id = love_letters.pair_id
        AND (pairs.user_a_id = auth.uid() OR pairs.user_b_id = auth.uid())
    )
  );

-- =====================================================================
-- 4. SEED CAT MEDIA DATA (8 Curated Unsplash Cat Photos)
-- =====================================================================

INSERT INTO public.cat_media (id, media_type, media_url, category, source_credit) VALUES
('e0000000-0000-0000-0000-000000000001', 'image', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500&q=80&fit=crop&auto=format', 'silly', 'Unsplash - Sunglasses Cat'),
('e0000000-0000-0000-0000-000000000002', 'image', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500&q=80&fit=crop&auto=format', 'silly', 'Unsplash - Orange Cat'),
('e0000000-0000-0000-0000-000000000003', 'image', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80&fit=crop&auto=format', 'sleepy', 'Unsplash - Sleeping Cat'),
('e0000000-0000-0000-0000-000000000004', 'image', 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=500&q=80&fit=crop&auto=format', 'sleepy', 'Unsplash - Nap Cat'),
('e0000000-0000-0000-0000-000000000005', 'image', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500&q=80&fit=crop&auto=format', 'playful', 'Unsplash - Playful Orange'),
('e0000000-0000-0000-0000-000000000006', 'image', 'https://images.unsplash.com/photo-1513360309081-36f5e878fc9e?w=500&q=80&fit=crop&auto=format', 'playful', 'Unsplash - Yarn Cat'),
('e0000000-0000-0000-0000-000000000007', 'image', 'https://images.unsplash.com/photo-1535268647977-a403b69fc757?w=500&q=80&fit=crop&auto=format', 'love', 'Unsplash - Snuggling Cats'),
('e0000000-0000-0000-0000-000000000008', 'image', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80&fit=crop&auto=format', 'love', 'Unsplash - Kitten Love');
