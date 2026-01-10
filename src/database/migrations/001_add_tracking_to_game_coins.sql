-- Add tracking columns to game_coins table
ALTER TABLE game_coins
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance if we ever query by these (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_game_coins_last_edited_by ON game_coins(last_edited_by);
