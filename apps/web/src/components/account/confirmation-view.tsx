"use client";

import { useSession } from "@/hooks/use-auth";
import { useAccountOverlay } from "@/lib/account/provider";
import { useBag } from "@/lib/bag/provider";
import { useEffect } from "react";

export function ConfirmationView() {
  const { data: session } = useSession();
  const { closeOverlay, state } = useAccountOverlay();
  const { state: bagState, openBag } = useBag();

  const customer = session?.customer;
  const isNewAccount = state.activeView === "confirmation";
  const hasBagItems = (bagState.lines?.length || 0) > 0;

  useEffect(() => {
    if (customer) {
      const timer = setTimeout(() => {
        closeOverlay();
        if (hasBagItems) {
          openBag();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [customer, closeOverlay, hasBagItems, openBag]);

  if (!customer) {
    return null;
  }

  const firstName = customer.fullName.split(" ")[0];

  return (
    <div className="space-y-6 text-center flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-4xl text-[#4B2E83]">✓</div>

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-[#6E6676]">
          {isNewAccount ? "Account created" : "Signed in"}
        </div>
        <h2 className="font-serif text-3xl text-[#1F1A26]">Hello, {firstName}.</h2>
      </div>

      <p className="text-sm text-[#6E6676] max-w-sm">
        {isNewAccount
          ? "Your account is ready. We've saved your details so checkout takes seconds."
          : "Good to see you again. Your bag and saved details are right where you left them."}
      </p>

      <button
        onClick={() => {
          closeOverlay();
          if (hasBagItems) {
            openBag();
          }
        }}
        className="mt-4 bg-[#4B2E83] hover:bg-[#3B2268] text-[#FBF9F5] font-medium py-3 px-6 rounded-full transition-colors"
      >
        {hasBagItems ? "Back to your bag" : "Start shopping"}
      </button>
    </div>
  );
}
