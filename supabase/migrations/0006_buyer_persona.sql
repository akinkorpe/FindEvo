-- Add buyer_persona to products. Captured from site analysis ("who is the
-- BUYER for this product?") and fed into the scoring prompt so the model
-- doesn't mistake creator-side posts for buyer signals on consumer products.

alter table public.products
  add column if not exists buyer_persona text;
