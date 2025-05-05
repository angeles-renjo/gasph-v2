-- Function to revoke admin role from a user by email
CREATE OR REPLACE FUNCTION public.revoke_admin_role(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
    WHERE email = user_email;
    
    UPDATE public.profiles
    SET is_admin = FALSE
    WHERE id IN (SELECT id FROM auth.users WHERE email = user_email);
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.revoke_admin_role(text) TO service_role;
