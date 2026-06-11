"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { StoreIdentityForm } from "./store-identity-form";
import { ContactSettingsForm } from "./contact-settings-form";
import { PageEditor } from "./page-editor";
import { CategoriesForm } from "./categories-form";
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
  { id: "categories", label: "Categories" },
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
      {/* Tab bar — horizontally scrollable on mobile */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-0 border-b border-neutral-100
          min-w-max lg:min-w-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "relative px-3 lg:px-5 py-3 text-[11px] lg:text-xs",
                "uppercase tracking-widest whitespace-nowrap shrink-0",
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
      </div>

      {/* Tab content */}
      <div className="max-w-2xl w-full">
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
        {activeTab === "categories" && (
          <CategoriesForm />
        )}
        {activeTab === "email" && (
          <EmailSettingsPanel />
        )}
      </div>
    </div>
  );
}