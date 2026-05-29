import { clsx } from "clsx";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section
      id={id}
      className={clsx("py-16 md:py-24 lg:py-32", className)}
    >
      {children}
    </section>
  );
}