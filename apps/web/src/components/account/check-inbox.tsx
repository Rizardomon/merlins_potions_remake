"use client";

import { useAccountOverlay } from "@/lib/account/provider";

export function CheckInboxView() {
  const { email, switchView } = useAccountOverlay();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-[#1F1A26] mb-2">Check your inbox</h2>
        <p className="text-sm text-[#6E6676]">We've sent a password reset link to your email.</p>
      </div>

      {/* Email display */}
      <div className="rounded-lg bg-[#F5F2EC] border border-[#E3DDD3] p-4">
        <p className="text-sm text-[#6E6676]">Email address</p>
        <p className="text-sm font-medium text-[#1F1A26] break-all">{email}</p>
      </div>

      {/* Expiry info */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-700">
          Link valid for <strong>30 minutes</strong>. Check your spam folder if you don't see the email.
        </p>
      </div>

      {/* Back to sign-in button */}
      <button
        onClick={() => switchView("sign-in")}
        className="w-full bg-[#4B2E83] hover:bg-[#3B2268] text-[#FBF9F5] font-medium py-3 rounded-full transition-colors"
      >
        Back to sign in
      </button>

      {/* Resend link (low priority) */}
      <p className="text-center text-sm text-[#6E6676]">
        Didn't receive the email?{" "}
        <button
          onClick={() => switchView("reset-request")}
          className="text-[#4B2E83] hover:text-[#3B2268] font-medium underline"
        >
          Try again
        </button>
      </p>
    </div>
  );
}
