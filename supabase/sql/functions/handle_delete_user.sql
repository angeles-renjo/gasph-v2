-- Trigger function to handle user deletion from profiles table
CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete the user from auth.users; cascading deletes will handle related tables
  DELETE FROM auth.users WHERE id = old.id;
  RETURN old;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.handle_delete_user() TO service_role;

-- Create trigger on profiles table (commented out - uncomment and adjust as needed)
-- CREATE TRIGGER handle_delete_user_trigger
-- AFTER DELETE ON public.profiles
-- FOR EACH ROW EXECUTE FUNCTION public.handle_delete_user();
