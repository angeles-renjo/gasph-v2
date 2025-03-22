import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default staleTime for queries (10 minutes)
      staleTime: 1000 * 60 * 10,
      // Default cacheTime for queries (15 minutes)
      gcTime: 1000 * 60 * 15,
      // Default retry policy
      retry: 1,
      // Default refetch behavior
      refetchOnWindowFocus: false,
    },
  },
});
