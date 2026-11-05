"use client";

import { useState } from "react";
import type { Potion } from "@merlins-potions-remake/shared";
import { usePotions } from "@/hooks/use-app";
import { filterPotions, sortPotions, type SortKey } from "@/lib/catalog/filter-sort";
import { PotionCard } from "./potion-card";
import { DetailDrawer } from "./detail-drawer";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "asc", label: "Price: low to high" },
  { key: "desc", label: "Price: high to low" },
];

interface CatalogSectionProps {
  onSelectPotion?: (potion: Potion) => void;
}

export function CatalogSection({ onSelectPotion }: CatalogSectionProps) {
  const { data: potions = [], isLoading } = usePotions();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("featured");
  const [selectedPotion, setSelectedPotion] = useState<Potion | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function handleSelectPotion(potion: Potion) {
    setSelectedPotion(potion);
    setDetailOpen(true);
    onSelectPotion?.(potion);
  }

  function handleCloseDetail() {
    setDetailOpen(false);
  }

  const filtered = filterPotions(potions, query);
  const displayed = sortPotions(filtered, sort);

  return (
    <section aria-label="Potions catalogue">
      {/* Heading + controls */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
            Catalogue · {String(displayed.length).padStart(2, "0")} item{displayed.length !== 1 ? "s" : ""}
          </p>
          <h1 className="font-display font-normal text-[clamp(52px,8vw,88px)] leading-[0.95] tracking-[-0.01em] text-[var(--text)]">
            Potions
          </h1>
          <p className="max-w-[440px] text-[17px] text-[var(--text-2)]">
            Small-batch brews, bottled by hand. Tap any bottle for its effect and ingredients.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-3">
          {/* Search */}
          <label
            htmlFor="catalog-search"
            className="w-full sm:w-[320px] flex items-center h-10 px-4 rounded-full bg-[var(--surface)] border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--ring)]"
          >
            <span className="sr-only">Search potions</span>
            <input
              id="catalog-search"
              type="search"
              placeholder="Search by name or ingredient…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-3)]"
            />
          </label>

          {/* Sort chips */}
          <div role="group" aria-label="Sort options" className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={sort === key}
                onClick={() => setSort(key)}
                className={`h-10 px-[18px] rounded-full border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                  sort === key
                    ? "bg-[var(--text)] text-[var(--bg)] border-[var(--text)]"
                    : "bg-transparent text-[var(--text)] border-[var(--border)] hover:border-[var(--text)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-sm text-[var(--text-3)]">Loading potions…</p>
      ) : displayed.length === 0 ? (
        <div className="py-20 px-6 text-center border border-dashed border-[var(--border)] rounded-[20px] flex flex-col gap-3 items-center">
          <p className="font-display text-4xl text-[var(--text)]">
            No potions found for &ldquo;{query}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="h-10 px-[18px] rounded-full border border-[var(--text)] bg-transparent text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {displayed.map((potion) => (
            <PotionCard
              key={potion.id}
              potion={potion}
              onSelect={handleSelectPotion}
            />
          ))}
        </div>
      )}
      <DetailDrawer
        open={detailOpen}
        onClose={handleCloseDetail}
        potion={selectedPotion}
      />
    </section>
  );
}
