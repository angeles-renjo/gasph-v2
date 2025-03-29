import { useEffect } from "react";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { supabase } from "@/utils/supabase/supabase";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";

export function useAuth() {
  const { user, session, isAdmin, loading, signIn, signOut, signUp } =
    useAuthStore();

  // Auth state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            // Get admin status
            const { data: profileData } = await supabase
              .from("profiles")
              .select("is_admin")
              .eq("id", session.user.id)
              .single();

            useAuthStore.setState({
              user: session.user,
              session,
              isAdmin: profileData?.is_admin === true,
              loading: false,
            });

            queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
          }
        } else if (event === "SIGNED_OUT") {
          useAuthStore.setState({
            user: null,
            session: null,
            isAdmin: false,
            loading: false,
          });

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
    user,
    session,
    isAdmin,
    loading,
    signIn,
    signOut,
    signUp,
  };
}
