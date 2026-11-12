"use client";

import {
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAccountOverlay } from "@/lib/account/provider";
import { useBag } from "@/lib/bag/provider";
import { cn } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";
import { CreateAccountForm } from "./create-account-form";
import { ConfirmationView } from "./confirmation-view";

function useAccountFocusTrap(open: boolean, triggerRef: React.RefObject<HTMLButtonElement | null>) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Focus on overlay content
    const focusableElements = contentRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        triggerRef.current?.focus();
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (!contentRef.current?.contains(e.relatedTarget as Node)) {
        const focusableElements = contentRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    contentRef.current?.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      contentRef.current?.removeEventListener("focusout", handleFocusOut);
    };
  }, [open, triggerRef]);

  return contentRef;
}

export function AccountOverlay() {
  const { state, closeOverlay, triggerRef, switchView } = useAccountOverlay();
  const { closeBag } = useBag();
  const contentRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useAccountFocusTrap(state.overlayOpen, triggerRef);

  const handleOpen = useCallback(() => {
    if (state.overlayOpen) {
      closeBag();
    }
  }, [state.overlayOpen, closeBag]);

  useEffect(() => {
    handleOpen();
  }, [handleOpen]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.overlayOpen) {
        closeOverlay();
        triggerRef.current?.focus();
      }
    },
    [state.overlayOpen, closeOverlay, triggerRef]
  );

  const handleBackdropClick = useCallback(() => {
    closeOverlay();
    triggerRef.current?.focus();
  }, [closeOverlay, triggerRef]);

  useEffect(() => {
    if (state.overlayOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [state.overlayOpen, handleEscape]);

  if (!state.overlayOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account"
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Overlay content */}
      <div
        ref={focusTrapRef}
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#FBF9F5]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3DDD3] px-4 py-4 sm:px-6">
          <button
            onClick={handleBackdropClick}
            className="text-xl font-serif text-[#1F1A26] hover:text-[#4B2E83]"
            aria-label="Close account overlay"
          >
            ✕
          </button>
          <h1 className="text-center font-serif text-xl text-[#1F1A26]">Account</h1>
          <div className="w-6" />
        </div>

        {/* Main content with brand panel and form */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Brand panel */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-[#E3DDD3] px-4 py-8 sm:px-8 flex flex-col justify-between bg-[#F5F2EC]">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1F1A26] mb-8">
                Your cauldron, remembered.
              </h2>

              <ul className="space-y-6">
                <li className="flex items-start gap-3">
                  <span className="text-lg text-[#4B2E83] flex-shrink-0 mt-1">✓</span>
                  <span className="text-sm text-[#1F1A26]">Faster checkout with saved addresses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg text-[#4B2E83] flex-shrink-0 mt-1">✓</span>
                  <span className="text-sm text-[#1F1A26]">Track every owl, broom and floo delivery</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg text-[#4B2E83] flex-shrink-0 mt-1">✓</span>
                  <span className="text-sm text-[#1F1A26]">Early access to seasonal brews</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form panel */}
          <div className="w-full lg:w-1/2 px-4 py-8 sm:px-8 flex flex-col">
            {/* Tabs */}
            <div
              role="tablist"
              className="flex border-b border-[#E3DDD3] mb-8 gap-8"
            >
              <button
                role="tab"
                aria-selected={state.activeView === "sign-in"}
                onClick={() => {
                  switchView("sign-in");
                }}
                className={cn(
                  "pb-3 font-medium text-sm border-b-2 -mb-1",
                  state.activeView === "sign-in"
                    ? "text-[#1F1A26] border-[#1F1A26]"
                    : "text-[#6E6676] border-transparent hover:text-[#1F1A26]"
                )}
              >
                Sign in
              </button>
              <button
                role="tab"
                aria-selected={state.activeView === "create"}
                onClick={() => {
                  switchView("create");
                }}
                className={cn(
                  "pb-3 font-medium text-sm border-b-2 -mb-1",
                  state.activeView === "create"
                    ? "text-[#1F1A26] border-[#1F1A26]"
                    : "text-[#6E6676] border-transparent hover:text-[#1F1A26]"
                )}
              >
                Create account
              </button>
            </div>

            {/* Form content */}
            <div className="flex-1">
              {state.activeView === "sign-in" && <SignInForm />}
              {state.activeView === "create" && <CreateAccountForm />}
              {state.activeView === "confirmation" && <ConfirmationView />}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#E3DDD3] text-center text-xs text-[#6E6676]">
              Protected by a Fidelius charm · we never share your details
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
