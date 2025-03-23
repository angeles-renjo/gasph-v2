// hooks/usePriceVoting.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

type VoteType = 'upvote' | 'downvote';

export function usePriceVoting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const handleVote = async (
    reportId: string,
    isUpvote: boolean,
    stationId: string,
    reportUserId: string
  ): Promise<boolean> => {
    // Guard: check for authentication
    if (!user) {
      showAlert(
        'Login Required',
        'You need to be logged in to vote on price reports.'
      );
      return false;
    }

    // Guard: prevent self-downvoting
    if (user.id === reportUserId && !isUpvote) {
      showAlert(
        'Voting Restricted',
        'You cannot downvote your own price report.'
      );
      return false;
    }

    if (isVoting) {
      return false; // Prevent concurrent votes
    }

    try {
      setIsVoting(true);

      // Start a Supabase transaction to handle the vote
      const { data: result, error: transactionError } = await supabase.rpc(
        'handle_price_vote',
        {
          p_report_id: reportId,
          p_user_id: user.id,
          p_is_upvote: isUpvote,
        }
      );

      if (transactionError) {
        throw transactionError;
      }

      // Show appropriate message based on the transaction result
      if (result.status === 'same_vote') {
        const action = isUpvote ? 'upvoted' : 'downvoted';
        showAlert(
          isUpvote ? 'Already Upvoted' : 'Already Downvoted',
          `You have already ${action} this price report.`
        );
        return false;
      } else if (result.status === 'vote_changed') {
        showAlert(
          'Vote Changed',
          `Your vote has been changed from ${
            isUpvote ? 'downvote to upvote' : 'upvote to downvote'
          }.`
        );
      } else {
        showAlert(
          isUpvote ? 'Upvoted Successfully' : 'Downvoted Successfully',
          isUpvote
            ? 'You have upvoted this price report.'
            : 'You have downvoted this price report.'
        );
      }

      // Refresh the station details data
      queryClient.invalidateQueries({
        queryKey: ['stationDetails', stationId],
      });

      return true;
    } catch (error: any) {
      console.error('Error voting on price report:', error);
      showAlert('Error', error.message || 'Failed to vote on price report');
      return false;
    } finally {
      setIsVoting(false);
    }
  };

  return {
    handleVote,
    isVoting,
  };
}
