import { forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", loading = false, className, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        className={clsx(
          "relative w-full px-6 py-3.5 text-xs font-medium uppercase tracking-widest",
          "transition-all duration-150 focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "primary" && [
            "bg-neutral-900 text-white",
            "hover:bg-neutral-700",
            "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2",
          ],
          variant === "ghost" && [
            "border border-neutral-300 bg-transparent text-neutral-900",
            "hover:border-neutral-900",
            "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2",
          ],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Please wait</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };