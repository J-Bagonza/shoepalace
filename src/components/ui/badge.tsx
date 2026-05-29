import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "red" | "outline";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-widest font-medium",
        variant === "default" && "bg-neutral-100 text-neutral-600",
        variant === "red" && "bg-[#E8001D] text-white",
        variant === "outline" &&
          "border border-neutral-200 text-neutral-600",
        className,
      )}
    >
      {children}
    </span>
  );
}