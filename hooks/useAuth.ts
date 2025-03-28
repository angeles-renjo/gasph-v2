// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    // Get the current session and user
    const getCurrentUser = async () => {
      try {
        // Get current session
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (currentSession) {
          // Check if user is admin - only once when getting the session
          const { data: profileData } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", currentSession.user.id)
            .single();

          setState({
            session: currentSession,
            user: currentSession.user,
            loading: false,
            isAdmin: profileData?.is_admin === true,
          });
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error("Error getting current user:", error);
        setState({
          user: null,
          session: null,
          loading: false,
          isAdmin: false,
        });
      }
    };

    getCurrentUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`Auth event: ${event}`);

        // Only check admin status on sign-in events
        if (
          newSession?.user &&
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
        ) {
          // Check if user is admin
          const { data: profileData } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", newSession.user.id)
            .single();

          setState({
            session: newSession,
            user: newSession.user,
            loading: false,
            isAdmin: profileData?.is_admin === true,
          });
        } else if (!newSession) {
          setState({
            session: null,
            user: null,
            loading: false,
            isAdmin: false,
          });
        } else {
          // For other auth events, just update session and user, keep isAdmin state
          setState((prevState) => ({
            session: newSession,
            user: newSession.user,
            loading: false,
            isAdmin: prevState.isAdmin, // Keep existing admin status
          }));
        }
      }
    );

    // Clean up the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    isAdmin: state.isAdmin,
    signIn,
    signUp,
    signOut,
  };
}
