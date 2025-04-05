import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NCR_CITIES } from '@/constants/gasStations'; // Assuming this might be removed/changed later for dynamic regions
import type { ImportStatus, OverallProgress } from '@/constants/gasStations';
import {
  normalizeBrand,
  formatAmenities,
  formatOperatingHours,
  fetchPlaceDetails,
  searchGasStations,
} from '@/utils/placesApi';
import { queryKeys } from '../utils/queryKeys';
import { supabase } from '@/utils/supabase/supabase';
import type {
  Station, // Ensure this type includes place_id (added in previous step)
  GooglePlacesStation,
  PlaceDetails,
} from '../utils/types';

// Types
interface ImportStationsState {
  apiKey: string;
  importStatuses: ImportStatus[]; // This will need adjustment for dynamic cities
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
  // Ensure place_id column exists in gas_stations table and has a unique constraint
  // Ensure place_id column exists in gas_stations table and has a unique constraint
  const { data, error } = await supabase
    .from('gas_stations')
    .upsert(stations, {
      onConflict: 'place_id', // Use place_id for conflict resolution
      ignoreDuplicates: false, // Let upsert handle updates based on place_id
    })
    .select();

  if (error) {
    console.error('Supabase upsert error:', error);
    throw error;
  }
  return data || [];
};

const processStationDetails = async (
  station: GooglePlacesStation,
  apiKey: string,
  city: string // City might be derived differently in the future
): Promise<Station | null> => {
  try {
    const details = (await fetchPlaceDetails(
      station.place_id,
      apiKey
    )) as PlaceDetails;

    // Check if the station is operational
    if (details.business_status !== 'OPERATIONAL') {
      console.log(
        `Skipping non-operational station: ${station.name} (${station.place_id}) - Status: ${details.business_status}`
      );
      return null;
    }

    // Ensure required fields exist
    if (!details.formatted_address || !details.geometry?.location) {
      console.warn(
        `Skipping station due to missing details: ${station.name} (${station.place_id})`
      );
      return null;
    }

    // Prepare operating hours for JSONB storage
    const operatingHoursData = formatOperatingHours(details);

    // Extract province from address_components
    let province = 'Unknown'; // Default fallback
    if (details.address_components) {
      const provinceComponent = details.address_components.find((comp) =>
        comp.types.includes('administrative_area_level_1')
      );
      if (provinceComponent) {
        province = provinceComponent.long_name;
      } else {
        // Fallback if province component not found (e.g., use city as province if appropriate)
        // For Metro Manila, city often serves as province-level identifier
        if (city.includes('Metro Manila') || city.endsWith('City')) {
          province = city;
        }
        console.warn(
          `Province component not found for ${station.name}, using fallback: ${province}`
        );
      }
    } else {
      console.warn(
        `Address components missing for ${station.name}, using fallback province: ${province}`
      );
    }

    return {
      place_id: station.place_id, // Re-added: Column now exists and type requires it
      name: station.name,
      brand: normalizeBrand(station.name),
      address: details.formatted_address,
      city,
      province, // Added province
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      amenities: formatAmenities(details),
      operating_hours: operatingHoursData, // Store the formatted object
      status: 'active' as const,
    };
  } catch (error) {
    console.error(
      `Error processing station ${station.name} (${station.place_id}):`,
      error
    );
    // return null; // Don't return null, let the error propagate
    throw error; // Re-throw the error so Promise.all rejects
  }
};

export function useImportStations() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ImportStationsState>({
    apiKey: '',
    // TODO: Initialize importStatuses dynamically based on available cities/regions later
    importStatuses: NCR_CITIES.map((city) => ({ city, status: 'pending' })),
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
    onSuccess: (importedData) => {
      // Invalidate queries to refresh station lists and stats
      queryClient.invalidateQueries({ queryKey: [...queryKeys.stations.all] });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.stations.all()],
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.admin.stats.all()],
      });
      console.log(`Successfully upserted ${importedData.length} stations.`);
    },
    onError: (error) => {
      console.error('Import mutation failed:', error);
      // Error is handled more specifically in processCityImport
    },
  });

  const searchStationsMutation = useMutation({
    mutationKey: [...queryKeys.admin.stations.all(), 'search'],
    mutationFn: async ({
      city,
      apiKey,
    }: SearchStationsParams): Promise<GooglePlacesStation[]> => {
      // This uses the updated searchGasStations from utils/placesApi.ts
      return searchGasStations(city, apiKey);
    },
  });

  // Main import function - Now accepts a city parameter
  const importGasStations = async (cityToImport: string) => {
    if (!state.apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }
    if (!cityToImport.trim()) {
      Alert.alert('Error', 'Please enter a city name to import');
      return;
    }

    // Reset state for the specific city being imported
    setState((prev) => ({
      ...prev,
      importStatuses: prev.importStatuses.map((status) =>
        status.city === cityToImport
          ? { city: cityToImport, status: 'pending' } // Reset only the target city
          : status
      ),
      // Reset overall progress for this specific import run
      overallProgress: { total: 0, processed: 0, imported: 0 },
    }));

    const progress: ImportProgress = {
      totalStations: 0,
      processedCount: 0,
      importedStations: 0,
    };

    try {
      // Process only the specified city
      await processCityImport(cityToImport, state.apiKey, progress);

      // Find the final status for the imported city
      const finalStatus = state.importStatuses.find(
        (s) => s.city === cityToImport
      );

      Alert.alert(
        `Import Complete for ${cityToImport}`,
        `Processed ${progress.totalStations} potential stations. Upserted ${progress.importedStations} stations.`
      );
    } catch (error) {
      // Error is logged within processCityImport, show a general alert here
      Alert.alert(
        'Import Error',
        'An error occurred during the import process. Check console for details.'
      );
    }
  };

  // Helper function to process a single city
  const processCityImport = async (
    city: string,
    apiKey: string,
    progress: ImportProgress
  ) => {
    updateCityStatus(city, { status: 'in-progress' });

    try {
      const stations = await searchStationsMutation.mutateAsync({
        city,
        apiKey,
      });
      console.log(`Found ${stations.length} potential stations in ${city}.`);

      progress.totalStations += stations.length;
      updateProgress({ total: progress.totalStations });

      const processedResults = await Promise.all(
        stations.map((station: GooglePlacesStation) =>
          processStationDetails(station, apiKey, city)
        )
      );

      // Filter out null results (non-operational or missing details)
      const validStations = processedResults.filter(
        (station): station is Station => station !== null
      );
      console.log(
        `Processing ${validStations.length} valid stations for ${city}.`
      );

      let importedCount = 0;
      if (validStations.length > 0) {
        // Upsert valid stations based on place_id
        const result = await importMutation.mutateAsync(validStations);
        importedCount = result.length; // Count how many were actually upserted/returned
        progress.importedStations += importedCount;
      }

      progress.processedCount += stations.length; // Increment processed by total found initially
      updateProgress({
        processed: progress.processedCount,
        imported: progress.importedStations,
      });

      updateCityStatus(city, {
        status: 'completed',
        stationsFound: stations.length,
        stationsImported: importedCount, // Report count actually upserted
      });
      console.log(
        `Completed import for ${city}. Found: ${stations.length}, Valid: ${validStations.length}, Upserted: ${importedCount}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred searching or importing.';
      console.error(`Error importing for ${city}:`, errorMessage);
      updateCityStatus(city, {
        status: 'error',
        error: errorMessage,
      });
      // Re-throw to stop the overall import process if one city fails critically
      // Or handle differently if you want to continue with other cities
      throw error;
    }
  };

  return {
    apiKey: state.apiKey,
    setApiKey,
    // Consider refining isPending based on which mutation is active
    isPending: importMutation.isPending || searchStationsMutation.isPending,
    importStatuses: state.importStatuses,
    overallProgress: state.overallProgress,
    importGasStations, // This function needs adjustment to take a city parameter
  };
}
