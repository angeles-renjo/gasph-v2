import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase/supabase";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  // Actions
  initialize: () => Promise<void>;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (credentials: { email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAdmin: false,
      loading: true,
      initialized: false,

      initialize: async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            // Get admin status
            const { data: profileData } = await supabase
              .from("profiles")
              .select("is_admin")
              .eq("id", session.user.id)
              .single();

            set({
              user: session.user,
              session,
              isAdmin: profileData?.is_admin === true,
              loading: false,
              initialized: true,
            });
          } else {
            set({
              user: null,
              session: null,
              isAdmin: false,
              loading: false,
              initialized: true,
            });
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
          set({ loading: false, initialized: true });
        }
      },

      signIn: async ({ email, password }) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;

          // Get admin status
          const { data: profileData } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", data.user.id)
            .single();

          set({
            user: data.user,
            session: data.session,
            isAdmin: profileData?.is_admin === true,
            loading: false,
          });

          queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({
            user: null,
            session: null,
            isAdmin: false,
            loading: false,
          });

          queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
          queryClient.removeQueries({
            predicate: (query) => !query.queryKey.includes("auth"),
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      signUp: async ({ email, password }) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;

          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
