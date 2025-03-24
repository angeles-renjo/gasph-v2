import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { StationWithPrices } from '@/hooks/useStationDetails';

export function usePriceConfirmation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  const confirmPrice = async (reportId: string, stationId: string) => {
    // Validate user is logged in
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to confirm prices.'
      );
      return false;
    }

    try {
      setIsConfirming(true);

      // Get the current query data
      const currentData = queryClient.getQueryData<StationWithPrices>([
        'stationDetails',
        stationId,
      ]);

      // Function to update the data
      const updateData = (oldData: StationWithPrices | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          communityPrices: oldData.communityPrices.map((price) =>
            price.id === reportId
              ? {
                  ...price,
                  confirmationsCount: (price.confirmations_count || 0) + 1,
                  userHasConfirmed: true,
                }
              : price
          ),
        };
      };

      // Optimistically update the UI
      queryClient.setQueryData(['stationDetails', stationId], updateData);

      // Call the Supabase function to confirm the price
      const { data, error } = await supabase.rpc('confirm_price_report', {
        p_report_id: reportId,
        p_user_id: user.id,
      });

      console.log('Confirmation Response:', { data, error }); // Debugging log

      if (error) {
        // Revert optimistic update
        if (currentData) {
          queryClient.setQueryData(['stationDetails', stationId], currentData);
        }

        // Handle specific error scenarios
        if (error.message.includes('already confirmed')) {
          Alert.alert(
            'Already Confirmed',
            'You have already confirmed this price report.'
          );
        } else {
          console.error('Confirmation Error:', error);
          Alert.alert('Error', error.message || 'An unexpected error occurred');
        }
        return false;
      }

      // Check if confirmation was successful
      if (data === true) {
        Alert.alert(
          'Price Confirmed',
          'Thank you for helping keep prices up to date!'
        );
        return true;
      } else {
        // Revert optimistic update if confirmation fails
        if (currentData) {
          queryClient.setQueryData(['stationDetails', stationId], currentData);
        }

        Alert.alert(
          'Confirmation Failed',
          'You can only confirm a price report once.'
        );
        return false;
      }
    } catch (error: any) {
      // Get the current data again in case it changed
      const currentData = queryClient.getQueryData<StationWithPrices>([
        'stationDetails',
        stationId,
      ]);

      // Revert optimistic update in case of any unexpected error
      if (currentData) {
        queryClient.setQueryData(['stationDetails', stationId], currentData);
      }

      console.error('Unexpected Error confirming price:', error);
      Alert.alert('Error', error.message || 'Failed to confirm price report');
      return false;
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    confirmPrice,
    isConfirming,
  };
}
