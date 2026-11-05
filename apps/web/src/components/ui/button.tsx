import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-b from-accent to-accent-strong shadow-[0_1px_3px_rgba(221,126,3,.4)] hover:brightness-105 active:translate-y-px",
  secondary:
    "text-content bg-surface border border-border hover:bg-surface-2 hover:border-border-strong",
  ghost: "text-content-2 hover:bg-surface-3 hover:text-content",
  danger:
    "text-red bg-red-soft hover:brightness-105 border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-input",
  md: "h-[42px] px-4 text-sm gap-2 rounded-input",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-[filter,background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:shadow-ring disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
