import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300",
  secondary:
    "bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 disabled:opacity-60",
  ghost:
    "bg-transparent text-ink-700 hover:bg-ink-100 disabled:opacity-50",
  danger:
    "bg-danger-500 text-white hover:bg-red-600 disabled:bg-red-300",
};

const sizeCls: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-sm rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    leftIcon,
    rightIcon,
    loading,
    className = "",
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition ${variantCls[variant]} ${sizeCls[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});
