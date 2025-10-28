-- Migration: Add low_stock_alert column to game_coins table
-- Run this in your Supabase SQL Editor

-- Add the low_stock_alert column to the game_coins table
ALTER TABLE public.game_coins
ADD COLUMN IF NOT EXISTS low_stock_alert INTEGER DEFAULT 10;

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.game_coins.low_stock_alert IS 'Custom low stock alert threshold - alerts when inventory falls below this number';

-- Create an index on the new column for better query performance
CREATE INDEX IF NOT EXISTS idx_game_coins_low_stock_alert ON public.game_coins (low_stock_alert);

-- Update existing records to have a default value of 10
UPDATE public.game_coins
SET low_stock_alert = 10
WHERE low_stock_alert IS NULL;

-- Make sure the column has a default value for future inserts
ALTER TABLE public.game_coins
ALTER COLUMN low_stock_alert SET DEFAULT 10;
