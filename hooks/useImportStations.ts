// hooks/useImportStations.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { NCR_CITIES } from '@/constants/gasStations';
import {
  normalizeBrand,
  formatAmenities,
  formatOperatingHours,
  fetchPlaceDetails,
  searchGasStations,
} from '@/utils/placesApi';

export interface ImportStatus {
  city: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  stationsFound?: number;
  stationsImported?: number;
  error?: string;
}

interface OverallProgress {
  total: number;
  processed: number;
  imported: number;
}

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

  const updateCityStatus = (city: string, update: Partial<ImportStatus>) => {
    setImportStatuses((prevStatuses) =>
      prevStatuses.map((status) =>
        status.city === city ? { ...status, ...update } : status
      )
    );
  };

  const updateOverallProgress = (update: Partial<OverallProgress>) => {
    setOverallProgress((prev: OverallProgress) => ({ ...prev, ...update }));
  };

  const resetImport = () => {
    setImportStatuses(NCR_CITIES.map((city) => ({ city, status: 'pending' })));
    setOverallProgress({ total: 0, processed: 0, imported: 0 });
  };

  const importGasStations = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a Google Places API key.');
      return;
    }

    setIsImporting(true);
    resetImport();

    // Process each city
    for (const city of NCR_CITIES) {
      try {
        updateCityStatus(city, { status: 'in-progress' });

        // Search for gas stations in this city
        const stations = await searchGasStations(city, apiKey);
        updateCityStatus(city, { stationsFound: stations.length });
        updateOverallProgress({
          total: overallProgress.total + stations.length,
        });

        let importedCount = 0;

        // Process each station
        for (const station of stations) {
          try {
            // Get detailed information about the place
            const details = await fetchPlaceDetails(station.place_id, apiKey);

            // Check if the station already exists in the database
            const { data: existingStations, error: queryError } = await supabase
              .from('gas_stations')
              .select('id')
              .eq('name', station.name)
              .eq(
                'address',
                station.formatted_address || details.formatted_address
              )
              .limit(1);

            if (queryError) {
              console.error('Error checking for existing station:', queryError);
              continue;
            }

            // If the station doesn't exist, insert it
            if (!existingStations || existingStations.length === 0) {
              const newStation = {
                name: station.name,
                brand: normalizeBrand(station.name),
                address: station.formatted_address || details.formatted_address,
                city: city,
                province: 'Metro Manila',
                latitude: station.geometry?.location.lat,
                longitude: station.geometry?.location.lng,
                amenities: formatAmenities(details),
                operating_hours: formatOperatingHours(details),
                status: 'active',
              };

              const { error: insertError } = await supabase
                .from('gas_stations')
                .insert(newStation);

              if (insertError) {
                console.error('Error inserting station:', insertError);
                continue;
              }

              importedCount++;
            }

            updateOverallProgress({
              processed: overallProgress.processed + 1,
              imported:
                overallProgress.imported +
                (existingStations?.length === 0 ? 1 : 0),
            });
          } catch (stationError) {
            console.error(
              `Error processing station ${station.name}:`,
              stationError
            );
          }
        }

        updateCityStatus(city, {
          status: 'completed',
          stationsImported: importedCount,
        });
      } catch (cityError) {
        console.error(`Error importing stations for ${city}:`, cityError);
        updateCityStatus(city, {
          status: 'error',
          error:
            cityError instanceof Error ? cityError.message : 'Unknown error',
        });
      }
    }

    setIsImporting(false);
    Alert.alert(
      'Import Complete',
      `Processed ${overallProgress.processed} stations, imported ${overallProgress.imported} new stations.`
    );
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
