export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  tagline: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  instagram_url: string | null;
  whatsapp_number: string | null;
  shipping_info: string | null;
  returns_info: string | null;
  updated_at: string;
}

export interface TenantRequest {
  id: string;
  store_name: string;
  slug: string;
  owner_email: string;
  owner_name: string;
  phone: string | null;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantContext {
  tenant: Tenant;
  tenantId: string;
}

export const SHOEPALACE_TENANT_ID = "00000000-0000-0000-0000-000000000010";
export const SHOEPALACE_SLUG = "shoepalace";