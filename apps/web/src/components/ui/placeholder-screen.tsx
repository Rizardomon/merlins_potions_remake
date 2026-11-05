import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <EmptyState
      icon={<Construction className="h-9 w-9" strokeWidth={1.5} />}
      title={title}
      description="Tela em construção."
      className="min-h-[60vh]"
    />
  );
}
