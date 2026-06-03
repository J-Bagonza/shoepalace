import { logger } from "./index";
import type { UserRole } from "@/types/user";

export type AuditAction =
  | "product.create"
  | "product.update"
  | "product.delete"
  | "product.restore"
  | "user.role_change"
  | "auth.login"
  | "auth.logout"
  | "auth.signup";

type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue };

interface AuditEntry {
  adminId: string;
  adminRole: UserRole;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, AuditMetadataValue>;
}

/**
 * Structured audit log for all admin and auth actions.
 * Never log sensitive field values in metadata.
 */
export function logAuditEvent(entry: AuditEntry): void {
  logger.info(
    {
      audit: true,
      adminId: entry.adminId,
      adminRole: entry.adminRole,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata ?? {},
    },
    `AUDIT: ${entry.action}`,
  );
}