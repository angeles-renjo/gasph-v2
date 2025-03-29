import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { Session, User } from "@supabase/supabase-js";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";
import { defaultQueryOptions } from "@/hooks/queries/utils/queryOptions";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Session query
  const { data: authState, isPending: loading } = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async (): Promise<AuthState> => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      if (!session) {
        return { user: null, session: null, isAdmin: false };
      }

      // Get admin status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      return {
        user: session.user,
        session,
        isAdmin: profileData?.is_admin === true,
      };
    },
    ...defaultQueryOptions.auth.session,
  });

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      // Also invalidate user-specific queries
      if (data.user) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      }
    },
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log("Sign out mutation started");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("Supabase sign out completed");
    },
    onSuccess: () => {
      console.log("Sign out mutation succeeded");
      // First invalidate the auth session
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      // Then remove all queries except the auth session
      queryClient.removeQueries({
        predicate: (query) => !query.queryKey.includes("auth"),
      });
    },
  });

  // Auth state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Invalidate queries using the stable queryClient reference from the hook's scope
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
          if (session?.user) {
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
          }
        } else if (event === "SIGNED_OUT") {
          // Invalidate queries using the stable queryClient reference
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
          queryClient.removeQueries({
            predicate: (query) => !query.queryKey.includes("auth"),
          });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    user: authState?.user ?? null,
    session: authState?.session ?? null,
    isAdmin: authState?.isAdmin ?? false,
    loading,
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
  };
}
