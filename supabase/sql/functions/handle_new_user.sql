-- Trigger function to automatically create a profile when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, is_admin, reputation_score)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 6)),
    NOW(),
    false,
    0
  );
  RETURN NEW;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Create trigger on auth.users table (commented out - uncomment and adjust as needed)
-- CREATE TRIGGER handle_new_user_trigger
-- AFTER INSERT ON auth.users
-- FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
