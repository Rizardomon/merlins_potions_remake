"use client";

import Image from "next/image";
import type { Potion } from "@merlins-potions-remake/shared";
import { useBag } from "@/lib/bag/provider";

interface PotionCardProps {
  potion: Potion;
  onSelect: (potion: Potion) => void;
}

function formatPrice(cents: number): string {
  return `US$ ${(cents / 100).toFixed(2)}`;
}

export function PotionCard({ potion, onSelect }: PotionCardProps) {
  const { dispatch } = useBag();

  function handleAddToBag(e: React.MouseEvent) {
    e.stopPropagation();
    dispatch({ type: "add", payload: { product: potion, quantity: 1 } });
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`View details for ${potion.name}`}
      onClick={() => onSelect(potion)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(potion);
      }}
      className="cursor-pointer flex flex-col rounded-[20px] overflow-hidden transition-[transform,box-shadow] duration-[250ms] ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(31,26,38,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      style={{ backgroundColor: potion.tint }}
    >
      {/* Image */}
      <div className="relative aspect-square flex items-center justify-center p-7">
        <span className="absolute top-[18px] left-5 font-mono text-xs tracking-[0.08em] text-[var(--text-2)]">
          No. {String(potion.number).padStart(2, "0")}
        </span>
        <Image
          src={potion.image}
          alt={potion.name}
          width={240}
          height={240}
          className="max-w-[78%] max-h-full w-auto h-auto object-contain drop-shadow-[0_16px_18px_rgba(31,26,38,0.18)]"
        />
      </div>

      {/* Content */}
      <div className="px-5 pb-5 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[28px] leading-[1.1] text-[var(--text)]">
            {potion.name}
          </h3>
          <span className="font-mono text-[15px] font-medium whitespace-nowrap text-[var(--text)]">
            {formatPrice(potion.priceCents)}
          </span>
        </div>

        <p className="text-sm leading-[1.45] text-[var(--text-2)]">{potion.effect}</p>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[13px] text-[var(--text-2)]">
            {potion.ingredients.length} ingredient{potion.ingredients.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleAddToBag}
            aria-label={`Add ${potion.name} to bag`}
            className="h-9 px-4 rounded-full bg-[var(--text)] text-[var(--bg)] text-[13px] font-medium hover:bg-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
          >
            Add to bag
          </button>
        </div>
      </div>
    </article>
  );
}
