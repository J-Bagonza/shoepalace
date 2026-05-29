import { clsx } from "clsx";

export function Divider({ className }: { className?: string }) {
  return (
    <hr className={clsx("border-0 border-t border-neutral-100", className)} />
  );
}