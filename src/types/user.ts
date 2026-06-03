export type UserRole = "customer" | "admin" | "platform_admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}