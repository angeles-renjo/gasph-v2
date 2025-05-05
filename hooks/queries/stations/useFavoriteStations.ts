import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { queryKeys } from '@/hooks/queries/utils/queryKeys';
import type { Tables, TablesInsert } from '@/utils/supabase/types';
import { useUserProfile } from '@/hooks/queries/users/useUserProfile';
import { usePreferencesStore } from '@/hooks/stores/usePreferencesStore'; // Import preferences store
import { useLocationStore } from '@/hooks/stores/useLocationStore'; // Import location store
import type { FuelType } from '@/hooks/queries/prices/useBestPrices'; // Import FuelType

type UserFavorite = Tables<'user_favorites'>;
type InsertUserFavorite = TablesInsert<'user_favorites'>;

// Custom error for favorite limit
export class FavoriteLimitError extends Error {
  constructor(message = 'Favorite limit reached for free users.') {
    super(message);
    this.name = 'FavoriteLimitError';
  }
}

interface UseFavoriteStationsResult {
  favoriteStationIds: string[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  addFavorite: (stationId: string) => Promise<void>;
  removeFavorite: (stationId: string) => Promise<void>;
  isMutating: boolean;
  mutationError: unknown;
}

export function useFavoriteStations(
  userId: string | undefined
): UseFavoriteStationsResult {
  const queryClient = useQueryClient();
  // Get necessary state for invalidating the prices query
  const defaultFuelType = usePreferencesStore.getState().defaultFuelType;
  const location = useLocationStore.getState().location;

  // Fetch favorite station IDs for the user
  const { data, isLoading, isError, error } = useQuery({
    queryKey: userId ? queryKeys.stations.favorites.list(userId) : [],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_favorites')
        .select('station_id')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map((row: { station_id: string }) => row.station_id);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch user profile to check 'is_pro' status
  const { data: userProfile } = useUserProfile();

  // Add favorite mutation
  const {
    mutateAsync: addFavoriteAsync,
    isPending: isAdding,
    error: addError,
  } = useMutation({
    mutationFn: async (stationId: string) => {
      if (!userId) throw new Error('User not logged in');
      if (!userProfile) throw new Error('User profile not loaded'); // Should be loaded if userId exists

      // Check favorite limit for non-pro users
      const currentFavoritesCount = data?.length ?? 0;
      if (!userProfile.is_pro && currentFavoritesCount >= 1) {
        // Throw custom error to be caught in the component
        throw new FavoriteLimitError();
      }

      // Proceed with insertion if limit not reached or user is pro
      const insert: InsertUserFavorite = {
        user_id: userId,
        station_id: stationId,
      };
      const { error } = await supabase.from('user_favorites').insert(insert);

      // Handle potential DB errors (like unique constraint violation if somehow added twice)
      if (error) {
        console.error('Supabase add favorite error:', error);
        // Re-throw Supabase error for general handling, but could customize
        throw error;
      }
    },
    onSuccess: (_data, stationId) => {
      // Optimistic update (optional but good UX)
      // queryClient.setQueryData(queryKeys.stations.favorites.list(userId!), (oldData: string[] | undefined) => {
      //   return [...(oldData ?? []), stationId];
      // });

      // Invalidate queries to refetch from server
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.stations.favorites.list(userId),
        });
        // Invalidate the prices query for the Home screen
        queryClient.invalidateQueries({
          queryKey: queryKeys.stations.favorites.prices(
            userId,
            defaultFuelType ?? undefined,
            location?.latitude,
            location?.longitude
          ),
        });
        // Also invalidate the specific isFavorite query if you implement it
        // queryClient.invalidateQueries({ queryKey: queryKeys.stations.favorites.isFavorite(userId, stationId) });
      }
    },
    onError: (error) => {
      // Handle specific FavoriteLimitError or general errors
      if (!(error instanceof FavoriteLimitError)) {
        console.error('Add Favorite Mutation Error:', error);
      }
      // Optional: Rollback optimistic update if implemented
      // queryClient.invalidateQueries({ queryKey: queryKeys.stations.favorites.list(userId!) });
    },
  });

  // Remove favorite mutation
  const {
    mutateAsync: removeFavoriteAsync,
    isPending: isRemoving,
    error: removeError,
  } = useMutation({
    mutationFn: async (stationId: string) => {
      if (!userId) throw new Error('No userId');
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('station_id', stationId);
      if (error) throw error;
    },
    onSuccess: (_data, stationId) => {
      // Optional: Optimistic update
      // queryClient.setQueryData(queryKeys.stations.favorites.list(userId!), (oldData: string[] | undefined) => {
      //   return oldData?.filter(id => id !== stationId) ?? [];
      // });

      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.stations.favorites.list(userId),
        });
        // Invalidate the prices query for the Home screen
        queryClient.invalidateQueries({
          queryKey: queryKeys.stations.favorites.prices(
            userId,
            defaultFuelType ?? undefined,
            location?.latitude,
            location?.longitude
          ),
        });
        // queryClient.invalidateQueries({ queryKey: queryKeys.stations.favorites.isFavorite(userId, stationId) });
      }
    },
    onError: (error) => {
      console.error('Remove Favorite Mutation Error:', error);
      // Optional: Rollback optimistic update
      // queryClient.invalidateQueries({ queryKey: queryKeys.stations.favorites.list(userId!) });
    },
  });

  return {
    favoriteStationIds: data,
    isLoading,
    isError,
    error,
    addFavorite: addFavoriteAsync,
    removeFavorite: removeFavoriteAsync,
    isMutating: isAdding || isRemoving,
    mutationError: addError || removeError,
  };
}
