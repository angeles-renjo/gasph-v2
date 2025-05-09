import type { LocationData } from '@/constants/map/locationConstants';
import type { FuelType } from '@/hooks/queries/prices/useBestPrices';
import { BestPricesParams } from './types';

// Updated PriceCycleParams to include filter options
export interface PriceCycleParams {
  id?: string;
  showArchived?: boolean; // Added filter param
}

export const queryKeys = {
  prices: {
    all: ['prices'] as const,
    cycles: {
      all: () => [...queryKeys.prices.all, 'cycles'] as const,
      list: (params?: PriceCycleParams) =>
        [...queryKeys.prices.cycles.all(), 'list', params] as const,
      detail: (id: string) =>
        [...queryKeys.prices.cycles.all(), 'detail', id] as const,
      active: () => [...queryKeys.prices.cycles.all(), 'active'] as const,
      nextNumber: () =>
        [...queryKeys.prices.cycles.all(), 'nextNumber'] as const,
    },
    best: {
      all: () => [...queryKeys.prices.all, 'best'] as const,
      list: (params: BestPricesParams) =>
        [...queryKeys.prices.best.all(), 'list', params] as const,
      byFuel: (fuelType: FuelType) =>
        [...queryKeys.prices.best.all(), 'fuel', fuelType] as const,
    },
    reports: {
      all: () => [...queryKeys.prices.all, 'reports'] as const,
      list: () => [...queryKeys.prices.reports.all(), 'list'] as const,
      byCycle: (cycleId: string) =>
        [...queryKeys.prices.reports.all(), 'cycle', cycleId] as const,
    },
    confirmations: {
      all: () => [...queryKeys.prices.all, 'confirmations'] as const,
      detail: (reportId: string, userId?: string) =>
        [...queryKeys.prices.confirmations.all(), reportId, userId] as const,
      byUser: (userId: string) =>
        [...queryKeys.prices.confirmations.all(), 'user', userId] as const,
    },
  },
  stations: {
    all: ['stations'] as const,
    list: () => [...queryKeys.stations.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.stations.all, 'detail', id] as const,
    nearby: (params: {
      location: LocationData | null;
      radiusKm: number;
      isOptimized?: boolean;
    }) => [...queryKeys.stations.all, 'nearby', params] as const,
    // Add key for fetching stations with price for a specific fuel type
    listWithPrice: (fuelType: FuelType | 'none') =>
      [...queryKeys.stations.all, 'listWithPrice', fuelType] as const,
    // Add key for infinite list of stations sorted by distance
    listInfinite: (params: {
      location: string;
      searchTerm?: string;
      brandFilter?: string | string[];
    }) => [...queryKeys.stations.all, 'listInfinite', params] as const,
    // Add key for fetching all prices of a specific fuel type for a station
    fuelTypePrices: (stationId: string, fuelType: string) =>
      [
        ...queryKeys.stations.detail(stationId), // Reuse detail key structure
        'fuelType',
        fuelType,
      ] as const,
    // Add key for fetching DOE price for a specific station/fuel type
    doePrice: (stationId: string, fuelType: string) =>
      [
        ...queryKeys.stations.detail(stationId), // Reuse detail key structure
        'doePrice',
        fuelType,
      ] as const,
    favorites: {
      list: (userId: string) =>
        [...queryKeys.stations.all, 'favorites', 'list', userId] as const,
      isFavorite: (userId: string, stationId: string) =>
        [
          ...queryKeys.stations.all,
          'favorites',
          'isFavorite',
          userId,
          stationId,
        ] as const,
      // Add key for fetching prices for favorite stations
      prices: (
        userId: string | undefined,
        fuelType: FuelType | undefined,
        lat?: number,
        lng?: number
      ) =>
        [
          ...queryKeys.stations.all,
          'favorites',
          'prices',
          userId,
          fuelType,
          { lat, lng }, // Include location coords
        ] as const,
    },
  },
  users: {
    all: ['users'] as const, // Keep this as an array
    // Reference queryKeys.users.all directly
    profile: (userId: string | undefined) =>
      [...queryKeys.users.all, 'profile', userId] as const,
    preferences: () => [...queryKeys.users.all, 'preferences'] as const, // This was already correct
    // Reference queryKeys.users.all directly
    contributions: (userId: string | undefined) =>
      [...queryKeys.users.all, 'contributions', userId] as const,
  },
  admin: {
    all: ['admin'] as const,
    users: {
      all: () => [...queryKeys.admin.all, 'users'] as const,
      list: () => [...queryKeys.admin.users.all(), 'list'] as const,
    },
    stations: {
      all: () => [...queryKeys.admin.all, 'stations'] as const,
      // Add optional searchTerm parameter
      list: (searchTerm?: string) =>
        [
          ...queryKeys.admin.stations.all(),
          'list',
          { searchTerm: searchTerm ?? '' }, // Use object for clarity, default empty string
        ] as const,
      import: () => [...queryKeys.admin.stations.all(), 'import'] as const,
    },
    stats: {
      all: () => [...queryKeys.admin.all, 'stats'] as const,
    },
    // Add keys for station reports
    reports: {
      all: () => [...queryKeys.admin.all, 'reports'] as const,
      // Key for listing reports by status (e.g., 'pending')
      list: (status: string) =>
        [...queryKeys.admin.reports.all(), 'list', status] as const,
    },
  },
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
} as const;
