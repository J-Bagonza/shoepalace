"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { StoreIdentityForm } from "./store-identity-form";
import { ContactSettingsForm } from "./contact-settings-form";
import { PageEditor } from "./page-editor";
import { PaymentSettingsForm } from "./payment-settings-form";
import { EmailSettingsPanel } from "./email-settings-panel";
import type { Tenant, TenantSettings } from "@/types/tenant";
import type { CmsPage } from "@/types/page";

interface SettingsTabsProps {
  tenant: Tenant;
  settings: TenantSettings | null;
  pages: CmsPage[];
}

const TABS = [
  { id: "identity", label: "Store Identity" },
  { id: "contact", label: "Contact & Info" },
  { id: "pages", label: "Content Pages" },
  { id: "payment", label: "Payment" },
  { id: "email", label: "Email" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsTabs({
  tenant,
  settings,
  pages,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("identity");

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-neutral-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "relative px-5 py-3 text-xs uppercase tracking-widest",
              "transition-colors duration-150 focus-visible:outline-none",
              activeTab === tab.id
                ? "text-neutral-900"
                : "text-neutral-400 hover:text-neutral-600",
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px bg-neutral-900"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-2xl">
        {activeTab === "identity" && (
          <StoreIdentityForm tenant={tenant} />
        )}
        {activeTab === "contact" && (
          <ContactSettingsForm settings={settings} />
        )}
        {activeTab === "pages" && (
          <PageEditor pages={pages} />
        )}
        {activeTab === "payment" && (
          <PaymentSettingsForm />
        )}
        {activeTab === "email" && (
          <EmailSettingsPanel />
        )}
      </div>
    </div>
  );
}