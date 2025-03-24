// hooks/usePriceVoting.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase/supabase';
import { useAuth } from '@/hooks/useAuth';

export type VoteType = 'up' | 'down' | null;

interface VoteParams {
  reportId: string;
  stationId: string;
  reportUserId: string;
  isUpvote: boolean;
}

interface VoteResult {
  action: 'added' | 'changed' | 'removed';
  voteType: VoteType;
}

// Type for the station details data structure
interface StationDetails {
  communityPrices: {
    id: string;
    upvotes: number;
    downvotes: number;
    userVote: VoteType;
    // ...other fields
  }[];
  // ...other station fields
}

export function usePriceVoting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Create a mutation for handling votes with optimistic updates
  const { mutate: handleVote, isPending: isVoting } = useMutation<
    VoteResult, // Return type
    Error, // Error type
    VoteParams, // Variables type
    { previousData: unknown } // Context type
  >({
    mutationFn: async ({ reportId, stationId, reportUserId, isUpvote }) => {
      console.log(
        `[Vote] Started vote operation - Report ID: ${reportId}, Vote: ${
          isUpvote ? 'upvote' : 'downvote'
        }`
      );

      // Validation checks
      if (!user) {
        console.log('[Vote] Error: User not logged in');
        throw new Error('You must be logged in to vote');
      }

      if (user.id === reportUserId && !isUpvote) {
        console.log('[Vote] Error: User attempting to downvote own report');
        throw new Error('You cannot downvote your own reports');
      }

      // Fetch existing vote (if any)
      console.log(`[Vote] Checking for existing vote`);
      const { data: existingVote, error: fetchError } = await supabase
        .from('user_price_votes')
        .select('*')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.log(`[Vote] Error fetching vote: ${fetchError.message}`);
        throw fetchError;
      }

      // CASE 1: Handle existing vote
      if (existingVote) {
        console.log(
          `[Vote] Found existing vote: ${
            existingVote.is_upvote ? 'upvote' : 'downvote'
          }`
        );

        // CASE 1A: User is clicking the same vote type again - remove it (toggle off)
        if (existingVote.is_upvote === isUpvote) {
          console.log(`[Vote] User is toggling off their vote`);

          // Delete the vote
          const { error: deleteError } = await supabase
            .from('user_price_votes')
            .delete()
            .eq('id', existingVote.id);

          if (deleteError) {
            console.log(`[Vote] Error deleting vote: ${deleteError.message}`);
            throw deleteError;
          }

          // Update the report count using direct RPC call
          console.log(
            `[Vote] Decrementing ${isUpvote ? 'upvote' : 'downvote'} count`
          );
          const { data: decrementResult, error: decrementError } =
            await supabase.rpc('decrement', {
              row_id: reportId,
              column_name: isUpvote ? 'upvotes' : 'downvotes',
              table_name: 'user_price_reports',
            });

          if (decrementError) {
            console.log(
              `[Vote] Error with decrement RPC: ${decrementError.message}`
            );
            throw decrementError;
          }

          console.log(
            `[Vote] Decrement result: ${JSON.stringify(decrementResult)}`
          );

          return {
            action: 'removed',
            voteType: isUpvote ? 'up' : 'down',
          };
        }

        // CASE 1B: User is changing vote type
        console.log(
          `[Vote] User is changing vote type from ${
            existingVote.is_upvote ? 'upvote' : 'downvote'
          } to ${isUpvote ? 'upvote' : 'downvote'}`
        );

        // Update the vote
        const { error: updateVoteError } = await supabase
          .from('user_price_votes')
          .update({ is_upvote: isUpvote })
          .eq('id', existingVote.id);

        if (updateVoteError) {
          console.log(`[Vote] Error updating vote: ${updateVoteError.message}`);
          throw updateVoteError;
        }

        // Update report counts - increment new vote type
        console.log(
          `[Vote] Incrementing ${isUpvote ? 'upvote' : 'downvote'} count`
        );
        const { data: incrementResult, error: incrementError } =
          await supabase.rpc('increment', {
            row_id: reportId,
            column_name: isUpvote ? 'upvotes' : 'downvotes',
            table_name: 'user_price_reports',
          });

        if (incrementError) {
          console.log(
            `[Vote] Error with increment RPC: ${incrementError.message}`
          );
          throw incrementError;
        }

        // Decrement old vote type
        console.log(
          `[Vote] Decrementing ${!isUpvote ? 'upvote' : 'downvote'} count`
        );
        const { data: decrementResult, error: decrementError } =
          await supabase.rpc('decrement', {
            row_id: reportId,
            column_name: !isUpvote ? 'upvotes' : 'downvotes',
            table_name: 'user_price_reports',
          });

        if (decrementError) {
          console.log(
            `[Vote] Error with decrement RPC: ${decrementError.message}`
          );
          throw decrementError;
        }

        console.log(
          `[Vote] Vote counts updated - Increment: ${JSON.stringify(
            incrementResult
          )}, Decrement: ${JSON.stringify(decrementResult)}`
        );

        return {
          action: 'changed',
          voteType: isUpvote ? 'up' : 'down',
        };
      }

      // CASE 2: No existing vote - create a new one
      console.log(`[Vote] Creating new ${isUpvote ? 'upvote' : 'downvote'}`);
      const { error: insertError } = await supabase
        .from('user_price_votes')
        .insert({
          report_id: reportId,
          user_id: user.id,
          is_upvote: isUpvote,
        });

      if (insertError) {
        console.log(`[Vote] Error inserting vote: ${insertError.message}`);
        throw insertError;
      }

      // Increment the report vote count
      console.log(
        `[Vote] Incrementing ${isUpvote ? 'upvote' : 'downvote'} count`
      );
      const { data: incrementResult, error: incrementError } =
        await supabase.rpc('increment', {
          row_id: reportId,
          column_name: isUpvote ? 'upvotes' : 'downvotes',
          table_name: 'user_price_reports',
        });

      if (incrementError) {
        console.log(
          `[Vote] Error with increment RPC: ${incrementError.message}`
        );
        throw incrementError;
      }

      console.log(
        `[Vote] Increment result: ${JSON.stringify(incrementResult)}`
      );

      return {
        action: 'added',
        voteType: isUpvote ? 'up' : 'down',
      };
    },

    // Optimistic updates
    onMutate: async (variables) => {
      const { reportId, isUpvote, stationId } = variables;
      console.log(`[Vote] Starting optimistic update`);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['stationDetails', stationId, user?.id],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        'stationDetails',
        stationId,
        user?.id,
      ]);

      // Perform an optimistic update
      queryClient.setQueryData<StationDetails | undefined>(
        ['stationDetails', stationId, user?.id],
        (oldData) => {
          if (!oldData) return oldData;

          // Clone the data to avoid mutation
          const newData = JSON.parse(JSON.stringify(oldData));

          // Find the report
          const reportIndex = newData.communityPrices.findIndex(
            (price: any) => price.id === reportId
          );

          if (reportIndex === -1) return oldData;

          const report = newData.communityPrices[reportIndex];
          const oldVote = report.userVote;
          console.log(
            `[Vote] Optimistic update - Current: ${oldVote}, New: ${
              isUpvote ? 'up' : 'down'
            }`
          );

          // Update based on current vote state
          if (oldVote === null) {
            // Adding a new vote
            report[isUpvote ? 'upvotes' : 'downvotes'] += 1;
            report.userVote = isUpvote ? 'up' : 'down';
          } else if (oldVote === (isUpvote ? 'up' : 'down')) {
            // Removing the same vote (toggle off)
            report[isUpvote ? 'upvotes' : 'downvotes'] -= 1;
            report.userVote = null;
          } else {
            // Changing vote type
            report[isUpvote ? 'upvotes' : 'downvotes'] += 1;
            report[!isUpvote ? 'upvotes' : 'downvotes'] -= 1;
            report.userVote = isUpvote ? 'up' : 'down';
          }

          return newData;
        }
      );

      return { previousData };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      const { stationId } = variables;
      console.log(
        `[Vote] Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );

      if (context?.previousData) {
        queryClient.setQueryData(
          ['stationDetails', stationId, user?.id],
          context.previousData
        );
      }

      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to register your vote'
      );
    },

    // Always refetch after error or success for consistency with the server
    onSettled: (data, error, variables) => {
      const { stationId } = variables;
      console.log(`[Vote] Operation complete: ${error ? 'Error' : 'Success'}`);

      // Force a complete refresh of the station details data to sync with server
      queryClient.invalidateQueries({
        queryKey: ['stationDetails', stationId],
      });

      // Show success message
      if (!error && data) {
        let message = '';

        if (data.action === 'added') {
          message = `You have ${
            data.voteType === 'up' ? 'upvoted' : 'downvoted'
          } this price report.`;
        } else if (data.action === 'changed') {
          message = `Your vote has been changed to ${
            data.voteType === 'up' ? 'upvote' : 'downvote'
          }.`;
        } else if (data.action === 'removed') {
          message = `Your ${
            data.voteType === 'up' ? 'upvote' : 'downvote'
          } has been removed.`;
        }

        if (message) {
          console.log(`[Vote] Success: ${message}`);
          Alert.alert('Success', message);
        }
      }
    },
  });

  // Simplified voting function with validation
  const voteOnPrice = (
    reportId: string,
    isUpvote: boolean,
    stationId: string,
    reportUserId: string
  ) => {
    console.log(
      `[Vote] User initiated vote: ${
        isUpvote ? 'upvote' : 'downvote'
      } on report ${reportId}`
    );

    // Quick client-side validation
    if (!user) {
      console.log(`[Vote] Validation failed: User not logged in`);
      Alert.alert(
        'Login Required',
        'You need to be logged in to vote on price reports.'
      );
      return;
    }

    if (user.id === reportUserId && !isUpvote) {
      console.log(`[Vote] Validation failed: Cannot downvote own report`);
      Alert.alert(
        'Voting Restricted',
        'You cannot downvote your own price report.'
      );
      return;
    }

    // Proceed with the mutation
    handleVote({ reportId, isUpvote, stationId, reportUserId });
  };

  return {
    voteOnPrice,
    isVoting,
  };
}
