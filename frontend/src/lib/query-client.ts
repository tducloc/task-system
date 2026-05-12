import { QueryClient } from '@tanstack/react-query';
import { config } from '@/configurations';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: config.query.staleTime,
      retry: (failureCount, error: unknown) => {
        // Do not retry auth failures — api-client already handles refresh.
        if (
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          (error as { status: number }).status === 401
        ) {
          return false;
        }
        return failureCount < config.query.retry;
      },
      refetchOnWindowFocus: false,
    },
  },
});
