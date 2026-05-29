import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | ShoePalace",
    default: "ShoePalace",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}