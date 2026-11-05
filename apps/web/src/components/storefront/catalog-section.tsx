"use client";

import { useState } from "react";
import type { Potion } from "@merlins-potions-remake/shared";
import { usePotions } from "@/hooks/use-app";
import { filterPotions, sortPotions, type SortKey } from "@/lib/catalog/filter-sort";
import { PotionCard } from "./potion-card";

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

  const filtered = filterPotions(potions, query);
  const displayed = sortPotions(filtered, sort);

  return (
    <section aria-label="Potions catalogue">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[var(--text)]">Potions</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">
          Catalogue · {String(displayed.length).padStart(2, "0")} item{displayed.length !== 1 ? "s" : ""}
        </p>
        <p className="text-sm text-[var(--text-2)] mt-2 max-w-xl">
          Handcrafted brews for every ailment, adventure, and occasion. Each potion is
          bottled fresh by Merlin himself — quality guaranteed or your gold back.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="flex-1 max-w-sm">
          <label htmlFor="catalog-search" className="sr-only">
            Search potions
          </label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Search by name or ingredient…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-sm text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--accent)]"
          />
        </div>

        {/* Sort chips */}
        <div role="group" aria-label="Sort options" className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                sort === key
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-sm text-[var(--text-3)]">Loading potions…</p>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-2)] mb-2">
            No potions found for &ldquo;{query}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-sm text-[var(--accent)] underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((potion) => (
            <PotionCard
              key={potion.id}
              potion={potion}
              onSelect={onSelectPotion ?? (() => {})}
            />
          ))}
        </div>
      )}
    </section>
  );
}
