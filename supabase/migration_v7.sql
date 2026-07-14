-- Migration v7: Shared Canvas Tool Extensions

-- Alter canvas_strokes to support shapes, stamps, and text types
ALTER TABLE public.canvas_strokes ADD COLUMN IF NOT EXISTS type text DEFAULT 'stroke' NOT NULL; 
-- 'stroke' | 'shape' | 'stamp' | 'text'

ALTER TABLE public.canvas_strokes ADD COLUMN IF NOT EXISTS shape_type text; 
-- 'circle' | 'rect' | 'line' | 'arrow', null for others

ALTER TABLE public.canvas_strokes ADD COLUMN IF NOT EXISTS text_content text; 
-- for text type only, holds the written note
