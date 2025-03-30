import type { LocationData } from "@/hooks/useLocation";
import type { FuelType } from "@/hooks/queries/prices/useBestPrices";
import { BestPricesParams } from "./types";

export interface PriceCycleParams {
  id?: string;
}

export const queryKeys = {
  prices: {
    all: ["prices"] as const,
    cycles: {
      all: () => [...queryKeys.prices.all, "cycles"] as const,
      list: (params?: PriceCycleParams) =>
        [...queryKeys.prices.cycles.all(), "list", params] as const,
      detail: (id: string) =>
        [...queryKeys.prices.cycles.all(), "detail", id] as const,
      active: () => [...queryKeys.prices.cycles.all(), "active"] as const,
      nextNumber: () =>
        [...queryKeys.prices.cycles.all(), "nextNumber"] as const,
    },
    best: {
      all: () => [...queryKeys.prices.all, "best"] as const,
      list: (params: BestPricesParams) =>
        [...queryKeys.prices.best.all(), "list", params] as const,
      byFuel: (fuelType: FuelType) =>
        [...queryKeys.prices.best.all(), "fuel", fuelType] as const,
    },
    reports: {
      all: () => [...queryKeys.prices.all, "reports"] as const,
      list: () => [...queryKeys.prices.reports.all(), "list"] as const,
      byCycle: (cycleId: string) =>
        [...queryKeys.prices.reports.all(), "cycle", cycleId] as const,
    },
    confirmations: {
      all: () => [...queryKeys.prices.all, "confirmations"] as const,
      detail: (reportId: string, userId?: string) =>
        [...queryKeys.prices.confirmations.all(), reportId, userId] as const,
      byUser: (userId: string) =>
        [...queryKeys.prices.confirmations.all(), "user", userId] as const,
    },
  },
  stations: {
    all: ["stations"] as const,
    list: () => [...queryKeys.stations.all, "list"] as const,
    detail: (id: string) => [...queryKeys.stations.all, "detail", id] as const,
    nearby: (params: { location: LocationData | null; radiusKm: number }) =>
      [...queryKeys.stations.all, "nearby", params] as const,
  },
  users: {
    all: ["users"] as const, // Keep this as an array
    // Reference queryKeys.users.all directly
    profile: (userId: string | undefined) =>
      [...queryKeys.users.all, "profile", userId] as const,
    preferences: () => [...queryKeys.users.all, "preferences"] as const, // This was already correct
    // Reference queryKeys.users.all directly
    contributions: (userId: string | undefined) =>
      [...queryKeys.users.all, "contributions", userId] as const,
  },
  admin: {
    all: ["admin"] as const,
    users: {
      all: () => [...queryKeys.admin.all, "users"] as const,
      list: () => [...queryKeys.admin.users.all(), "list"] as const,
    },
    stations: {
      all: () => [...queryKeys.admin.all, "stations"] as const,
      list: () => [...queryKeys.admin.stations.all(), "list"] as const,
      import: () => [...queryKeys.admin.stations.all(), "import"] as const,
    },
    stats: {
      all: () => [...queryKeys.admin.all, "stats"] as const,
    },
  },
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
} as const;
