export const defaultQueryOptions = {
  prices: {
    best: {
      staleTime: 2 * 60 * 1000, // 2 minutes - prices need frequent updates
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    cycles: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
    reports: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
    confirmations: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  },
  stations: {
    list: {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 48 * 60 * 60 * 1000, // 48 hours
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
    detail: {
      staleTime: 60 * 60 * 1000, // 1 hour
      cacheTime: 2 * 60 * 60 * 1000, // 2 hours
      refetchOnMount: true,
    },
  },
  users: {
    profile: {
      staleTime: 30 * 60 * 1000, // 30 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
    preferences: {
      staleTime: 30 * 60 * 1000, // 30 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
      refetchOnMount: true,
    },
  },
} as const;

// Default mutation options if needed
export const defaultMutationOptions = {
  prices: {
    cycles: {
      retry: 1,
      retryDelay: 1000,
    },
    reports: {
      retry: 1,
      retryDelay: 1000,
    },
    confirmations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
  // Add other mutation options as needed
} as const;
