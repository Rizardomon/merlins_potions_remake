"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompletePasswordReset } from "@/hooks/use-auth";
import { PasswordStrengthMeter } from "@/components/account/password-strength-meter";
import { CompletePasswordResetSchema } from "@merlins-potions-remake/shared";

interface SetNewPasswordErrors {
  password?: string;
  general?: string;
}

interface PageProps {
  params: { token: string };
}

export default function ResetPasswordPage({ params }: PageProps) {
  const router = useRouter();
  const { token } = params;

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SetNewPasswordErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isExpired, setIsExpired] = useState(false);

  const resetMutation = useCompletePasswordReset();

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Enter a new password";
    if (value.length < 8) return "Use at least 8 characters";
    return undefined;
  };

  const handleFieldBlur = () => {
    const newTouched = new Set(touchedFields);
    newTouched.add("password");
    setTouchedFields(newTouched);

    const error = validatePassword(password);
    setErrors(prev => ({
      ...prev,
      password: error,
      general: undefined,
    }));
  };

  const handleFieldChange = (value: string) => {
    setPassword(value);

    if (touchedFields.has("password")) {
      const error = validatePassword(value);
      setErrors(prev => ({
        ...prev,
        password: error,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    try {
      await resetMutation.mutateAsync({
        token,
        password,
      });

      // Sucesso — redirecionar ao sign-in com confirmação
      // Usar URL state ou localStorage para exibir mensagem na página de sign-in
      localStorage.setItem("passwordResetSuccess", "true");
      router.push("/");
      // Na prática, abriremos o overlay com a view de confirmação
      // Este é um redirect simplificado
    } catch (error) {
      const err = error as any;
      if (err?.status === 410) {
        setIsExpired(true);
      } else if (err?.status === 429) {
        setErrors({ general: "Too many attempts. Try again in 15 minutes." });
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
      }
    }
  };

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg border border-[#E3DDD3] p-8 text-center space-y-6">
            <div>
              <h1 className="font-serif text-2xl text-[#1F1A26] mb-2">This link has expired</h1>
              <p className="text-sm text-[#6E6676]">Password reset links are only valid for 30 minutes.</p>
            </div>

            <button
              onClick={() => {
                // Redirect to home to open overlay with reset-request
                localStorage.setItem("openResetRequest", "true");
                window.location.href = "/";
              }}
              className="w-full bg-[#4B2E83] hover:bg-[#3B2268] text-[#FBF9F5] font-medium py-3 rounded-full transition-colors"
            >
              Send a new link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] px-4">
      <div className="max-w-md w-full">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#E3DDD3] p-8 space-y-6">
          <div>
            <h1 className="font-serif text-2xl text-[#1F1A26] mb-2">Set a new password</h1>
            <p className="text-sm text-[#6E6676]">Choose a strong password to secure your account.</p>
          </div>

          {errors.general && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">
              {errors.general}
            </div>
          )}

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="reset-password" className="block text-sm font-medium text-[#1F1A26]">
                New password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[#4B2E83] hover:text-[#3B2268] font-medium"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handleFieldChange(e.target.value)}
              onBlur={handleFieldBlur}
              className={`w-full px-4 py-2 border rounded-full text-[#1F1A26] bg-[#FFFFFF] placeholder-[#6E6676] focus:outline-none focus:ring-2 focus:ring-[#4B2E83] ${
                errors.password ? "border-red-500" : "border-[#E3DDD3]"
              }`}
              placeholder="Enter a new password"
              disabled={resetMutation.isPending}
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Strength meter */}
          {password && <PasswordStrengthMeter password={password} />}

          {/* Submit button */}
          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full bg-[#4B2E83] hover:bg-[#3B2268] disabled:opacity-60 text-[#FBF9F5] font-medium py-3 rounded-full transition-colors"
          >
            {resetMutation.isPending ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
