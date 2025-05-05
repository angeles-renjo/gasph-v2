-- Trigger function to enforce favorite station limits based on user's pro status
CREATE OR REPLACE FUNCTION public.check_favorite_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  favorite_count integer;
  user_is_pro boolean;
begin
  -- Get the user's pro status from the profiles table
  select is_pro into user_is_pro
  from public.profiles
  where id = auth.uid();

  -- If the user is NOT pro, check their current favorite count
  if user_is_pro = false then
    select count(*) into favorite_count
    from public.user_favorites
    where user_id = auth.uid();

    -- If they already have 1 or more favorites, raise an exception
    if favorite_count >= 1 then
      raise exception 'Free users can only have 1 favorite station. Upgrade to Pro for unlimited favorites.';
    end if;
  end if;

  -- If the user is pro or has 0 favorites, allow the insert
  return new;
end;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.check_favorite_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_favorite_limit() TO service_role;

-- Create trigger on user_favorites table (commented out - uncomment and adjust as needed)
-- CREATE TRIGGER check_favorite_limit_trigger
-- BEFORE INSERT ON public.user_favorites
-- FOR EACH ROW EXECUTE FUNCTION public.check_favorite_limit();
