import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  users: { email: string } | null;
}

async function getTenantId(): Promise<string> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single<{ tenant_id: string }>();

  if (!profile) redirect("/login");
  return profile.tenant_id;
}

async function getAuditLogs(tenantId: string): Promise<AuditLog[]> {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("audit_logs")
    .select(`
      id, admin_id, action, target_type,
      target_id, metadata, created_at,
      users ( email )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<AuditLog[]>();

  if (error || !data) return [];
  return data;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AuditLogsPage() {
  const tenantId = await getTenantId();
  const logs = await getAuditLogs(tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Audit Logs
        </h1>
        <p className="text-sm text-neutral-400">
          Last {logs.length} events — immutable record.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="flex items-center justify-center py-20 border border-neutral-100">
          <p className="text-sm text-neutral-400 uppercase tracking-widest">
            No audit events yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {["Time", "Admin", "Action", "Target", "Details"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] uppercase
                    tracking-widest text-neutral-400 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-neutral-50
                  hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-[10px] text-neutral-400 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {log.users?.email ?? log.admin_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 ${
                      log.action.includes("delete") ? "bg-red-50 text-red-600"
                      : log.action.includes("create") ? "bg-green-50 text-green-600"
                      : log.action.includes("restore") ? "bg-blue-50 text-blue-600"
                      : "bg-neutral-100 text-neutral-600"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {log.target_type}/{log.target_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-neutral-400 font-mono
                    max-w-[200px] truncate">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}