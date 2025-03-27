import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NCR_CITIES } from "@/constants/gasStations";
import type { ImportStatus, OverallProgress } from "@/constants/gasStations";
import {
  normalizeBrand,
  formatAmenities,
  formatOperatingHours,
  fetchPlaceDetails,
  searchGasStations,
} from "@/utils/placesApi";
import { queryKeys } from "../utils/queryKeys";
import { defaultMutationOptions } from "../utils/queryOptions";
import { supabase } from "@/utils/supabase/supabase";
import type {
  Station,
  GooglePlacesStation,
  PlaceDetails,
} from "../utils/types";

// Types
interface ImportStationsState {
  apiKey: string;
  importStatuses: ImportStatus[];
  overallProgress: OverallProgress;
}

interface ImportProgress {
  totalStations: number;
  processedCount: number;
  importedStations: number;
}

interface SearchStationsParams {
  city: string;
  apiKey: string;
}

// Service functions
const importStationsToDb = async (stations: Station[]): Promise<Station[]> => {
  const { data, error } = await supabase
    .from("gas_stations")
    .upsert(stations, {
      onConflict: "name,address",
      ignoreDuplicates: true,
    })
    .select();

  if (error) throw error;
  return data || [];
};

const processStationDetails = async (
  station: GooglePlacesStation,
  apiKey: string,
  city: string
): Promise<Station | null> => {
  try {
    const details = (await fetchPlaceDetails(
      station.place_id,
      apiKey
    )) as PlaceDetails;

    return {
      name: station.name,
      brand: normalizeBrand(station.name),
      address: details.formatted_address,
      city,
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      amenities: formatAmenities(details),
      operating_hours: formatOperatingHours(details),
      status: "active" as const,
    };
  } catch (error) {
    console.error(`Error processing station ${station.name}:`, error);
    return null;
  }
};

export function useImportStations() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ImportStationsState>({
    apiKey: "",
    importStatuses: NCR_CITIES.map((city) => ({ city, status: "pending" })),
    overallProgress: { total: 0, processed: 0, imported: 0 },
  });

  // State management
  const setApiKey = useCallback((key: string) => {
    setState((prev) => ({ ...prev, apiKey: key }));
  }, []);

  const updateCityStatus = useCallback(
    (city: string, update: Partial<ImportStatus>) => {
      setState((prev) => ({
        ...prev,
        importStatuses: prev.importStatuses.map((status) =>
          status.city === city ? { ...status, ...update } : status
        ),
      }));
    },
    []
  );

  const updateProgress = useCallback((progress: Partial<OverallProgress>) => {
    setState((prev) => ({
      ...prev,
      overallProgress: { ...prev.overallProgress, ...progress },
    }));
  }, []);

  // Mutations
  const importMutation = useMutation({
    mutationKey: [...queryKeys.admin.stations.import()],
    mutationFn: importStationsToDb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.stations.all] });
    },
  });

  const searchStationsMutation = useMutation({
    mutationKey: [...queryKeys.admin.stations.all(), "search"],
    mutationFn: async ({
      city,
      apiKey,
    }: SearchStationsParams): Promise<GooglePlacesStation[]> => {
      return searchGasStations(city, apiKey);
    },
  });

  // Main import function
  const importGasStations = async () => {
    if (!state.apiKey.trim()) {
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }

    setState((prev) => ({
      ...prev,
      importStatuses: NCR_CITIES.map((city) => ({ city, status: "pending" })),
      overallProgress: { total: 0, processed: 0, imported: 0 },
    }));

    const progress: ImportProgress = {
      totalStations: 0,
      processedCount: 0,
      importedStations: 0,
    };

    try {
      for (const city of NCR_CITIES) {
        await processCityImport(city, state.apiKey, progress);
      }

      Alert.alert(
        "Import Complete",
        `Successfully imported ${progress.importedStations} new stations out of ${progress.totalStations} found.`
      );
    } catch (error) {
      console.error("Import failed:", error);
      Alert.alert("Error", "Failed to import stations. Please try again.");
    }
  };

  // Helper function to process a single city
  const processCityImport = async (
    city: string,
    apiKey: string,
    progress: ImportProgress
  ) => {
    updateCityStatus(city, { status: "in-progress" });

    try {
      const stations = await searchStationsMutation.mutateAsync({
        city,
        apiKey,
      });

      progress.totalStations += stations.length;
      updateProgress({ total: progress.totalStations });

      const processedResults = await Promise.all(
        stations.map((station: GooglePlacesStation) =>
          processStationDetails(station, apiKey, city)
        )
      );

      const validStations = processedResults.filter(
        (station): station is Station => station !== null
      );

      if (validStations.length > 0) {
        const result = await importMutation.mutateAsync(validStations);
        progress.importedStations += result.length;
      }

      progress.processedCount += stations.length;
      updateProgress({
        processed: progress.processedCount,
        imported: progress.importedStations,
      });

      updateCityStatus(city, {
        status: "completed",
        stationsFound: stations.length,
        stationsImported: validStations.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      updateCityStatus(city, {
        status: "error",
        error: errorMessage,
      });
      throw error;
    }
  };

  return {
    apiKey: state.apiKey,
    setApiKey,
    isPending: importMutation.isPending || searchStationsMutation.isPending,
    importStatuses: state.importStatuses,
    overallProgress: state.overallProgress,
    importGasStations,
  };
}
