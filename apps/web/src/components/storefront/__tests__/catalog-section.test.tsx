import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CatalogSection } from "../catalog-section";
import type { Potion } from "@merlins-potions-remake/shared";

// --- Fixtures ---

const makePotions = (): Potion[] => [
  {
    id: "1",
    number: 1,
    name: "Love Potion",
    priceCents: 500,
    tint: "#ff0000",
    effect: "Makes you fall in love",
    ingredients: ["rose", "honey"],
    image: "love-potion.png",
  },
  {
    id: "2",
    number: 2,
    name: "Sleeping Draught",
    priceCents: 300,
    tint: "#0000ff",
    effect: "Induces deep sleep",
    ingredients: ["valerian", "lavender"],
    image: "sleeping-draught.png",
  },
  {
    id: "3",
    number: 3,
    name: "Dragon Tonic",
    priceCents: 800,
    tint: "#ff6600",
    effect: "Grants fire resistance",
    ingredients: ["dragon scale", "fire moss"],
    image: "dragon-tonic.png",
  },
];

// --- Mocks ---

const mockDispatch = vi.fn();
const mockUseBag = vi.fn(() => ({ dispatch: mockDispatch, itemCount: 0 }));
vi.mock("@/lib/bag/provider", () => ({ useBag: () => mockUseBag() }));

const mockUsePotions = vi.fn(() => ({ data: makePotions(), isLoading: false }));
vi.mock("@/hooks/use-app", () => ({ usePotions: () => mockUsePotions() }));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// --- Tests ---

describe("CatalogSection", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockUseBag.mockReturnValue({ dispatch: mockDispatch, itemCount: 0 });
    mockUsePotions.mockReturnValue({ data: makePotions(), isLoading: false });
  });

  it("renderiza todos os cards inicialmente", () => {
    render(<CatalogSection />);
    expect(screen.getByText("Love Potion")).toBeDefined();
    expect(screen.getByText("Sleeping Draught")).toBeDefined();
    expect(screen.getByText("Dragon Tonic")).toBeDefined();
  });

  it("mostra contagem correta no heading", () => {
    render(<CatalogSection />);
    expect(screen.getByText(/Catalogue · 03 items/)).toBeDefined();
  });

  it("busca por nome filtra ao vivo e atualiza contagem", () => {
    render(<CatalogSection />);
    const input = screen.getByPlaceholderText(/search by name or ingredient/i);
    fireEvent.change(input, { target: { value: "love" } });
    expect(screen.getByText("Love Potion")).toBeDefined();
    expect(screen.queryByText("Sleeping Draught")).toBeNull();
    expect(screen.getByText(/Catalogue · 01 item/)).toBeDefined();
  });

  it("busca por ingrediente retorna a poção que o contém", () => {
    render(<CatalogSection />);
    const input = screen.getByPlaceholderText(/search by name or ingredient/i);
    fireEvent.change(input, { target: { value: "lavender" } });
    expect(screen.getByText("Sleeping Draught")).toBeDefined();
    expect(screen.queryByText("Love Potion")).toBeNull();
  });

  it("sem match exibe estado vazio com a query", () => {
    render(<CatalogSection />);
    const input = screen.getByPlaceholderText(/search by name or ingredient/i);
    fireEvent.change(input, { target: { value: "unicorn" } });
    expect(screen.getByText(/No potions found for/)).toBeDefined();
    expect(screen.getByText(/unicorn/)).toBeDefined();
    expect(screen.getByRole("button", { name: /clear search/i })).toBeDefined();
  });

  it("'Clear search' restaura a lista completa", () => {
    render(<CatalogSection />);
    const input = screen.getByPlaceholderText(/search by name or ingredient/i);
    fireEvent.change(input, { target: { value: "unicorn" } });
    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
    expect(screen.getByText("Love Potion")).toBeDefined();
    expect(screen.getByText("Sleeping Draught")).toBeDefined();
    expect(screen.getByText(/Catalogue · 03 items/)).toBeDefined();
  });

  it("chip Featured ativo por padrão (aria-pressed)", () => {
    render(<CatalogSection />);
    const featured = screen.getByRole("button", { name: "Featured" });
    expect(featured.getAttribute("aria-pressed")).toBe("true");
  });

  it("clicar chip de sort muda o chip ativo", () => {
    render(<CatalogSection />);
    const asc = screen.getByRole("button", { name: "Price: low to high" });
    fireEvent.click(asc);
    expect(asc.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Featured" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("'Add to bag' faz quick-add de 1 sem chamar onSelect", () => {
    const onSelect = vi.fn();
    render(<CatalogSection onSelectPotion={onSelect} />);
    const addBtn = screen.getAllByRole("button", { name: /add love potion to bag/i })[0];
    fireEvent.click(addBtn);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "add",
      payload: { product: makePotions()[0], quantity: 1 },
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clicar no card chama onSelect com a poção correta", () => {
    const onSelect = vi.fn();
    render(<CatalogSection onSelectPotion={onSelect} />);
    const card = screen.getByRole("button", { name: /view details for love potion/i });
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(makePotions()[0]);
  });

  it("mostra loading quando isLoading=true", () => {
    mockUsePotions.mockReturnValue({ data: [], isLoading: true });
    render(<CatalogSection />);
    expect(screen.getByText(/loading potions/i)).toBeDefined();
  });
});
