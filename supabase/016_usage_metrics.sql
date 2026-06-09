-- =============================================
-- TENANT USAGE METRICS
-- Lightweight daily rollup table.
-- Incremented by API routes and order events.
-- Used by platform admin dashboard.
-- =============================================

CREATE TABLE public.tenant_usage_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id)
                  ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  api_requests  INTEGER NOT NULL DEFAULT 0,
  page_views    INTEGER NOT NULL DEFAULT 0,
  orders_placed INTEGER NOT NULL DEFAULT 0,
  revenue_kes   NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, date)
);

CREATE INDEX idx_usage_metrics_tenant_date
  ON public.tenant_usage_metrics(tenant_id, date DESC);

CREATE INDEX idx_usage_metrics_date
  ON public.tenant_usage_metrics(date DESC);

ALTER TABLE public.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Tenant admins can see their own metrics
CREATE POLICY usage_metrics_select_admin
  ON public.tenant_usage_metrics
  FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'platform_admin')
    AND (
      tenant_id = (
        SELECT tenant_id FROM public.users
        WHERE id = auth.uid()
      )
      OR public.get_user_role() = 'platform_admin'
    )
  );

-- Only service role can insert/update
-- (done via admin client in API routes)

-- =============================================
-- FUNCTION: increment_usage
-- Upserts daily metric row and increments counters.
-- Safe for concurrent calls.
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_tenant_usage(
  p_tenant_id     UUID,
  p_api_requests  INTEGER DEFAULT 0,
  p_page_views    INTEGER DEFAULT 0,
  p_orders_placed INTEGER DEFAULT 0,
  p_revenue_kes   NUMERIC DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenant_usage_metrics (
    tenant_id, date,
    api_requests, page_views, orders_placed, revenue_kes
  ) VALUES (
    p_tenant_id, CURRENT_DATE,
    p_api_requests, p_page_views, p_orders_placed, p_revenue_kes
  )
  ON CONFLICT (tenant_id, date) DO UPDATE SET
    api_requests  = tenant_usage_metrics.api_requests  + p_api_requests,
    page_views    = tenant_usage_metrics.page_views    + p_page_views,
    orders_placed = tenant_usage_metrics.orders_placed + p_orders_placed,
    revenue_kes   = tenant_usage_metrics.revenue_kes   + p_revenue_kes;
END;
$$;

-- Seed today's row for ShoePalace
INSERT INTO public.tenant_usage_metrics (tenant_id, date)
VALUES ('00000000-0000-0000-0000-000000000010', CURRENT_DATE)
ON CONFLICT DO NOTHING;