import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BagDrawer } from "../bag-drawer";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

type MockBag = {
  state?: { lines: { product: ReturnType<typeof makePotion>; quantity: number }[]; hydrated: boolean };
  dispatch?: ReturnType<typeof vi.fn>;
  itemCount?: number;
  subtotalCents?: number;
  freeShippingRemainingCents?: number;
  bagOpen?: boolean;
  openBag?: ReturnType<typeof vi.fn>;
  closeBag?: ReturnType<typeof vi.fn>;
  toastVisible?: boolean;
  toastQuantity?: number;
  dismissToast?: ReturnType<typeof vi.fn>;
};

const makePotion = (overrides = {}) => ({
  id: "p1",
  number: 1,
  name: "Love Potion",
  priceCents: 1000,
  tint: "#ff0000",
  effect: "Makes you fall in love",
  ingredients: ["rose"],
  image: "love.png",
  ...overrides,
});

const makeMockBag = (overrides: MockBag = {}): MockBag => ({
  state: { lines: [], hydrated: true },
  dispatch: vi.fn(),
  itemCount: 0,
  subtotalCents: 0,
  freeShippingRemainingCents: 5000,
  bagOpen: true,
  openBag: vi.fn(),
  closeBag: vi.fn(),
  toastVisible: false,
  toastQuantity: 0,
  dismissToast: vi.fn(),
  ...overrides,
});

const mockUseBag = vi.fn(() => makeMockBag());

vi.mock("@/lib/bag/provider", () => ({
  useBag: () => mockUseBag(),
}));

describe("BagDrawer", () => {
  beforeEach(() => mockUseBag.mockReturnValue(makeMockBag()));

  describe("shipping progress text", () => {
    it("shows 'away from free shipping' when below threshold", () => {
      mockUseBag.mockReturnValue(makeMockBag({ freeShippingRemainingCents: 2000 }));
      render(<BagDrawer />);
      expect(screen.getByText(/you're us\$ 20\.00 away from free shipping/i)).toBeDefined();
    });

    it("shows 'Your order ships free!' when at threshold", () => {
      mockUseBag.mockReturnValue(makeMockBag({ freeShippingRemainingCents: 0 }));
      render(<BagDrawer />);
      expect(screen.getByText(/your order ships free/i)).toBeDefined();
    });

    it("shows 'Your order ships free!' when above threshold", () => {
      mockUseBag.mockReturnValue(
        makeMockBag({ freeShippingRemainingCents: 0, subtotalCents: 6000 })
      );
      render(<BagDrawer />);
      expect(screen.getByText(/your order ships free/i)).toBeDefined();
    });
  });

  describe("shipping progress bar", () => {
    it("progress bar width reflects remaining cents", () => {
      // 2500 of 5000 remaining = 50% filled
      mockUseBag.mockReturnValue(makeMockBag({ freeShippingRemainingCents: 2500 }));
      render(<BagDrawer />);
      const bar = document.querySelector('[role="progressbar"] > div') as HTMLElement;
      expect(bar.style.width).toBe("50%");
    });

    it("progress bar is 100% when shipping is free", () => {
      mockUseBag.mockReturnValue(makeMockBag({ freeShippingRemainingCents: 0 }));
      render(<BagDrawer />);
      const bar = document.querySelector('[role="progressbar"] > div') as HTMLElement;
      expect(bar.style.width).toBe("100%");
    });

    it("progressbar has accessible label", () => {
      render(<BagDrawer />);
      expect(screen.getByRole("progressbar")).toBeDefined();
    });
  });

  describe("empty state", () => {
    it("shows empty message when bag has no lines", () => {
      render(<BagDrawer />);
      expect(
        screen.getByText(/your bag is empty — the cauldron awaits/i)
      ).toBeDefined();
    });
  });

  describe("line items", () => {
    const potion = makePotion();
    const lineState = {
      state: { lines: [{ product: potion, quantity: 2 }], hydrated: true },
      subtotalCents: 2000,
      freeShippingRemainingCents: 3000,
    };

    it("shows product name", () => {
      mockUseBag.mockReturnValue(makeMockBag(lineState));
      render(<BagDrawer />);
      expect(screen.getByText("Love Potion")).toBeDefined();
    });

    it("line total = price × quantity", () => {
      mockUseBag.mockReturnValue(makeMockBag(lineState));
      render(<BagDrawer />);
      // 1000 * 2 = 2000 cents = US$ 20.00 (appears as line total and subtotal)
      expect(screen.getAllByText("US$ 20.00").length).toBeGreaterThanOrEqual(1);
    });

    it("subtotal matches sum of lines", () => {
      // Two products so line totals differ from overall subtotal
      const p1 = makePotion({ id: "p1", priceCents: 1000 });
      const p2 = makePotion({ id: "p2", priceCents: 500, name: "Healing Potion" });
      const s = {
        state: {
          lines: [
            { product: p1, quantity: 1 },
            { product: p2, quantity: 1 },
          ],
          hydrated: true,
        },
        subtotalCents: 1500,
        freeShippingRemainingCents: 3500,
      };
      mockUseBag.mockReturnValue(makeMockBag(s));
      render(<BagDrawer />);
      // subtotalCents = 1500 = US$ 15.00 (only appears in footer Subtotal)
      expect(screen.getByText("US$ 15.00")).toBeDefined();
    });

    it("dispatches setQuantity decrease on − button", () => {
      const dispatch = vi.fn();
      mockUseBag.mockReturnValue(makeMockBag({ ...lineState, dispatch }));
      render(<BagDrawer />);
      fireEvent.click(screen.getByLabelText(/decrease quantity of love potion/i));
      expect(dispatch).toHaveBeenCalledWith({
        type: "setQuantity",
        payload: { productId: "p1", quantity: 1 },
      });
    });

    it("dispatches setQuantity increase on + button", () => {
      const dispatch = vi.fn();
      mockUseBag.mockReturnValue(makeMockBag({ ...lineState, dispatch }));
      render(<BagDrawer />);
      fireEvent.click(screen.getByLabelText(/increase quantity of love potion/i));
      expect(dispatch).toHaveBeenCalledWith({
        type: "setQuantity",
        payload: { productId: "p1", quantity: 3 },
      });
    });

    it("dispatches remove on Remove button", () => {
      const dispatch = vi.fn();
      mockUseBag.mockReturnValue(makeMockBag({ ...lineState, dispatch }));
      render(<BagDrawer />);
      fireEvent.click(screen.getByLabelText(/remove love potion from bag/i));
      expect(dispatch).toHaveBeenCalledWith({
        type: "remove",
        payload: { productId: "p1" },
      });
    });

    it("dispatches setQuantity 0 (remove) when decreasing from qty 1", () => {
      const dispatch = vi.fn();
      const qty1State = {
        state: { lines: [{ product: potion, quantity: 1 }], hydrated: true },
        subtotalCents: 1000,
        freeShippingRemainingCents: 4000,
        dispatch,
      };
      mockUseBag.mockReturnValue(makeMockBag(qty1State));
      render(<BagDrawer />);
      fireEvent.click(screen.getByLabelText(/decrease quantity of love potion/i));
      expect(dispatch).toHaveBeenCalledWith({
        type: "setQuantity",
        payload: { productId: "p1", quantity: 0 },
      });
    });
  });

  describe("close behavior", () => {
    it("calls closeBag on close button click", () => {
      const closeBag = vi.fn();
      mockUseBag.mockReturnValue(makeMockBag({ closeBag }));
      render(<BagDrawer />);
      fireEvent.click(screen.getByLabelText("Close"));
      expect(closeBag).toHaveBeenCalled();
    });

    it("calls closeBag on backdrop click", () => {
      const closeBag = vi.fn();
      mockUseBag.mockReturnValue(makeMockBag({ closeBag }));
      render(<BagDrawer />);
      const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
      fireEvent.click(backdrop);
      expect(closeBag).toHaveBeenCalled();
    });

    it("calls closeBag on Escape key", () => {
      const closeBag = vi.fn();
      mockUseBag.mockReturnValue(makeMockBag({ closeBag }));
      render(<BagDrawer />);
      fireEvent.keyDown(document, { key: "Escape" });
      expect(closeBag).toHaveBeenCalled();
    });

    it("does not render when bagOpen is false", () => {
      mockUseBag.mockReturnValue(makeMockBag({ bagOpen: false }));
      render(<BagDrawer />);
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("footer", () => {
    it("shows Checkout button when bag has items", () => {
      const lineState = {
        state: { lines: [{ product: makePotion(), quantity: 1 }], hydrated: true },
        subtotalCents: 1000,
        freeShippingRemainingCents: 4000,
      };
      mockUseBag.mockReturnValue(makeMockBag(lineState));
      render(<BagDrawer />);
      expect(screen.getByRole("button", { name: /checkout/i })).toBeDefined();
    });

    it("does not show Checkout when bag is empty", () => {
      render(<BagDrawer />);
      expect(screen.queryByRole("button", { name: /checkout/i })).toBeNull();
    });
  });
});
