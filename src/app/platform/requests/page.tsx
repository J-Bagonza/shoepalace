import { fetchTenantRequests } from "@/lib/platform/fetch-platform-data";
import { RequestsTable } from "@/components/platform/requests-table";

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function PlatformRequestsPage({
  searchParams,
}: PageProps) {
  const status = (searchParams["status"] ?? "pending") as
    | "pending"
    | "approved"
    | "rejected";

  const requests = await fetchTenantRequests(status);

  const STATUS_TABS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-bebas text-4xl tracking-wide text-neutral-900">
          Store Requests
        </h1>
        <p className="text-sm text-neutral-400">
          Review and approve applications to join the platform.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/platform/requests?status=${tab.value}`}
            className={`px-4 py-2 text-xs uppercase tracking-widest
              border transition-colors ${
                status === tab.value
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-900"
              }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <RequestsTable requests={requests} status={status} />
    </div>
  );
}