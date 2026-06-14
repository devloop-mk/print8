import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 bg-white p-6 shadow-sm transition hover:shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
