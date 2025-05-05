-- Function to assign admin role to a user by email
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{is_admin}', 'true'::jsonb)
    WHERE email = user_email;
    
    UPDATE public.profiles
    SET is_admin = TRUE
    WHERE id IN (SELECT id FROM auth.users WHERE email = user_email);
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.assign_admin_role(text) TO service_role;
