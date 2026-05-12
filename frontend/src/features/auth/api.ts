import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  clearTokens,
  getRefresh,
  setTokens,
} from '@/lib/auth-storage';
import type {
  AuthTokens,
  LoginInput,
  LogoutResponse,
  RegisterInput,
} from './types';

type RegisterResponse = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const tokens = await api.post<AuthTokens>('/auth/login', input);
      setTokens(tokens);
      return tokens;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      api.post<RegisterResponse>('/users', input),
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefresh();
      try {
        if (refreshToken) {
          await api.post<LogoutResponse>('/auth/logout', { refreshToken });
        }
      } catch {
        // Swallow — local cleanup happens regardless.
      } finally {
        clearTokens();
        qc.clear();
      }
    },
  });
}
