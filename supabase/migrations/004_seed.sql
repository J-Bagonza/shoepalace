-- =============================================
-- SEED DATA
-- Only runs in development/staging environments
-- =============================================

DO $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'Seed data must not be run in production.';
  END IF;
END;
$$;

-- =============================================
-- ADMIN USER
-- Password set via Supabase Auth — this only
-- creates the profile row with admin role.
-- Replace the UUID after creating the auth user.
-- =============================================

INSERT INTO public.users (id, email, role)
VALUES (
  'db797e07-cd1b-4432-a07a-3cda7ab7df83',
  'adminOhms@shoepalace.dev',
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PRODUCTS
-- =============================================

INSERT INTO public.products (id, name, slug, description, price, category, is_featured)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Apex Runner Pro',
    'apex-runner-pro',
    'A precision-engineered performance runner built for speed and endurance. Lightweight carbon fiber midsole with adaptive cushioning.',
    249.99,
    'running',
    TRUE
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Court Classic Low',
    'court-classic-low',
    'Timeless low-top silhouette with premium full-grain leather upper. A wardrobe essential refined for modern wear.',
    189.99,
    'lifestyle',
    TRUE
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Urban Hiker GTX',
    'urban-hiker-gtx',
    'Waterproof Gore-Tex construction meets urban design. Built for city commutes and weekend trail crossovers.',
    319.99,
    'hiking',
    FALSE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Stealth Low OG',
    'stealth-low-og',
    'Stripped back. No distractions. The original silhouette rebuilt with premium suede and tonal sole.',
    159.99,
    'lifestyle',
    FALSE
  );

-- =============================================
-- PRODUCT VARIANTS
-- =============================================

INSERT INTO public.product_variants (id, product_id, size, color, stock)
VALUES
  -- Apex Runner Pro
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'UK 7',  'Black', 12),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '11111111-1111-1111-1111-111111111111', 'UK 8',  'Black', 8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '11111111-1111-1111-1111-111111111111', 'UK 9',  'Black', 5),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '11111111-1111-1111-1111-111111111111', 'UK 10', 'Black', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '11111111-1111-1111-1111-111111111111', 'UK 7',  'White', 10),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', '11111111-1111-1111-1111-111111111111', 'UK 8',  'White', 7),

  -- Court Classic Low
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbba', '22222222-2222-2222-2222-222222222222', 'UK 7',  'White', 15),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'UK 8',  'White', 10),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', 'UK 9',  'White', 8),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '22222222-2222-2222-2222-222222222222', 'UK 10', 'Cream', 6),

  -- Urban Hiker GTX
  ('cccccccc-cccc-cccc-cccc-ccccccccccca', '33333333-3333-3333-3333-333333333333', 'UK 7',  'Olive', 9),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '33333333-3333-3333-3333-333333333333', 'UK 8',  'Olive', 6),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '33333333-3333-3333-3333-333333333333', 'UK 9',  'Black', 4),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '33333333-3333-3333-3333-333333333333', 'UK 10', 'Black', 2),

  -- Stealth Low OG
  ('dddddddd-dddd-dddd-dddd-ddddddddddda', '44444444-4444-4444-4444-444444444444', 'UK 7',  'Grey',  20),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '44444444-4444-4444-4444-444444444444', 'UK 8',  'Grey',  15),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', '44444444-4444-4444-4444-444444444444', 'UK 9',  'Black', 12),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd3', '44444444-4444-4444-4444-444444444444', 'UK 10', 'Black', 8);

-- =============================================
-- PRODUCT IMAGES
-- Placeholder URLs — replace with real
-- Supabase Storage URLs after uploads
-- =============================================

INSERT INTO public.product_images (product_id, url, alt, position)
VALUES
  ('11111111-1111-1111-1111-111111111111', '/images/apex-runner-pro-1.jpg', 'Apex Runner Pro side view',  0),
  ('11111111-1111-1111-1111-111111111111', '/images/apex-runner-pro-2.jpg', 'Apex Runner Pro top view',   1),
  ('22222222-2222-2222-2222-222222222222', '/images/court-classic-low-1.jpg', 'Court Classic Low side view', 0),
  ('22222222-2222-2222-2222-222222222222', '/images/court-classic-low-2.jpg', 'Court Classic Low back view', 1),
  ('33333333-3333-3333-3333-333333333333', '/images/urban-hiker-gtx-1.jpg', 'Urban Hiker GTX side view',  0),
  ('33333333-3333-3333-3333-333333333333', '/images/urban-hiker-gtx-2.jpg', 'Urban Hiker GTX sole view',  1),
  ('44444444-4444-4444-4444-444444444444', '/images/stealth-low-og-1.jpg', 'Stealth Low OG side view',   0),
  ('44444444-4444-4444-4444-444444444444', '/images/stealth-low-og-2.jpg', 'Stealth Low OG top view',    1);