import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";

const PAGE_SIZE = 20;

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
  reportCount: number; // Added to match UserListItem requirements
}

interface UsersResponse {
  users: User[];
  totalCount: number;
}

export function useUsers() {
  return useInfiniteQuery({
    queryKey: ["adminUsers"],
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("profiles")
        .select(
          `
          *,
          user_price_reports!inner(id)
        `
        )
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Transform the data to include reportCount
      const usersWithCount = (data || []).map((user) => ({
        ...user,
        reportCount: 0, // Default value, we'll update this with actual count later
      })) as User[];

      return {
        users: usersWithCount,
        totalCount: count || 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: UsersResponse, allPages) => {
      const totalFetched = allPages.length * PAGE_SIZE;
      return totalFetched < lastPage.totalCount ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}
