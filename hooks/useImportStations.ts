// hooks/useImportStations.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/supabase';
import { NCR_CITIES, RATE_LIMIT } from '@/constants/gasStations';
import {
  GasStation,
  ImportStatus,
  OverallProgress,
} from '@/constants/gasStations';
import {
  normalizeBrand,
  formatAmenities,
  formatOperatingHours,
  fetchPlaceDetails,
  searchGasStations,
} from '@/utils/placesApi';

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
  context = ''
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
  const [apiKey, setApiKey] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>(
    NCR_CITIES.map((city) => ({ city, status: 'pending' }))
  );
  const [overallProgress, setOverallProgress] = useState<OverallProgress>({
    total: 0,
    processed: 0,
    imported: 0,
  });

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
    setImportStatuses(NCR_CITIES.map((city) => ({ city, status: 'pending' })));
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

      const existingStationsResponse = await retryOperation<
        PostgrestSingleResponse<GasStation[]>
      >(
        async () =>
          await supabase
            .from('gas_stations')
            .select('id')
            .eq('name', station.name)
            .eq(
              'address',
              station.formatted_address || details.formatted_address
            )
            .limit(1)
            .single(),
        0,
        `Checking existing station: ${station.name}`
      );

      if (
        existingStationsResponse.error &&
        existingStationsResponse.error.code !== 'PGRST116'
      ) {
        throw existingStationsResponse.error;
      }

      if (!existingStationsResponse.data) {
        const newStation = {
          name: station.name,
          brand: normalizeBrand(station.name),
          address: station.formatted_address || details.formatted_address,
          city,
          province: 'Metro Manila',
          latitude: station.geometry?.location.lat,
          longitude: station.geometry?.location.lng,
          amenities: formatAmenities(details),
          operating_hours: formatOperatingHours(details),
          status: 'active',
        } as Omit<GasStation, 'id' | 'created_at' | 'updated_at'>;

        // Fixed typing for insert operation
        const { error: insertError } = await retryOperation(
          async () =>
            await supabase
              .from('gas_stations')
              .insert(newStation)
              .select()
              .single(),
          0,
          `Inserting station: ${station.name}`
        );

        if (insertError) throw insertError;
        return { processed: true, imported: true };
      }

      return { processed: true, imported: false };
    } catch (error: any) {
      console.error(`Error processing station ${station.name}:`, {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      return { processed: true, imported: false };
    }
  };

  const importGasStations = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a Google Places API key.');
      return;
    }

    let finalProcessed = 0;
    let finalImported = 0;

    try {
      setIsImporting(true);
      resetImport();

      for (const city of NCR_CITIES) {
        try {
          console.log(`Starting import for ${city}`);
          updateCityStatus(city, { status: 'in-progress' });

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

          console.log(`Found ${stations.length} stations in ${city}`);

          updateCityStatus(city, { stationsFound: stations.length });
          updateOverallProgress((prev) => ({
            ...prev,
            total: prev.total + stations.length,
          }));

          let cityImportCount = 0;

          for (const station of stations) {
            console.log(`Processing station: ${station.name}`);
            const result = await processStation(station, apiKey, city);

            if (result.processed) finalProcessed++;
            if (result.imported) {
              finalImported++;
              cityImportCount++;
            }

            updateOverallProgress((prev) => ({
              ...prev,
              processed: prev.processed + (result.processed ? 1 : 0),
              imported: prev.imported + (result.imported ? 1 : 0),
            }));
          }

          updateCityStatus(city, {
            status: 'completed',
            stationsImported: cityImportCount,
          });

          await delay(2000);
        } catch (cityError: any) {
          console.error(`Error importing stations for ${city}:`, cityError);
          updateCityStatus(city, {
            status: 'error',
            error: cityError.message || 'Unknown error',
          });
        }
      }
    } catch (error: any) {
      console.error('Import process error:', error);
      Alert.alert('Error', 'An error occurred during the import process.');
    } finally {
      setIsImporting(false);
      console.log('Final counts:', { finalProcessed, finalImported });
      Alert.alert(
        'Import Complete',
        `Processed ${finalProcessed} stations, imported ${finalImported} new stations.`
      );
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
