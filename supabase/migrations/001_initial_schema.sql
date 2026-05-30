-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS
-- =============================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role  ON public.users(role);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE public.products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  slug        TEXT NOT NULL UNIQUE
                CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  category    TEXT NOT NULL CHECK (char_length(category) BETWEEN 1 AND 100),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  model_url   TEXT CHECK (model_url IS NULL OR char_length(model_url) <= 2048),
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug       ON public.products(slug);
CREATE INDEX idx_products_category   ON public.products(category);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_deleted_at ON public.products(deleted_at)
  WHERE deleted_at IS NULL;

-- =============================================
-- PRODUCT VARIANTS
-- =============================================
CREATE TABLE public.product_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size        TEXT NOT NULL CHECK (char_length(size) BETWEEN 1 AND 20),
  color       TEXT NOT NULL CHECK (char_length(color) BETWEEN 1 AND 50),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product_id ON public.product_variants(product_id);

-- =============================================
-- PRODUCT IMAGES
-- =============================================
CREATE TABLE public.product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL CHECK (char_length(url) BETWEEN 1 AND 2048),
  alt         TEXT NOT NULL DEFAULT '' CHECK (char_length(alt) <= 255),
  position    INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_images_position   ON public.product_images(product_id, position);

-- =============================================
-- CART ITEMS
-- =============================================
CREATE TABLE public.cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  variant_id  UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 99),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, variant_id)
);

CREATE INDEX idx_cart_user_id    ON public.cart_items(user_id);
CREATE INDEX idx_cart_variant_id ON public.cart_items(variant_id);

-- =============================================
-- AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action      TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  target_type TEXT NOT NULL CHECK (char_length(target_type) BETWEEN 1 AND 50),
  target_id   TEXT NOT NULL CHECK (char_length(target_id) BETWEEN 1 AND 255),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin_id    ON public.audit_logs(admin_id);
CREATE INDEX idx_audit_action      ON public.audit_logs(action);
CREATE INDEX idx_audit_target      ON public.audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created_at  ON public.audit_logs(created_at DESC);