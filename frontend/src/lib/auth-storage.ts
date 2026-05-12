import { config } from '@/configurations';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export function getAccess(): string | null {
  return localStorage.getItem(config.authStorage.accessKey);
}

export function getRefresh(): string | null {
  return localStorage.getItem(config.authStorage.refreshKey);
}

export function setTokens(tokens: AuthTokens): void {
  localStorage.setItem(config.authStorage.accessKey, tokens.accessToken);
  localStorage.setItem(config.authStorage.refreshKey, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(config.authStorage.accessKey);
  localStorage.removeItem(config.authStorage.refreshKey);
}
