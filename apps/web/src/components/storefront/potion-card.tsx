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
    dispatch({ type: "add", payload: { potion, quantity: 1 } });
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
      className="group cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      {/* Image area with tint */}
      <div
        className="relative h-48 flex items-center justify-center"
        style={{ backgroundColor: potion.tint }}
      >
        <span className="absolute top-3 left-3 text-xs font-mono font-semibold text-white/80 bg-black/20 rounded px-1.5 py-0.5">
          #{String(potion.number).padStart(2, "0")}
        </span>
        <Image
          src={`/products/${potion.image}`}
          alt={potion.name}
          width={120}
          height={120}
          className="object-contain drop-shadow-lg"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-[var(--text)] leading-tight">
            {potion.name}
          </h3>
          <span className="text-sm font-semibold text-[var(--accent)] shrink-0">
            {formatPrice(potion.priceCents)}
          </span>
        </div>

        <p className="text-xs text-[var(--text-2)] leading-relaxed line-clamp-2">
          {potion.effect}
        </p>

        <p className="text-xs text-[var(--text-3)]">
          {potion.ingredients.length} ingredient{potion.ingredients.length !== 1 ? "s" : ""}
        </p>

        <button
          type="button"
          onClick={handleAddToBag}
          aria-label={`Add ${potion.name} to bag`}
          className="mt-auto w-full py-2 text-sm font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors"
        >
          Add to bag
        </button>
      </div>
    </article>
  );
}
