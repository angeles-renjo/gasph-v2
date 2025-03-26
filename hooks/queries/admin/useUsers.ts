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
  user_price_reports: { count: number }[];
}

interface UsersResponse {
  users: (Omit<User, "user_price_reports"> & { reportCount: number })[];
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
        .select("*, user_price_reports(count)")
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        users: (data as User[]).map((user) => ({
          ...user,
          reportCount: user.user_price_reports?.[0]?.count || 0,
        })),
        totalCount: count || 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: UsersResponse, allPages) => {
      const totalFetched = allPages.length * PAGE_SIZE;
      return totalFetched < lastPage.totalCount ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
