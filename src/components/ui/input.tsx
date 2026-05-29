import { forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-widest text-neutral-500"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900",
            "placeholder:text-neutral-400",
            "focus:border-neutral-900 focus:outline-none focus:ring-0",
            "transition-colors duration-150",
            error && "border-[#E8001D] focus:border-[#E8001D]",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[#E8001D]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };