import { QueryClient } from "@tanstack/react-query";

// Create the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export { queryClient };
