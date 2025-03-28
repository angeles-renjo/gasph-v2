export const defaultQueryOptions = {
  prices: {
    best: {
      staleTime: 2 * 60 * 1000, // 2 minutes - prices need frequent updates
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    cycles: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
    reports: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
    confirmations: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  },
  stations: {
    list: {
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      gcTime: 48 * 60 * 60 * 1000, // 48 hours
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
    detail: {
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 2 * 60 * 60 * 1000, // 2 hours
      refetchOnMount: true,
    },
    nearby: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
  users: {
    profile: {
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
    preferences: {
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
      refetchOnMount: true,
    },
  },
  admin: {
    users: {
      list: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnMount: true,
        refetchOnWindowFocus: true,
      },
    },
    stations: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
    stats: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: false,
    },
  },
  auth: {
    session: {
      staleTime: Infinity, // Session data shouldn't go stale
      gcTime: Infinity, // Don't garbage collect session data
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 0,
    },
    profile: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  },
} as const;

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
  stations: {
    nearby: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
} as const;
