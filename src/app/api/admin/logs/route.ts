import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateQuery } from "@/lib/validations/request";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import { z } from "zod";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

const logsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().max(100).optional(),
  admin_id: z.string().uuid().optional(),
});

interface AuditLogRow {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  // SECURITY: admin only
  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const validation = validateQuery(req, logsQuerySchema);
  if (!validation.success) return validation.response;

  const { page, page_size, action, admin_id } = validation.data;
  const from = (page - 1) * page_size;
  const to = from + page_size - 1;

  const admin = createAdminSupabaseClient();

  let query = admin
    .from("audit_logs")
    .select("id, admin_id, action, target_type, target_id, metadata, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (action) {
    query = query.eq("action", action);
  }

  if (admin_id) {
    query = query.eq("admin_id", admin_id);
  }

  const { data, error, count } = await query.returns<AuditLogRow[]>();

  if (error) {
    log.error(
      { requestId, event: "admin.logs.error" },
      error.message,
    );
    const body: ApiResponse = {
      data: null,
      error: "Failed to fetch audit logs.",
      status: 500,
    };
    return Response.json(body, { status: 500 });
  }

  const total = count ?? 0;
  const result: PaginatedResponse<AuditLogRow> = {
    data: data ?? [],
    total,
    page,
    page_size,
    total_pages: Math.ceil(total / page_size),
  };

  log.info(
    { requestId, event: "admin.logs.success", total },
    "Audit logs fetched",
  );

  const body: ApiResponse<PaginatedResponse<AuditLogRow>> = {
    data: result,
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);