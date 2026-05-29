import { clsx } from "clsx";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

const sizeMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  full: "max-w-none",
} as const;

export function Container({
  children,
  className,
  size = "lg",
}: ContainerProps) {
  return (
    <div
      className={clsx(
        "mx-auto w-full px-6 lg:px-8",
        sizeMap[size],
        className,
      )}
    >
      {children}
    </div>
  );
}