import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/supabase";
import { queryKeys } from "@/hooks/queries/utils/queryKeys";
import type { UserListItemProps } from "@/components/admin/UserListItem";

type User = UserListItemProps["user"];

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          username,
          avatar_url,
          reputation_score,
          is_admin,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((user) => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url || undefined,
        reputation_score: user.reputation_score || 0,
        is_admin: user.is_admin || false,
        created_at: user.created_at,
      }));
    },
  });
}
