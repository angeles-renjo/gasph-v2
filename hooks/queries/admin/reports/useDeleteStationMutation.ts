import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import { Tables } from '@/utils/supabase/types';
import type { GasStation } from '@/hooks/queries/stations/useNearbyStations'; // Import map station type

export const useDeleteStationMutation = () => {
  const queryClient = useQueryClient();
  const adminStationListKey = queryKeys.admin.stations.list();
  const mapStationsBaseKey = [
    ...queryKeys.stations.all,
    'listWithPrice',
  ] as const;

  type DeleteMutationContext = {
    previousAdminStations?: {
      pages: { stations: Tables<'gas_stations'>[]; totalCount: number }[];
      pageParams: any[];
    };
    previousMapStations?: Map<QueryKey, GasStation[] | undefined>;
  };

  return useMutation<void, Error, string, DeleteMutationContext>({
    mutationFn: async (stationId) => {
      const { error } = await supabase
        .from('gas_stations')
        .delete()
        .eq('id', stationId);
      if (error) {
        console.error('Error deleting station:', error);
        throw new Error(error.message || 'Failed to delete station.');
      }
    },
    onMutate: async (stationIdToDelete) => {
      console.log('[DeleteStation] onMutate started', { stationIdToDelete });
      await queryClient.cancelQueries({ queryKey: adminStationListKey });
      await queryClient.cancelQueries({ queryKey: mapStationsBaseKey });

      const previousAdminStations =
        queryClient.getQueryData<
          DeleteMutationContext['previousAdminStations']
        >(adminStationListKey);
      const previousMapStations = new Map<QueryKey, GasStation[] | undefined>();

      const mapQueries = queryClient.getQueryCache().findAll({
        queryKey: mapStationsBaseKey,
        type: 'active',
        exact: false,
      });
      console.log(
        `[DeleteStation] Found ${mapQueries.length} active map caches.`
      );

      // Optimistically update admin list (infinite query)
      queryClient.setQueryData<DeleteMutationContext['previousAdminStations']>(
        adminStationListKey,
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              stations: page.stations.filter(
                (station) => station.id !== stationIdToDelete
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
        previousMapStations.set(cache.queryKey, currentMapData);
        if (currentMapData) {
          queryClient.setQueryData<GasStation[]>(
            cache.queryKey,
            currentMapData.filter((s) => s.id !== stationIdToDelete)
          );
        }
      });

      console.log('[DeleteStation] onMutate finished.');
      return { previousAdminStations, previousMapStations };
    },
    onError: (err, stationIdToDelete, context) => {
      console.error('[DeleteStation] onError triggered:', err);
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
    onSettled: () => {
      // Delay invalidation slightly
      setTimeout(() => {
        console.log('[DeleteStation] Invalidating queries after delay...');
        queryClient.invalidateQueries({ queryKey: adminStationListKey });
        queryClient.invalidateQueries({ queryKey: mapStationsBaseKey });
      }, 100);
    },
  });
};
