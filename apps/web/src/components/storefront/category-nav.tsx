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
    <nav aria-label="Product categories">
      <ul
        role="list"
        className="flex gap-1 overflow-x-auto px-4 sm:px-6 py-2 max-w-7xl mx-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((cat) => (
          <li key={cat.label}>
            {cat.active ? (
              <span
                aria-current="page"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--accent)] text-white whitespace-nowrap"
              >
                {cat.label}
              </span>
            ) : (
              <span
                aria-disabled="true"
                data-category={cat.label.toLowerCase()}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap cursor-default select-none",
                  cat.highlight
                    ? "text-[var(--red)] bg-[var(--red-soft)]"
                    : "text-[var(--text-2)] bg-[var(--surface-3)]",
                ].join(" ")}
              >
                {cat.label}
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
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
