import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { z } from 'zod'; // Import Zod
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { Tables, TablesUpdate } from '@/utils/supabase/types';
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations'; // Import map station type

// Type for the data needed to update a station (ID is required)
export type StationUpdateData = TablesUpdate<'gas_stations'> & { id: string };

// --- ZOD SCHEMA for Gas Station Update ---
// Most fields are optional for update, but ID is required.
const gasStationUpdateSchema = z.object({
  id: z.string().uuid('Invalid Station ID format.'), // Ensure ID is a valid UUID
  name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  place_id: z.string().min(1).nullable().optional(), // Allow null or string
  amenities: z.record(z.any()).nullable().optional(), // Allow any JSON structure
  operating_hours: z.record(z.any()).nullable().optional(), // Allow any JSON structure
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  // created_at, updated_at are handled by Supabase/optimistic updates
});
// --- END ZOD SCHEMA ---

export const useUpdateStationMutation = () => {
  const queryClient = useQueryClient();
  const adminStationListKey = queryKeys.admin.stations.list();
  const mapStationsBaseKey = [
    ...queryKeys.stations.all,
    'listWithPrice',
  ] as const;
  // Also consider invalidating the specific station details query
  // const stationDetailsBaseKey = queryKeys.stations.details(''); // Base part

  type UpdateMutationContext = {
    previousAdminStations?: {
      pages: { stations: Tables<'gas_stations'>[]; totalCount: number }[];
      pageParams: any[];
    };
    previousMapStations?: Map<QueryKey, GasStation[] | undefined>;
    previousStationDetails?: Map<QueryKey, Tables<'gas_stations'> | undefined>; // For specific station details
  };

  return useMutation<
    Tables<'gas_stations'> | null, // Return updated station data
    Error,
    StationUpdateData,
    UpdateMutationContext
  >({
    mutationFn: async (stationUpdateData) => {
      // --- ZOD VALIDATION ---
      const validationResult =
        gasStationUpdateSchema.safeParse(stationUpdateData);
      if (!validationResult.success) {
        console.error(
          'Zod Validation Error (useUpdateStationMutation):',
          validationResult.error.flatten()
        );
        const errorMessages = validationResult.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(`Invalid station update data: ${errorMessages}`);
      }
      // Use validated data for the update
      const { id, ...validatedUpdateData } = validationResult.data;
      // --- END ZOD VALIDATION ---

      // Ensure we don't try to update the ID itself
      const { data, error } = await supabase
        .from('gas_stations')
        .update(validatedUpdateData as TablesUpdate<'gas_stations'>) // Cast validated data
        .eq('id', id) // Use the validated ID from the schema result
        .select()
        .single();

      if (error) {
        console.error('Error updating station:', error);
        // Add specific error checks if needed (e.g., unique constraints if applicable on update)
        throw new Error(error.message || 'Failed to update station.');
      }
      return data;
    },
    // Pass validated data to onMutate? No, onMutate receives the original input.
    // Optimistic updates will use the original input `stationUpdateData`.
    // The actual update uses validated data.
    onMutate: async (stationUpdateData) => {
      const { id: stationIdToUpdate } = stationUpdateData;
      console.log('[UpdateStation] onMutate started', { stationUpdateData });

      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: adminStationListKey });
      await queryClient.cancelQueries({ queryKey: mapStationsBaseKey });
      const stationDetailsQueryKey =
        queryKeys.stations.detail(stationIdToUpdate); // Corrected: detail instead of details
      await queryClient.cancelQueries({ queryKey: stationDetailsQueryKey });

      // Snapshot previous values
      const previousAdminStations =
        queryClient.getQueryData<
          UpdateMutationContext['previousAdminStations']
        >(adminStationListKey);
      const previousMapStations = new Map<QueryKey, GasStation[] | undefined>();
      const previousStationDetails = new Map<
        QueryKey,
        Tables<'gas_stations'> | undefined
      >();

      // Snapshot specific station details
      const currentDetails = queryClient.getQueryData<Tables<'gas_stations'>>(
        stationDetailsQueryKey
      );
      previousStationDetails.set(stationDetailsQueryKey, currentDetails);

      // Snapshot map queries
      const mapQueries = queryClient.getQueryCache().findAll({
        queryKey: mapStationsBaseKey,
        type: 'active',
        exact: false,
      });
      mapQueries.forEach((cache) => {
        previousMapStations.set(
          cache.queryKey,
          queryClient.getQueryData<GasStation[]>(cache.queryKey)
        );
      });

      // Optimistically update station details
      if (currentDetails) {
        queryClient.setQueryData<Tables<'gas_stations'>>(
          stationDetailsQueryKey,
          {
            ...currentDetails,
            ...stationUpdateData,
            updated_at: new Date().toISOString(), // Optimistically set updated_at
          }
        );
      }

      // Optimistically update admin list (infinite query)
      queryClient.setQueryData<UpdateMutationContext['previousAdminStations']>(
        adminStationListKey,
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              stations: page.stations.map((station) =>
                station.id === stationIdToUpdate
                  ? {
                      ...station,
                      ...stationUpdateData,
                      updated_at: new Date().toISOString(),
                    } // Apply updates
                  : station
              ),
            })),
          };
        }
      );

      // Optimistically update map lists
      mapQueries.forEach((cache) => {
        const currentMapData = queryClient.getQueryData<GasStation[]>(
          cache.queryKey
        );
        if (currentMapData) {
          queryClient.setQueryData<GasStation[]>(
            cache.queryKey,
            currentMapData.map((station) => {
              if (station.id === stationIdToUpdate) {
                // Construct the updated map station object carefully
                // Ensure status conforms to GasStation type
                const validStatus =
                  stationUpdateData.status === 'active' ||
                  stationUpdateData.status === 'inactive'
                    ? stationUpdateData.status
                    : station.status; // Fallback to original status if update is invalid

                const updatedMapStation: GasStation = {
                  ...station, // Spread original station first
                  ...stationUpdateData, // Apply updates from input (may overwrite some fields)
                  id: station.id, // Ensure ID remains from original station
                  created_at: station.created_at ?? '', // Ensure created_at is string, use original
                  updated_at: new Date().toISOString(), // Set new updated_at
                  status: validStatus, // Apply validated status
                  // Ensure amenities/operating_hours types match GasStation interface
                  amenities:
                    typeof stationUpdateData.amenities === 'object' &&
                    stationUpdateData.amenities !== null &&
                    !Array.isArray(stationUpdateData.amenities)
                      ? (stationUpdateData.amenities as Record<string, boolean>)
                      : station.amenities, // Fallback to existing if update is not valid object
                  operating_hours:
                    typeof stationUpdateData.operating_hours === 'object' &&
                    stationUpdateData.operating_hours !== null &&
                    !Array.isArray(stationUpdateData.operating_hours)
                      ? (stationUpdateData.operating_hours as Record<
                          string,
                          string
                        >)
                      : station.operating_hours, // Fallback
                };
                // Remove id from the update data spread if it exists
                delete (updatedMapStation as any).id;
                return updatedMapStation;
              }
              return station;
            })
          );
        }
      });

      console.log('[UpdateStation] onMutate finished.');
      return {
        previousAdminStations,
        previousMapStations,
        previousStationDetails,
      };
    },
    onError: (err, stationUpdateData, context) => {
      console.error('[UpdateStation] onError triggered:', err);
      // Rollback admin list
      if (context?.previousAdminStations !== undefined) {
        queryClient.setQueryData(
          adminStationListKey,
          context.previousAdminStations
        );
      }
      // Rollback map lists
      if (context?.previousMapStations) {
        context.previousMapStations.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      // Rollback specific station details
      if (context?.previousStationDetails) {
        context.previousStationDetails.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      // Error Alert handled by calling component
    },
    onSettled: (data, error, variables) => {
      // Invalidate relevant queries to ensure freshness after mutation
      console.log('[UpdateStation] onSettled: Invalidating queries...');
      queryClient.invalidateQueries({ queryKey: adminStationListKey });
      queryClient.invalidateQueries({ queryKey: mapStationsBaseKey });
      queryClient.invalidateQueries({
        queryKey: queryKeys.stations.detail(variables.id), // Corrected: detail instead of details
      });
    },
  });
};
