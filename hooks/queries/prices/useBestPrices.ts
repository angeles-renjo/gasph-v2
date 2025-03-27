import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { queryKeys } from "../utils/queryKeys";
import { defaultQueryOptions } from "../utils/queryOptions";
import type { LocationData } from "@/hooks/useLocation";
import { calculateDistance } from "@/lib/geo";

export type FuelType =
  | "Diesel"
  | "RON 91"
  | "RON 95"
  | "RON 97"
  | "RON 100"
  | "Diesel Plus";

// Define what we select from the view
interface PriceReportSelect {
  id: string;
  station_id: string;
  fuel_type: string;
  price: number;
  user_id: string;
  reported_at: string;
  expires_at: string;
  cycle_id: string;
  station_name: string;
  station_brand: string;
  station_city: string;
  station_latitude: number;
  station_longitude: number;
  reporter_username: string;
  confirmations_count: number;
  confidence_score: number;
}

// Extend with distance property
interface BestPrice extends PriceReportSelect {
  distance?: number;
}

export interface UseBestPricesOptions {
  fuelType?: FuelType;
  maxDistance?: number;
  enabled?: boolean;
  providedLocation?: LocationData;
}

export function useBestPrices({
  fuelType,
  maxDistance = 15,
  enabled = true,
  providedLocation,
}: UseBestPricesOptions = {}) {
  const location = providedLocation;

  return useQuery({
    queryKey: queryKeys.prices.best.list({
      location,
      fuelType,
      maxDistance,
    }),
    queryFn: async () => {
      try {
        if (!location) {
          throw new Error("Location not available");
        }

        let query = supabase
          .from("active_price_reports")
          .select(
            `
            id,
            station_id,
            fuel_type,
            price,
            user_id,
            reported_at,
            expires_at,
            cycle_id,
            station_name,
            station_brand,
            station_city,
            station_latitude,
            station_longitude,
            reporter_username,
            confirmations_count,
            confidence_score
          `
          )
          .order("price", { ascending: true });

        // Only add the fuel type filter if one is specified
        if (fuelType) {
          query = query.eq("fuel_type", fuelType);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (!data) {
          return { prices: [], stats: null };
        }

        // Process and sort the results
        const pricesWithDistance = (data as PriceReportSelect[])
          .map((price) => ({
            ...price,
            distance: calculateDistance(location, {
              latitude: price.station_latitude,
              longitude: price.station_longitude,
            }),
          }))
          .filter((price) => {
            const distance = price.distance as number;
            return !isNaN(distance) && distance <= maxDistance;
          })
          .sort((a, b) => {
            // Primary sort by price
            if (a.price !== b.price) {
              return a.price - b.price;
            }
            // Secondary sort by distance
            return (a.distance as number) - (b.distance as number);
          });

        // Calculate stats
        const stats = pricesWithDistance.length
          ? {
              count: pricesWithDistance.length,
              averagePrice:
                pricesWithDistance.reduce((sum, p) => sum + p.price, 0) /
                pricesWithDistance.length,
              lowestPrice: pricesWithDistance[0]?.price,
              highestPrice:
                pricesWithDistance[pricesWithDistance.length - 1]?.price,
            }
          : null;

        return {
          prices: pricesWithDistance,
          stats,
        };
      } catch (error) {
        console.error("Error fetching best prices:", error);
        throw error;
      }
    },
    ...defaultQueryOptions.prices.best,
    enabled: Boolean(location && enabled),
  });
}

// Export types for consumers
export type { BestPrice };
