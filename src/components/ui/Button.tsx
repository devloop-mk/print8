import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg border-2 font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50",
        {
          "border-brand-800 bg-gradient-to-r from-brand-600 to-brand-700 text-white hover:from-brand-500 hover:to-brand-600":
            variant === "primary",
          "border-ink-300 bg-ink-100 text-ink-900 hover:bg-ink-200":
            variant === "secondary",
          "border-ink-300 bg-white text-ink-800 hover:border-brand-400 hover:bg-brand-50":
            variant === "outline",
          "border-transparent text-ink-600 hover:bg-ink-100/80": variant === "ghost",
          "px-3 py-1.5 text-xs": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-sm": size === "lg",
        },
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Spinner
          size={size === "lg" ? "md" : "sm"}
          className={cn(children ? "mr-2" : undefined)}
        />
      ) : null}
      {children}
    </button>
  );
}
