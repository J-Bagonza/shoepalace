import { fetchAllPages } from "@/lib/pages/fetch-page";
import { withRateLimit } from "@/lib/security/with-rate-limit";
import { requireAuth } from "@/lib/security/with-auth";
import { createRequestLogger } from "@/lib/logger/request-logger";
import type { ApiResponse } from "@/types/api";
import type { CmsPage } from "@/types/page";

async function handler(req: Request): Promise<Response> {
  const { log, requestId } = createRequestLogger(req);

  const auth = await requireAuth(req, "admin");
  if (auth instanceof Response) return auth;

  const pages = await fetchAllPages(auth.tenantId);

  log.info(
    { requestId, event: "admin.pages.list", count: pages.length },
    "Pages fetched",
  );

  const body: ApiResponse<CmsPage[]> = {
    data: pages,
    error: null,
    status: 200,
  };
  return Response.json(body, { status: 200 });
}

export const GET = withRateLimit("api", handler);