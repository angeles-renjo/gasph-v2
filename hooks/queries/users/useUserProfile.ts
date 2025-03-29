import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";
import { defaultQueryOptions } from "@/hooks/queries/utils/queryOptions";

// Define a type for the profile data if you have one
// Example:
interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  updated_at: string;
  is_admin: boolean;
  // Add other fields as needed from your 'profiles' table
}

export function useUserProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<UserProfile | null>({
    // Specify the return type here
    // Use the CORRECTED query key structure
    queryKey: queryKeys.users.profile(userId),
    queryFn: async () => {
      // Ensure userId exists before fetching
      if (!userId) {
        // Return null if the user is not logged in
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*") // Select all fields or specify the ones you need
        .eq("id", userId)
        .single(); // Expecting only one row

      if (error) {
        // Log the error for debugging
        console.error("Error fetching user profile:", error.message);
        // Let TanStack Query handle the error state by throwing it
        throw error;
      }

      // Return the fetched data, potentially casting it if using an interface
      return data as UserProfile;
    },
    // Use the EXISTING default options for user profile
    ...defaultQueryOptions.users.profile,
    // Only enable the query if the userId is available (user is logged in)
    enabled: !!userId,
  });
}
