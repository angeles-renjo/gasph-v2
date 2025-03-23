// hooks/usePriceVoting.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

// Types to improve clarity
type VoteType = 'upvote' | 'downvote';

export function usePriceVoting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  // Show alert helper function
  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  // Validate user can vote
  const validateVote = (reportUserId: string, isUpvote: boolean): boolean => {
    if (!user) {
      showAlert(
        'Login Required',
        'You need to be logged in to vote on price reports.'
      );
      return false;
    }

    if (user.id === reportUserId && !isUpvote) {
      showAlert(
        'Voting Restricted',
        'You cannot downvote your own price report.'
      );
      return false;
    }

    return true;
  };

  // Fetch existing vote
  const fetchExistingVote = async (reportId: string, userId: string) => {
    const { data, error } = await supabase
      .from('user_price_votes')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  // Process same vote type case
  const handleSameVoteType = (isUpvote: boolean): boolean => {
    const action = isUpvote ? 'upvoted' : 'downvoted';
    showAlert(
      isUpvote ? 'Already Upvoted' : 'Already Downvoted',
      `You have already ${action} this price report.`
    );
    return false;
  };

  // Update vote counts
  const updateVoteCounts = async (
    decrementType: VoteType,
    incrementType: VoteType,
    reportId: string
  ) => {
    await supabase.rpc(`decrement_${decrementType}`, { report_id: reportId });
    await supabase.rpc(`increment_${incrementType}`, { report_id: reportId });
  };

  // Update existing vote
  const changeExistingVote = async (
    existingVote: any,
    reportId: string,
    isUpvote: boolean
  ) => {
    await supabase
      .from('user_price_votes')
      .update({ is_upvote: isUpvote })
      .eq('id', existingVote.id);

    if (existingVote.is_upvote) {
      await updateVoteCounts('upvote', 'downvote', reportId);
      showAlert(
        'Vote Changed',
        'Your vote has been changed from upvote to downvote.'
      );
    } else {
      await updateVoteCounts('downvote', 'upvote', reportId);
      showAlert(
        'Vote Changed',
        'Your vote has been changed from downvote to upvote.'
      );
    }
  };

  // Insert new vote
  const insertNewVote = async (
    reportId: string,
    userId: string,
    isUpvote: boolean
  ) => {
    await supabase.from('user_price_votes').insert({
      report_id: reportId,
      user_id: userId,
      is_upvote: isUpvote,
    });

    const voteType: VoteType = isUpvote ? 'upvote' : 'downvote';
    await supabase.rpc(`increment_${voteType}`, { report_id: reportId });

    showAlert(
      isUpvote ? 'Upvoted Successfully' : 'Downvoted Successfully',
      isUpvote
        ? 'You have upvoted this price report.'
        : 'You have downvoted this price report.'
    );
  };

  // Main voting function - radically simplified
  const handleVote = async (
    reportId: string,
    isUpvote: boolean,
    stationId: string,
    reportUserId: string
  ): Promise<boolean> => {
    // Guard: validate user can vote
    if (!validateVote(reportUserId, isUpvote)) {
      return false;
    }

    try {
      setIsVoting(true);

      // Get existing vote (if any)
      const existingVote = await fetchExistingVote(reportId, user!.id);

      // Handle based on vote existence and type
      if (existingVote) {
        // Guard: same vote type already cast
        if (existingVote.is_upvote === isUpvote) {
          return handleSameVoteType(isUpvote);
        }

        // Change existing vote
        await changeExistingVote(existingVote, reportId, isUpvote);
      } else {
        // Create new vote
        await insertNewVote(reportId, user!.id, isUpvote);
      }

      // Refresh data
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
