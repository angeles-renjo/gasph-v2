-- Function to check if a user has admin privileges
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    is_admin_result BOOLEAN;
BEGIN
    SELECT p.is_admin INTO is_admin_result
    FROM public.profiles p
    WHERE p.id = user_id;
    
    RETURN COALESCE(is_admin_result, FALSE);
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO service_role;
