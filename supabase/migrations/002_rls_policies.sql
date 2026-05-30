-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTION: get authenticated user role
-- SECURITY: reads from public.users — never trusts JWT claims
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- =============================================
-- USERS
-- =============================================

-- Users can read their own row only
CREATE POLICY users_select_own
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Admins can read all users
CREATE POLICY users_select_admin
  ON public.users
  FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Users can update their own row
-- Role column is excluded from self-update via app-layer enforcement
CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can update any user (e.g. role changes)
CREATE POLICY users_update_admin
  ON public.users
  FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- Insert handled by trigger on auth.users — no direct insert policy needed
-- Admins only for direct inserts
CREATE POLICY users_insert_admin
  ON public.users
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- No delete policy — users are never deleted directly
-- Cascade from auth.users handles cleanup

-- =============================================
-- PRODUCTS
-- =============================================

-- Anyone can read non-deleted products
CREATE POLICY products_select_public
  ON public.products
  FOR SELECT
  USING (deleted_at IS NULL);

-- Admins can read all products including soft-deleted
CREATE POLICY products_select_admin
  ON public.products
  FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Only admins can insert products
CREATE POLICY products_insert_admin
  ON public.products
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admins can update products
CREATE POLICY products_update_admin
  ON public.products
  FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admins can hard-delete (soft delete is an update)
CREATE POLICY products_delete_admin
  ON public.products
  FOR DELETE
  USING (public.get_user_role() = 'admin');

-- =============================================
-- PRODUCT VARIANTS
-- =============================================

-- Anyone can read variants of non-deleted products
CREATE POLICY variants_select_public
  ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.deleted_at IS NULL
    )
  );

-- Admins can read all variants
CREATE POLICY variants_select_admin
  ON public.product_variants
  FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Only admins can mutate variants
CREATE POLICY variants_insert_admin
  ON public.product_variants
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY variants_update_admin
  ON public.product_variants
  FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY variants_delete_admin
  ON public.product_variants
  FOR DELETE
  USING (public.get_user_role() = 'admin');

-- =============================================
-- PRODUCT IMAGES
-- =============================================

-- Anyone can read images of non-deleted products
CREATE POLICY images_select_public
  ON public.product_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_id
        AND p.deleted_at IS NULL
    )
  );

-- Admins can read all images
CREATE POLICY images_select_admin
  ON public.product_images
  FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Only admins can mutate images
CREATE POLICY images_insert_admin
  ON public.product_images
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY images_update_admin
  ON public.product_images
  FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY images_delete_admin
  ON public.product_images
  FOR DELETE
  USING (public.get_user_role() = 'admin');

-- =============================================
-- CART ITEMS
-- SECURITY: All queries filtered by auth.uid()
-- Prevents IDOR — users can never access other users' carts
-- =============================================

-- Users can only read their own cart items
CREATE POLICY cart_select_own
  ON public.cart_items
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert into their own cart
CREATE POLICY cart_insert_own
  ON public.cart_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own cart items
CREATE POLICY cart_update_own
  ON public.cart_items
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own cart items
CREATE POLICY cart_delete_own
  ON public.cart_items
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins can read all cart items (support/analytics)
CREATE POLICY cart_select_admin
  ON public.cart_items
  FOR SELECT
  USING (public.get_user_role() = 'admin');

-- =============================================
-- AUDIT LOGS
-- SECURITY: Append-only for admins — no update/delete ever
-- =============================================

-- Only admins can read audit logs
CREATE POLICY audit_select_admin
  ON public.audit_logs
  FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Only admins can insert audit logs
-- No UPDATE or DELETE policies — audit logs are immutable
CREATE POLICY audit_insert_admin
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');