import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, mono, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // Editável "acende": fundo branco + borda firme. Somente-leitura/desabilitado ficam no
        // cinza, com texto apagado — antes só o texto mudava e a diferença era imperceptível
        //.
        "h-11 w-full rounded-input border border-border-strong bg-surface px-3.5 text-sm text-content transition-[border-color,box-shadow] duration-150 placeholder:text-content-3 focus:border-accent focus:outline-none focus:shadow-ring",
        "read-only:cursor-default read-only:border-border read-only:bg-surface-3 read-only:text-content-3 read-only:shadow-none",
        "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-3 disabled:text-content-3",
        mono && "font-mono",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/** Campo com ícone à esquerda (busca). */
export function InputWithIcon({
  icon,
  className,
  wrapperClassName,
  ...props
}: InputProps & { icon: ReactNode; wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-3">
        {icon}
      </span>
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  );
}
