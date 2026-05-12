import { useSyncExternalStore } from 'react';
import { config } from '@/configurations';
import { getAccess } from '@/lib/auth-storage';

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === config.authStorage.accessKey) callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

function getSnapshot() {
  return getAccess();
}

export function useAuth() {
  const accessToken = useSyncExternalStore(subscribe, getSnapshot, () => null);
  return { isAuthenticated: Boolean(accessToken) };
}
