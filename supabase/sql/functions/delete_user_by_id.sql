-- Function to safely delete a user by ID with error handling
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id_to_delete uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the user exists before attempting deletion
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_to_delete) THEN
    -- Delete the user from auth.users; cascading deletes handle related tables
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    RETURN 'User ' || user_id_to_delete || ' deleted successfully.';
  ELSE
    RETURN 'User ' || user_id_to_delete || ' not found.';
  END IF;
EXCEPTION
  WHEN others THEN
    -- Log the error or return a generic error message
    RAISE WARNING 'Error deleting user %: %', user_id_to_delete, SQLERRM;
    RETURN 'An error occurred during user deletion: ' || SQLERRM; -- Return specific SQL error
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(uuid) TO service_role;
