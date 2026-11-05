import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-[12px]",
  lg: "h-12 w-12 text-[15px]",
} as const;

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white",
        "bg-gradient-to-br from-[#FBBA5C] to-[#E07A05] shadow-[inset_0_1px_1px_rgba(255,255,255,.4)]",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
