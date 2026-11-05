import type { Potion } from "@merlins-potions-remake/shared";

export type SortKey = "featured" | "asc" | "desc";

export function filterPotions(potions: Potion[], query: string): Potion[] {
  const q = query.trim().toLowerCase();
  if (!q) return potions;
  return potions.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.ingredients.some((i) => i.toLowerCase().includes(q))
  );
}

export function sortPotions(potions: Potion[], sort: SortKey): Potion[] {
  const copy = [...potions];
  if (sort === "asc") return copy.sort((a, b) => a.priceCents - b.priceCents);
  if (sort === "desc") return copy.sort((a, b) => b.priceCents - a.priceCents);
  return copy.sort((a, b) => a.number - b.number);
}
