import type { LocationData } from "@/hooks/useLocation";
import type { FuelType } from "@/hooks/queries/prices/useBestPrices";
import { BestPricesParams } from "./types";

export interface PriceCycleParams {
  id?: string;
  isActive?: boolean;
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
  },
  users: {
    all: ["users"] as const,
    profile: () => [...queryKeys.users.all, "profile"] as const,
    preferences: () => [...queryKeys.users.all, "preferences"] as const,
  },
} as const;
