-- Create usernames table
CREATE TABLE public.usernames (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add indexes
CREATE INDEX idx_usernames_name ON public.usernames (name);
CREATE INDEX idx_usernames_username ON public.usernames (username);
-- Enable Row Level Security
ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;
-- Create policies (allow all operations for authenticated users)
CREATE POLICY "usernames_select_all" ON public.usernames FOR
SELECT USING (true);
CREATE POLICY "usernames_insert_all" ON public.usernames FOR
INSERT WITH CHECK (true);
CREATE POLICY "usernames_update_all" ON public.usernames FOR
UPDATE USING (true);
CREATE POLICY "usernames_delete_all" ON public.usernames FOR DELETE USING (true);
-- Add trigger for updated_at
CREATE TRIGGER update_usernames_updated_at BEFORE
UPDATE ON public.usernames FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Add comment
COMMENT ON TABLE public.usernames IS 'General username management table for storing name and username pairs';