import { Injectable } from "@nestjs/common";

export interface PotionRow {
  id: string;
  number: number;
  name: string;
  priceCents: number;
  tint: string;
  effect: string;
  ingredients: string[];
  image: string;
}

@Injectable()
export class ProductRepository {
  private readonly rows: PotionRow[] = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      number: 1,
      name: "Aging Potion",
      priceCents: 1299,
      tint: "#E9E1F1",
      effect: "Ages the drinker by several decades for a short period.",
      ingredients: ["Newt tail", "Old boot", "Wrinkle weed", "Grey hair"],
      image: "/products/aging-potion.png",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      number: 2,
      name: "Bulgeye Potion",
      priceCents: 999,
      tint: "#DDEBD9",
      effect: "Causes the drinker's eyes to bulge out dramatically.",
      ingredients: ["Frog eyes", "Billywig stings", "Spiders", "Leech juice"],
      image: "/products/bulgeye-potion.png",
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      number: 3,
      name: "Dragon Tonic",
      priceCents: 2499,
      tint: "#E6E2F3",
      effect: "Grants the drinker dragon-like strength and fire resistance.",
      ingredients: ["Dragon scales", "Firewhisky", "Ashwinder eggs", "Phoenix feather"],
      image: "/products/dragon-tonic.png",
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      number: 4,
      name: "Love Potion",
      priceCents: 1799,
      tint: "#F3DEDC",
      effect: "Causes powerful obsessive infatuation in the drinker.",
      ingredients: ["Rose thorns", "Powdered moonstone", "Pearl dust", "Peppermint"],
      image: "/products/love-potion.png",
    },
    {
      id: "55555555-5555-5555-5555-555555555555",
      number: 5,
      name: "Polyjuice Potion",
      priceCents: 3499,
      tint: "#E2EDD8",
      effect: "Allows the drinker to assume the form of another person.",
      ingredients: ["Lacewing flies", "Leeches", "Powdered bicorn horn", "Knotgrass", "Fluxweed", "Boomslang skin", "Hair of target"],
      image: "/products/polyjuice-potion.png",
    },
    {
      id: "66666666-6666-6666-6666-666666666666",
      number: 6,
      name: "Sleeping Draught",
      priceCents: 899,
      tint: "#DCE6F2",
      effect: "Induces a deep and dreamless sleep in the drinker.",
      ingredients: ["Valerian sprigs", "Flobberworm mucus", "Lavender", "Wiggentree bark"],
      image: "/products/sleeping-draught.png",
    },
  ];

  async findAll(): Promise<PotionRow[]> {
    return [...this.rows].sort((a, b) => a.number - b.number);
  }

  async findById(id: string): Promise<PotionRow | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }
}
