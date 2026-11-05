import { z } from "zod";
import type { BagLine } from "./types";
import type { Potion } from "@merlins-potions-remake/shared";

const STORAGE_KEY = "mp.bag.v1";

const PersistedLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

const PersistedBagSchema = z.array(PersistedLineSchema);

type PersistedLine = z.infer<typeof PersistedLineSchema>;

export function loadFromStorage(): PersistedLine[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return PersistedBagSchema.parse(JSON.parse(raw));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveToStorage(lines: BagLine[]): void {
  const persisted: PersistedLine[] = lines.map((l) => ({
    productId: l.product.id,
    quantity: l.quantity,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

export function rehydrateLines(persisted: PersistedLine[], catalog: Potion[]): BagLine[] {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return persisted.flatMap((entry) => {
    const product = byId.get(entry.productId);
    if (!product) return [];
    return [{ product, quantity: entry.quantity }];
  });
}
