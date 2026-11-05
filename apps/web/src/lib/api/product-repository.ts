import { PotionListSchema, type PotionList } from "@merlins-potions-remake/shared";

export async function listPotions(): Promise<PotionList> {
  const res = await fetch("/api/products", { cache: "no-store" });
  if (!res.ok) return [];
  const raw = await res.json().catch(() => null);
  const result = PotionListSchema.safeParse(raw);
  if (!result.success) {
    console.error("[product-repository] Zod validation failed:", result.error);
    return [];
  }
  return result.data;
}
