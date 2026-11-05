import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * `stickyHeader`: o `<thead>` gruda no topo enquanto as linhas rolam. O scroll é o do
 * `<main>` (ver `app-shell`), então o wrapper **não pode** ter `overflow` — qualquer overflow vira
 * um container de rolagem e o sticky passaria a se ancorar nele (inútil, pois ele não rola no eixo
 * vertical). Por isso o modo sticky abre mão do scroll horizontal interno.
 */
export function Table({
  className,
  stickyHeader,
  ...props
}: HTMLAttributes<HTMLTableElement> & { stickyHeader?: boolean }) {
  return (
    <div className={cn("w-full", !stickyHeader && "overflow-x-auto")}>
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({
  className,
  sticky,
  ...props
}: HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }) {
  return (
    <thead
      className={cn("bg-surface-2", sticky && "sticky top-0 z-10", className)}
      {...props}
    />
  );
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR({
  className,
  clickable,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors last:border-0",
        clickable && "cursor-pointer hover:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[.05em] text-content-3 whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 align-middle text-content", className)} {...props} />
  );
}
