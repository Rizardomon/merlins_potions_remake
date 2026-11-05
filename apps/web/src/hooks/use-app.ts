import { useQuery } from "@tanstack/react-query";
import { listPotions } from "@/lib/api/product-repository";

export const queryKeys = {
  potions: ["potions"] as const,
};

export function usePotions() {
  return useQuery({
    queryKey: queryKeys.potions,
    queryFn: listPotions,
  });
}
