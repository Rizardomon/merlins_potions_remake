import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmationView } from "./confirmation-view";
import { useSession } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";
import { useBag } from "@/lib/bag/provider";

vi.mock("@/hooks/use-auth");
vi.mock("@/lib/account/provider");
vi.mock("@/lib/bag/provider");

describe("ConfirmationView", () => {
  const mockCustomer = {
    id: "cust-123",
    email: "ana@example.com",
    fullName: "Ana Silva",
  };

  const mockAccountOverlay = {
    closeOverlay: vi.fn(),
    openOverlay: vi.fn(),
    switchView: vi.fn(),
    setEmail: vi.fn(),
    state: { activeView: "confirmation", overlayOpen: true, email: "" },
    dispatch: vi.fn(),
    triggerRef: { current: null },
  };

  const mockBagEmpty = {
    state: { lines: [] },
    openBag: vi.fn(),
    closeBag: vi.fn(),
    dispatch: vi.fn(),
    itemCount: 0,
    subtotalCents: 0,
    freeShippingRemainingCents: 5000,
    toastVisible: false,
    toastQuantity: 0,
    dismissToast: vi.fn(),
  };

  const mockBagWithItems = {
    state: { lines: [{ product: { id: "p1", priceCents: 1000 }, quantity: 2 }] },
    openBag: vi.fn(),
    closeBag: vi.fn(),
    dispatch: vi.fn(),
    itemCount: 2,
    subtotalCents: 2000,
    freeShippingRemainingCents: 3000,
    toastVisible: false,
    toastQuantity: 0,
    dismissToast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAccountOverlay).mockReturnValue(mockAccountOverlay as any);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("New account (sign-up)", () => {
    beforeEach(() => {
      vi.mocked(useSession).mockReturnValue({
        data: { customer: mockCustomer },
        isPending: false,
      } as any);
      vi.mocked(useAccountOverlay).mockReturnValue({
        ...mockAccountOverlay,
        state: { ...mockAccountOverlay.state, activeView: "confirmation" },
      } as any);
    });

    it("renders 'Account created' label", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      expect(screen.getByText("Account created")).toBeInTheDocument();
    });

    it("renders 'Your account is ready...' message for new account", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      expect(
        screen.getByText("Your account is ready. We've saved your details so checkout takes seconds.")
      ).toBeInTheDocument();
    });

    it("displays first name in headline", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      expect(screen.getByText("Hello, Ana.")).toBeInTheDocument();
    });
  });

  describe("Returning customer (sign-in)", () => {
    beforeEach(() => {
      vi.mocked(useSession).mockReturnValue({
        data: { customer: mockCustomer },
        isPending: false,
      } as any);
      vi.mocked(useAccountOverlay).mockReturnValue({
        ...mockAccountOverlay,
        state: { ...mockAccountOverlay.state, activeView: "sign-in" },
      } as any);
    });

    it("renders 'Signed in' label", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      expect(screen.getByText("Signed in")).toBeInTheDocument();
    });

    it("renders 'Good to see you again...' message", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      expect(
        screen.getByText(/Good to see you again/)
      ).toBeInTheDocument();
    });
  });

  describe("Button behavior", () => {
    beforeEach(() => {
      vi.mocked(useSession).mockReturnValue({
        data: { customer: mockCustomer },
        isPending: false,
      } as any);
      vi.mocked(useAccountOverlay).mockReturnValue(mockAccountOverlay as any);
    });

    it("shows 'Start shopping' when bag is empty", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      expect(screen.getByText("Start shopping")).toBeInTheDocument();
    });

    it("shows 'Back to your bag' when bag has items", () => {
      vi.mocked(useBag).mockReturnValue(mockBagWithItems as any);
      render(<ConfirmationView />);

      expect(screen.getByText("Back to your bag")).toBeInTheDocument();
    });

    it("closes overlay and opens bag when 'Back to your bag' is clicked", () => {
      vi.useRealTimers();
      vi.mocked(useBag).mockReturnValue(mockBagWithItems as any);

      render(<ConfirmationView />);

      const button = screen.getByText("Back to your bag") as HTMLButtonElement;
      button.click();

      expect(mockAccountOverlay.closeOverlay).toHaveBeenCalled();
      expect(mockBagWithItems.openBag).toHaveBeenCalled();
    });

    it("closes overlay when 'Start shopping' is clicked", () => {
      vi.useRealTimers();
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);

      render(<ConfirmationView />);

      const button = screen.getByText("Start shopping") as HTMLButtonElement;
      button.click();

      expect(mockAccountOverlay.closeOverlay).toHaveBeenCalled();
    });
  });

  describe("Auto-close behavior", () => {
    beforeEach(() => {
      vi.mocked(useSession).mockReturnValue({
        data: { customer: mockCustomer },
        isPending: false,
      } as any);
      vi.mocked(useAccountOverlay).mockReturnValue(mockAccountOverlay as any);
    });

    it("auto-closes overlay after 2 seconds when customer is set", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      vi.advanceTimersByTime(2000);

      expect(mockAccountOverlay.closeOverlay).toHaveBeenCalled();
    });

    it("auto-opens bag after 2 seconds if it has items", () => {
      vi.mocked(useBag).mockReturnValue(mockBagWithItems as any);
      render(<ConfirmationView />);

      vi.advanceTimersByTime(2000);

      expect(mockAccountOverlay.closeOverlay).toHaveBeenCalled();
      expect(mockBagWithItems.openBag).toHaveBeenCalled();
    });

    it("does not auto-open empty bag", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      render(<ConfirmationView />);

      vi.advanceTimersByTime(2000);

      expect(mockAccountOverlay.closeOverlay).toHaveBeenCalled();
      expect(mockBagEmpty.openBag).not.toHaveBeenCalled();
    });

    it("clears timer on unmount", () => {
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
      const { unmount } = render(<ConfirmationView />);

      unmount();

      vi.advanceTimersByTime(2000);

      expect(mockAccountOverlay.closeOverlay).not.toHaveBeenCalled();
    });
  });

  describe("No session state", () => {
    beforeEach(() => {
      vi.mocked(useSession).mockReturnValue({
        data: { customer: null },
        isPending: false,
      } as any);
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
    });

    it("renders nothing when customer is not available", () => {
      const { container } = render(<ConfirmationView />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("Different names", () => {
    beforeEach(() => {
      vi.mocked(useAccountOverlay).mockReturnValue(mockAccountOverlay as any);
      vi.mocked(useBag).mockReturnValue(mockBagEmpty as any);
    });

    it("handles single-word names", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          customer: {
            id: "cust-456",
            email: "ali@example.com",
            fullName: "Ali",
          },
        },
        isPending: false,
      } as any);

      render(<ConfirmationView />);

      expect(screen.getByText("Hello, Ali.")).toBeInTheDocument();
    });

    it("extracts first name from full name with multiple words", () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          customer: {
            id: "cust-789",
            email: "john@example.com",
            fullName: "John Paulo Silva",
          },
        },
        isPending: false,
      } as any);

      render(<ConfirmationView />);

      expect(screen.getByText("Hello, John.")).toBeInTheDocument();
    });
  });
});
