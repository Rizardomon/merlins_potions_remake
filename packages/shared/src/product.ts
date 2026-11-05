import { z } from "zod";

export const PotionSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().min(1).max(6),
  name: z.string().min(1).max(120),
  priceCents: z.number().int().positive(),
  tint: z.string(),
  effect: z.string().min(1),
  ingredients: z.array(z.string().min(1)).min(1),
  image: z.string(),
});

export type Potion = z.infer<typeof PotionSchema>;

export const PotionListSchema = z.array(PotionSchema);
export type PotionList = z.infer<typeof PotionListSchema>;
