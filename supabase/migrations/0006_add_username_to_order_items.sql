-- Add username column to order_items table
ALTER TABLE public.order_items
ADD COLUMN username TEXT;
-- Add comment to explain the column
COMMENT ON COLUMN public.order_items.username IS 'Customer username for the platform, used for order fulfillment';