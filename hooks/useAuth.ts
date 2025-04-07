import { useAuthStore } from '@/hooks/stores/useAuthStore';
// Removed unused imports: useEffect, supabase, queryClient, queryKeys

export function useAuth() {
  // Directly return the state and actions from the store
  const { user, session, isAdmin, loading, signIn, signOut, signUp } =
    useAuthStore();

  // Removed the useEffect containing the onAuthStateChange listener

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
