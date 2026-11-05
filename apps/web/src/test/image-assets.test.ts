import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const SEED_IMAGES = [
  "/products/aging-potion.png",
  "/products/bulgeye-potion.png",
  "/products/dragon-tonic.png",
  "/products/love-potion.png",
  "/products/polyjuice-potion.png",
  "/products/sleeping-draught.png",
];

const PUBLIC_DIR = join(process.cwd(), "public");

describe("image assets consistency", () => {
  it("every seed image path resolves to an existing file in public/", () => {
    for (const imagePath of SEED_IMAGES) {
      const fullPath = join(PUBLIC_DIR, imagePath);
      expect(existsSync(fullPath), `Missing: ${imagePath}`).toBe(true);
    }
  });

  it("no seed potion is missing an image", () => {
    const missing = SEED_IMAGES.filter(
      (p) => !existsSync(join(PUBLIC_DIR, p))
    );
    expect(missing).toHaveLength(0);
  });

  it("all 6 potions have image entries", () => {
    expect(SEED_IMAGES).toHaveLength(6);
  });
});
