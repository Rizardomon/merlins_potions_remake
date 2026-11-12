import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authRepository from "@/lib/api/auth-repository";
import type {
  SignUpRequest,
  SignInRequest,
  RequestPasswordReset,
  CompletePasswordReset,
} from "@merlins-potions-remake/shared";

export const authQueryKeys = {
  session: ["session"] as const,
};

/**
 * Query da sessão atual. Refletido no header e usado em task_12+.
 * Invalidado por sign-in, sign-up e sign-out.
 */
export function useSession() {
  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: authRepository.getSession,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Mutation de sign-in. Invalida session, retorna customer + sessionToken.
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authRepository.signIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Mutation de sign-up. Invalida session, retorna customer + sessionToken.
 */
export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authRepository.signUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Mutation de sign-out. Invalida session.
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authRepository.signOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Mutation de request de password reset. Sem invalidação (sessão não muda).
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authRepository.requestPasswordReset,
  });
}

/**
 * Mutation de complete password reset. Invalida session (pode acabar a sessão).
 */
export function useCompletePasswordReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authRepository.completePasswordReset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}
