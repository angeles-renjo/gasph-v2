-- Function to safely delete a user by ID with explicit handling of dependencies
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id_to_delete uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the user exists before attempting deletion
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_to_delete) THEN
    RETURN 'User ' || user_id_to_delete || ' not found.';
  END IF;

  -- Handle station_reports dependencies first
  UPDATE station_reports 
  SET user_id = NULL 
  WHERE user_id = user_id_to_delete;
  
  -- Also handle resolver_id if it references users
  UPDATE station_reports 
  SET resolver_id = NULL 
  WHERE resolver_id = user_id_to_delete;
  
  -- Handle price_confirmations if they exist
  DELETE FROM price_confirmations 
  WHERE user_id = user_id_to_delete;
  
  -- Handle user_price_reports if they exist
  DELETE FROM user_price_reports 
  WHERE user_id = user_id_to_delete;
  
  -- Handle user_favorites if they exist
  DELETE FROM user_favorites 
  WHERE user_id = user_id_to_delete;
  
  -- Delete the profile record (should happen before auth.users)
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  RETURN 'User ' || user_id_to_delete || ' deleted successfully.';
EXCEPTION
  WHEN others THEN
    -- Log the error and return specific SQL error
    RAISE WARNING 'Error deleting user %: %', user_id_to_delete, SQLERRM;
    RETURN 'An error occurred during user deletion: ' || SQLERRM;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(uuid) TO service_role;