import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      // Mesmo contraste editável × somente-leitura do `Input`.
      "min-h-[92px] w-full rounded-input border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-content transition-[border-color,box-shadow] duration-150 placeholder:text-content-3 focus:border-accent focus:outline-none focus:shadow-ring",
      "read-only:cursor-default read-only:border-border read-only:bg-surface-3 read-only:text-content-3 read-only:shadow-none",
      "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-3 disabled:text-content-3",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
