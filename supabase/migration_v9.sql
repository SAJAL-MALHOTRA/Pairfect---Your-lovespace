-- Migration v9: Extended Digital Bouquet Builder Columns

-- Add columns for full design alignment
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS greenery_type text DEFAULT 'Leafy' NOT NULL; -- Leafy, Fern, Eucalyptus, Willow
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'Classic Cream' NOT NULL;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS recipient_name text DEFAULT '' NOT NULL;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS sender_name text DEFAULT '' NOT NULL;
ALTER TABLE public.bouquets ADD COLUMN IF NOT EXISTS background_theme text DEFAULT 'Soft Blush' NOT NULL;

-- Drop NOT NULL constraint on card_style_id since card templates are stored as static strings
ALTER TABLE public.bouquets ALTER COLUMN card_style_id DROP NOT NULL;

-- Ensure flowers table has the 8 selected varieties from Screen 1
DELETE FROM public.flowers;

INSERT INTO public.flowers (id, name, meaning, icon_name, color_theme) VALUES
('f0000000-0000-0000-0000-000000000011', 'Rose', 'Love, passion, and deep affection.', 'rose', 'from-rose-500 to-red-600'),
('f0000000-0000-0000-0000-000000000012', 'Peony', 'Prosperity, good fortune, and honor.', 'peony', 'from-pink-400 to-rose-300'),
('f0000000-0000-0000-0000-000000000013', 'Tulip', 'Deep love, royalty, and respect.', 'tulip', 'from-purple-500 to-indigo-500'),
('f0000000-0000-0000-0000-000000000014', 'Daisy', 'Innocence, loyal love, and purity.', 'daisy', 'from-yellow-400 to-amber-500'),
('f0000000-0000-0000-0000-000000000015', 'Lily', 'Purity, rebirth, and devotion.', 'lily', 'from-stone-100 to-amber-50'),
('f0000000-0000-0000-0000-000000000016', 'Orchid', 'Exotic beauty, strength, and refinement.', 'orchid', 'from-purple-300 to-lavender-500'),
('f0000000-0000-0000-0000-000000000017', 'Camellia', 'Adoration, devotion, and loveliness.', 'camellia', 'from-rose-300 to-pink-500'),
('f0000000-0000-0000-0000-000000000018', 'Lotus', 'Spiritual enlightenment and resilience.', 'lotus', 'from-rose-400 to-pink-300');
