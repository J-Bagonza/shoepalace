-- =============================================
-- UPDATED_AT AUTO-UPDATE TRIGGER
-- Applies to all tables with updated_at column
-- =============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach to all tables with updated_at
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_cart_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- Fires when Supabase creates a new auth.users row
-- SECURITY: role is hardcoded to 'customer' — never taken from metadata
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PREVENT ROLE SELF-ESCALATION
-- Blocks any update that changes role unless
-- the executing DB user is the service role
-- =============================================

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to change roles (admin operations)
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block role changes for all other callers
  IF NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'Role changes are not permitted via this operation.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- =============================================
-- SOFT DELETE GUARD
-- Prevents hard DELETE on products table
-- Forces use of soft delete (deleted_at) instead
-- =============================================

CREATE OR REPLACE FUNCTION public.prevent_product_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION
    'Hard delete on products is not allowed. Set deleted_at instead.';
END;
$$;

CREATE TRIGGER trg_prevent_product_hard_delete
  BEFORE DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.prevent_product_hard_delete();

-- =============================================
-- AUDIT LOG AUTO-INSERT TRIGGER
-- Automatically writes to audit_logs on
-- product INSERT / UPDATE / soft DELETE
-- =============================================

CREATE OR REPLACE FUNCTION public.log_product_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action     TEXT;
  v_admin_id   UUID;
  v_metadata   JSONB;
BEGIN
  -- Resolve action type
  IF TG_OP = 'INSERT' THEN
    v_action   := 'product.create';
    v_metadata := jsonb_build_object(
      'name',  NEW.name,
      'slug',  NEW.slug,
      'price', NEW.price
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Distinguish soft delete from regular update
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'product.delete';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_action := 'product.restore';
    ELSE
      v_action := 'product.update';
    END IF;

    v_metadata := jsonb_build_object(
      'name',       NEW.name,
      'slug',       NEW.slug,
      'price',      NEW.price,
      'deleted_at', NEW.deleted_at
    );
  END IF;

  -- Resolve admin performing the action
  -- Falls back to system if called outside user session
  v_admin_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  INSERT INTO public.audit_logs (
    admin_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    v_admin_id,
    v_action,
    'product',
    NEW.id::TEXT,
    v_metadata
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_product_changes
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_product_changes();

-- =============================================
-- CART QUANTITY GUARD
-- Prevents cart quantity exceeding stock
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_cart_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT stock INTO v_stock
  FROM public.product_variants
  WHERE id = NEW.variant_id;

  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Variant not found.';
  END IF;

  IF NEW.quantity > v_stock THEN
    RAISE EXCEPTION
      'Requested quantity (%) exceeds available stock (%).',
      NEW.quantity, v_stock;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_cart_quantity
  BEFORE INSERT OR UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_cart_quantity();