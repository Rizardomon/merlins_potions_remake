import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "green" | "red" | "accent";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  round?: boolean;
}

const tones: Record<Tone, string> = {
  neutral:
    "text-content-2 hover:bg-surface-3 hover:text-content border border-border",
  green: "text-green bg-green-soft hover:brightness-105 border border-transparent",
  red: "text-red bg-red-soft hover:brightness-105 border border-transparent",
  accent:
    "text-accent-text bg-accent-soft hover:brightness-105 border border-transparent",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone = "neutral", round, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center transition-[filter,background-color,color] duration-150 focus-visible:outline-none focus-visible:shadow-ring disabled:opacity-50 disabled:pointer-events-none",
        round ? "rounded-full" : "rounded-input",
        tones[tone],
        className,
      )}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";
