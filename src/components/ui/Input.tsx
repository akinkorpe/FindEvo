import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  sizeVariant?: "sm" | "md" | "lg";
}

const sizeCls = {
  sm: "h-9 text-xs",
  md: "h-11 text-sm",
  lg: "h-14 text-base",
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { leftIcon, rightSlot, sizeVariant = "md", className = "", ...rest },
  ref,
) {
  return (
    <div
      className={`flex items-center rounded-xl border border-ink-200 bg-white px-3 shadow-card ${sizeCls[sizeVariant]} ${className}`}
    >
      {leftIcon && <span className="text-ink-400 mr-2 shrink-0">{leftIcon}</span>}
      <input
        ref={ref}
        className="flex-1 bg-transparent outline-none placeholder:text-ink-400"
        {...rest}
      />
      {rightSlot && <div className="ml-2 shrink-0">{rightSlot}</div>}
    </div>
  );
});
