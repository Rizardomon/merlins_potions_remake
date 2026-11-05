import type { Potion } from "@merlins-potions-remake/shared";

export interface BagLine {
  product: Potion;
  quantity: number;
}

export interface BagState {
  lines: BagLine[];
  hydrated: boolean;
}

export type BagAction =
  | { type: "add"; payload: { product: Potion; quantity?: number } }
  | { type: "setQuantity"; payload: { productId: string; quantity: number } }
  | { type: "remove"; payload: { productId: string } }
  | { type: "clear" }
  | { type: "hydrate"; payload: { lines: BagLine[] } };
