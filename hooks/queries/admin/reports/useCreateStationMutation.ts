import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { z } from 'zod'; // Import Zod
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { Tables, TablesInsert } from '@/utils/supabase/types';
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations'; // Import map station type

// --- ZOD SCHEMA for Gas Station Insert ---
const gasStationInsertSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  place_id: z.string().min(1).nullable(), // Allow null initially, handle unique constraint later
  amenities: z.record(z.any()).nullable().optional(), // Allow any JSON structure for amenities
  operating_hours: z.record(z.any()).nullable().optional(), // Allow any JSON structure for operating hours
  status: z
    .enum(['active', 'inactive', 'pending'])
    .optional()
    .default('active'), // Default status
  // created_at, updated_at, id are handled by Supabase
});
// --- END ZOD SCHEMA ---

export const useCreateStationMutation = () => {
  const queryClient = useQueryClient();
  const adminStationListKey = queryKeys.admin.stations.list();
  const mapStationsBaseKey = [
    ...queryKeys.stations.all,
    'listWithPrice',
  ] as const;

  type CreateMutationContext = {
    previousAdminStations?: {
      pages: { stations: Tables<'gas_stations'>[]; totalCount: number }[];
      pageParams: any[];
    };
    previousMapStations?: Map<QueryKey, GasStation[] | undefined>;
  };

  return useMutation<
    Tables<'gas_stations'> | null,
    Error,
    TablesInsert<'gas_stations'>,
    CreateMutationContext
  >({
    mutationFn: async (stationData) => {
      // --- ZOD VALIDATION ---
      const validationResult = gasStationInsertSchema.safeParse(stationData);
      if (!validationResult.success) {
        console.error(
          'Zod Validation Error (useCreateStationMutation):',
          validationResult.error.flatten()
        );
        // Combine Zod error messages for a clearer error
        const errorMessages = validationResult.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(`Invalid station data: ${errorMessages}`);
      }
      // Use validated data for the insert
      const validatedStationData = validationResult.data;
      // --- END ZOD VALIDATION ---

      const { data, error } = await supabase
        .from('gas_stations')
        .insert(validatedStationData as TablesInsert<'gas_stations'>) // Cast validated data
        .select()
        .single();

      if (error) {
        console.error('Error creating station:', error);
        if (error.message.includes('gas_stations_place_id_unique')) {
          throw new Error(`Station with this Google Place ID already exists.`);
        }
        if (error.message.includes('gas_stations_name_address_unique')) {
          throw new Error(`Station with this Name and Address already exists.`);
        }
        throw new Error(error.message || 'Failed to create station.');
      }
      return data;
    },
    onMutate: async (newStationData) => {
      // console.log('[CreateStation] onMutate started (Hook)', { // Removed console log
      //   newStationData,
      // });
      await queryClient.cancelQueries({ queryKey: adminStationListKey });
      await queryClient.cancelQueries({ queryKey: mapStationsBaseKey });

      const previousAdminStations =
        queryClient.getQueryData<
          CreateMutationContext['previousAdminStations']
        >(adminStationListKey);
      const previousMapStations = new Map<QueryKey, GasStation[] | undefined>();

      const mapQueries = queryClient.getQueryCache().findAll({
        queryKey: mapStationsBaseKey,
        type: 'active',
        exact: false,
      });
      // console.log( // Removed console log
      //   `[CreateStation] Found ${mapQueries.length} active map caches (Hook).`
      // );

      const optimisticAdminStation: Tables<'gas_stations'> = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        name: newStationData.name,
        brand: newStationData.brand,
        address: newStationData.address,
        city: newStationData.city,
        province: newStationData.province,
        latitude: newStationData.latitude,
        longitude: newStationData.longitude,
        amenities: newStationData.amenities ?? null,
        operating_hours: newStationData.operating_hours ?? null,
        place_id: newStationData.place_id ?? null,
      };

      const mapAmenities =
        typeof optimisticAdminStation.amenities === 'object' &&
        optimisticAdminStation.amenities !== null &&
        !Array.isArray(optimisticAdminStation.amenities)
          ? (optimisticAdminStation.amenities as Record<string, boolean>)
          : {};
      const mapOperatingHours =
        typeof optimisticAdminStation.operating_hours === 'object' &&
        optimisticAdminStation.operating_hours !== null &&
        !Array.isArray(optimisticAdminStation.operating_hours)
          ? (optimisticAdminStation.operating_hours as Record<string, string>)
          : {};
      const { place_id, ...adminStationBase } = optimisticAdminStation;
      const optimisticMapStation: GasStation = {
        ...adminStationBase,
        status: adminStationBase.status as 'active' | 'inactive',
        amenities: mapAmenities,
        operating_hours: mapOperatingHours,
        price: null,
        created_at: adminStationBase.created_at!,
        updated_at: adminStationBase.updated_at!,
      };

      // Optimistically update admin list (infinite query)
      queryClient.setQueryData<CreateMutationContext['previousAdminStations']>(
        adminStationListKey,
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            return {
              pages: [{ stations: [optimisticAdminStation], totalCount: 1 }],
              pageParams: [0],
            };
          }
          const newData = {
            ...oldData,
            pages: oldData.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  stations: [optimisticAdminStation, ...page.stations],
                };
              }
              return page;
            }),
          };
          return newData;
        }
      );

      // Optimistically update map lists
      mapQueries.forEach((cache) => {
        const currentMapData = queryClient.getQueryData<GasStation[]>(
          cache.queryKey
        );
        previousMapStations.set(cache.queryKey, currentMapData);
        if (currentMapData) {
          queryClient.setQueryData<GasStation[]>(cache.queryKey, [
            ...currentMapData,
            optimisticMapStation,
          ]);
        } else {
          queryClient.setQueryData<GasStation[]>(cache.queryKey, [
            optimisticMapStation,
          ]);
        }
      });

      // console.log('[CreateStation] onMutate finished (Hook).'); // Removed console log
      return { previousAdminStations, previousMapStations };
    },
    onError: (err, newStationData, context) => {
      // console.error('[CreateStation] onError triggered (Hook):', err); // Removed console log
      if (context?.previousAdminStations !== undefined) {
        queryClient.setQueryData(
          adminStationListKey,
          context.previousAdminStations
        );
      }
      if (context?.previousMapStations) {
        context.previousMapStations.forEach((previousData, queryKey) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      // Error Alert handled by calling component
    },
    // Invalidate queries on settlement (success or error after rollback)
    // This ensures the map and admin list reflect the true state.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminStationListKey });
      queryClient.invalidateQueries({ queryKey: mapStationsBaseKey });
    },
  });
};
