type Category = {
  label: string;
  active: boolean;
  highlight?: boolean;
};

const CATEGORIES: Category[] = [
  { label: "Potions", active: true },
  { label: "Ingredients", active: false },
  { label: "Books", active: false },
  { label: "Supplies", active: false },
  { label: "Charms", active: false },
  { label: "Clearance", active: false, highlight: true },
];

export function CategoryNav() {
  return (
    <nav aria-label="Product categories" className="border-y border-[var(--border)]">
      <ul
        role="list"
        className="max-w-[1280px] mx-auto px-4 sm:px-8 flex gap-8 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((cat) => (
          <li key={cat.label}>
            {cat.active ? (
              <span
                aria-current="page"
                className="inline-block py-4 text-[15px] font-semibold text-[var(--text)] border-b-2 border-[var(--accent)] whitespace-nowrap"
              >
                {cat.label}
              </span>
            ) : (
              <span
                aria-disabled="true"
                data-category={cat.label.toLowerCase()}
                className={[
                  "inline-flex items-center gap-1.5 py-4 text-[15px] whitespace-nowrap cursor-default select-none border-b-2 border-transparent",
                  cat.highlight
                    ? "font-semibold text-[var(--accent)]"
                    : "font-medium text-[var(--text-2)]",
                ].join(" ")}
              >
                {cat.label}
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
                  Soon
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
