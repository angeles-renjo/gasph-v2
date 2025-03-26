import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";

export function useAdminProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["adminProfile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (!data.is_admin) throw new Error("Not an admin user");

      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!userId,
  });
}
