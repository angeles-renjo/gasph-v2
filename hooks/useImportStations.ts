import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { NCR_CITIES, RATE_LIMIT } from "@/constants/gasStations";
import { ImportStatus, OverallProgress } from "@/constants/gasStations";
import {
  normalizeBrand,
  formatAmenities,
  formatOperatingHours,
  fetchPlaceDetails,
  searchGasStations,
} from "@/utils/placesApi";
import { useImportStationsMutation } from "./queries/admin/useImportStationsMutation";

// Utilities
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeout]);
};

const retryOperation = async <T>(
  operation: () => Promise<T>,
  retryCount = 0,
  context = ""
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retryCount < RATE_LIMIT.RETRY.MAX_ATTEMPTS) {
      const waitTime = Math.min(
        RATE_LIMIT.RETRY.BASE_DELAY * Math.pow(2, retryCount),
        RATE_LIMIT.RETRY.MAX_DELAY
      );
      console.log(
        `${context} - Retry ${retryCount + 1} in ${waitTime}ms`,
        error
      );
      await delay(waitTime);
      return retryOperation(operation, retryCount + 1, context);
    }
    throw error;
  }
};

export function useImportStations() {
  const [apiKey, setApiKey] = useState<string>("");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>(
    NCR_CITIES.map((city) => ({ city, status: "pending" }))
  );
  const [overallProgress, setOverallProgress] = useState<OverallProgress>({
    total: 0,
    processed: 0,
    imported: 0,
  });

  const importMutation = useImportStationsMutation();

  const updateCityStatus = useCallback(
    (city: string, update: Partial<ImportStatus>) => {
      setImportStatuses((prevStatuses) =>
        prevStatuses.map((status) =>
          status.city === city ? { ...status, ...update } : status
        )
      );
    },
    []
  );

  const updateOverallProgress = useCallback(
    (update: (prev: OverallProgress) => OverallProgress) => {
      setOverallProgress(update);
    },
    []
  );

  const resetImport = useCallback(() => {
    setImportStatuses(NCR_CITIES.map((city) => ({ city, status: "pending" })));
    setOverallProgress({ total: 0, processed: 0, imported: 0 });
  }, []);

  const processStation = async (station: any, apiKey: string, city: string) => {
    try {
      await delay(RATE_LIMIT.DETAILS.DELAY);

      const details = await retryOperation(
        () =>
          withTimeout(
            fetchPlaceDetails(station.place_id, apiKey),
            30000,
            `Timeout fetching details for ${station.name}`
          ),
        0,
        `Fetching details for ${station.name}`
      );

      const brand = normalizeBrand(station.name);
      const amenities = formatAmenities(details);
      const operatingHours = formatOperatingHours(details);

      return {
        name: station.name,
        brand,
        address: details.formatted_address,
        city,
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        amenities,
        operating_hours: operatingHours,
      };
    } catch (error: any) {
      console.error(`Error processing station ${station.name}:`, error);
      throw error;
    }
  };

  const importGasStations = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Error", "Please enter a valid API key");
      return;
    }

    setIsImporting(true);
    resetImport();

    try {
      let totalStations = 0;
      let processedCount = 0;
      let importedStations = 0;

      for (const city of NCR_CITIES) {
        updateCityStatus(city, { status: "in-progress" });

        try {
          const stations = await retryOperation(
            () =>
              withTimeout(
                searchGasStations(city, apiKey),
                30000,
                `Timeout searching stations in ${city}`
              ),
            0,
            `Searching stations in ${city}`
          );

          totalStations += stations.length;
          updateOverallProgress((prev) => ({ ...prev, total: totalStations }));

          const processedResults = await Promise.all(
            stations.map((station: { place_id: string; name: string }) =>
              processStation(station, apiKey, city).catch((error) => {
                console.error(`Error processing station:`, error);
                return null;
              })
            )
          );

          const validStations = processedResults.filter(
            (station): station is NonNullable<typeof station> =>
              station !== null
          );

          if (validStations.length > 0) {
            const result = await importMutation.mutateAsync(validStations);
            importedStations += result.length;
          }

          processedCount += stations.length;
          updateOverallProgress((prev) => ({
            ...prev,
            processed: processedCount,
            imported: importedStations,
          }));

          updateCityStatus(city, {
            status: "completed",
            stationsFound: stations.length,
            stationsImported: validStations.length,
          });
        } catch (error: any) {
          console.error(`Error importing stations for ${city}:`, error);
          updateCityStatus(city, {
            status: "error",
            error: error.message,
          });
        }
      }

      Alert.alert(
        "Import Complete",
        `Successfully imported ${importedStations} new stations out of ${totalStations} found.`
      );
    } catch (error: any) {
      console.error("Import failed:", error);
      Alert.alert("Error", "Failed to import stations. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  return {
    apiKey,
    setApiKey,
    isImporting,
    importStatuses,
    overallProgress,
    importGasStations,
  };
}
