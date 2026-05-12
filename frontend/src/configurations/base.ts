export const baseConfig = {
  apiBaseUrl: '/api',
  authStorage: {
    accessKey: 'ts_access',
    refreshKey: 'ts_refresh',
  },
  query: {
    staleTime: 30_000,
    retry: 1,
  },
};

export type Config = typeof baseConfig;
