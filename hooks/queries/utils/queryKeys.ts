import { BestPricesParams } from "./types";

export const queryKeys = {
  prices: {
    all: ["prices"] as const,
    cycles: {
      all: () => [...queryKeys.prices.all, "cycles"] as const,
      list: () => [...queryKeys.prices.cycles.all(), "list"] as const, // Remove params here
      active: () => [...queryKeys.prices.cycles.all(), "active"] as const,
      details: (id: string) =>
        [...queryKeys.prices.cycles.all(), "details", id] as const,
      nextNumber: () =>
        [...queryKeys.prices.cycles.all(), "nextNumber"] as const, // Add this
    },
    best: (params: BestPricesParams) =>
      [...queryKeys.prices.all, "best", params] as const,
    confirmations: (reportId: string) =>
      [...queryKeys.prices.all, "confirmations", reportId] as const,
  },
  stations: {
    all: ["stations"] as const,
    // We'll add more as we implement station features
  },
  users: {
    all: ["users"] as const,
    // We'll add more as we implement user features
  },
} as const;

// Type for the queryKeys object
export type QueryKeys = typeof queryKeys;
