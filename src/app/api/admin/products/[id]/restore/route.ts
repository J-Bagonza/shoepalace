import { withRateLimit } from "@/lib/security/with-rate-limit";
import { restoreHandler } from "../route";

export const PATCH = withRateLimit("api", restoreHandler);