// hooks/usePriceVoting.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export function usePriceVoting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (
    reportId: string,
    isUpvote: boolean,
    stationId: string,
    reportUserId: string
  ) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to vote on price reports.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Prevent users from voting on their own reports (except for the initial auto-upvote)
    if (user.id === reportUserId && isUpvote === false) {
      Alert.alert(
        'Voting Restricted',
        'You cannot downvote your own price report.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      setIsVoting(true);

      // First, check if the user has already voted on this report
      const { data: existingVote, error: checkError } = await supabase
        .from('user_price_votes')
        .select('*')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingVote) {
        // User has already voted on this report

        // If clicking the same vote type they already cast, show feedback message
        if (existingVote.is_upvote === isUpvote) {
          Alert.alert(
            isUpvote ? 'Already Upvoted' : 'Already Downvoted',
            isUpvote
              ? 'You have already upvoted this price report.'
              : 'You have already downvoted this price report.',
            [{ text: 'OK' }]
          );
          return false;
        } else {
          // They're changing their vote from up to down or vice versa
          const { error: updateVoteError } = await supabase
            .from('user_price_votes')
            .update({ is_upvote: isUpvote })
            .eq('id', existingVote.id);

          if (updateVoteError) throw updateVoteError;

          // Decrement the previous vote type and increment the new one
          if (existingVote.is_upvote) {
            // Changing from upvote to downvote
            await supabase.rpc('decrement_upvote', { report_id: reportId });
            await supabase.rpc('increment_downvote', { report_id: reportId });

            Alert.alert(
              'Vote Changed',
              'Your vote has been changed from upvote to downvote.',
              [{ text: 'OK' }]
            );
          } else {
            // Changing from downvote to upvote
            await supabase.rpc('decrement_downvote', { report_id: reportId });
            await supabase.rpc('increment_upvote', { report_id: reportId });

            Alert.alert(
              'Vote Changed',
              'Your vote has been changed from downvote to upvote.',
              [{ text: 'OK' }]
            );
          }
        }
      } else {
        // User hasn't voted on this report yet, add a new vote
        const { error: insertError } = await supabase
          .from('user_price_votes')
          .insert({
            report_id: reportId,
            user_id: user.id,
            is_upvote: isUpvote,
          });

        if (insertError) throw insertError;

        // Update the report vote count
        const { error: updateError } = await supabase.rpc(
          isUpvote ? 'increment_upvote' : 'increment_downvote',
          { report_id: reportId }
        );

        if (updateError) throw updateError;

        Alert.alert(
          isUpvote ? 'Upvoted Successfully' : 'Downvoted Successfully',
          isUpvote
            ? 'You have upvoted this price report.'
            : 'You have downvoted this price report.',
          [{ text: 'OK' }]
        );
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['stationDetails', stationId],
      });

      return true;
    } catch (error: any) {
      console.error('Error voting on price report:', error);
      Alert.alert('Error', error.message || 'Failed to vote on price report');
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
