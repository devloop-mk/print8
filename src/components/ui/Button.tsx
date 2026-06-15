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
        "inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-brand-600 text-white hover:bg-brand-700": variant === "primary",
          "bg-ink-100 text-ink-900 hover:bg-ink-200": variant === "secondary",
          "border border-ink-300 bg-white text-ink-700 hover:bg-ink-50":
            variant === "outline",
          "text-ink-600 hover:bg-ink-50": variant === "ghost",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
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
