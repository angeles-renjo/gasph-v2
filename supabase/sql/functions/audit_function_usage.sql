-- Function to audit PostgreSQL function usage across the database
CREATE OR REPLACE FUNCTION public.audit_function_usage()
RETURNS TABLE(
    function_name text, 
    function_schema text, 
    used_in_triggers boolean, 
    used_in_views boolean, 
    used_in_constraints boolean, 
    used_in_functions boolean, 
    last_called timestamp without time zone
)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH function_list AS (
        SELECT 
            p.proname as function_name,
            n.nspname as function_schema,
            p.oid as function_oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    ),
    trigger_usage AS (
        SELECT DISTINCT p.proname, true as is_used
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
    ),
    view_usage AS (
        SELECT DISTINCT p.proname, true as is_used
        FROM pg_views v
        JOIN pg_depend d ON d.refobjid = v.viewname::regclass
        JOIN pg_proc p ON d.objid = p.oid
    ),
    constraint_usage AS (
        SELECT DISTINCT p.proname, true as is_used
        FROM pg_constraint c
        JOIN pg_proc p ON c.conproc = p.oid
    ),
    function_usage AS (
        SELECT DISTINCT p.proname, true as is_used
        FROM pg_proc p
        JOIN pg_depend d ON d.refobjid = p.oid
        WHERE d.objsubid > 0
    )
    SELECT 
        fl.function_name,
        fl.function_schema,
        COALESCE(tu.is_used, false) as used_in_triggers,
        COALESCE(vu.is_used, false) as used_in_views,
        COALESCE(cu.is_used, false) as used_in_constraints,
        COALESCE(fu.is_used, false) as used_in_functions,
        s.last_call
    FROM function_list fl
    LEFT JOIN trigger_usage tu ON fl.function_name = tu.proname
    LEFT JOIN view_usage vu ON fl.function_name = vu.proname
    LEFT JOIN constraint_usage cu ON fl.function_name = cu.proname
    LEFT JOIN function_usage fu ON fl.function_name = fu.proname
    LEFT JOIN pg_stat_user_functions s ON fl.function_oid = s.funcid
    ORDER BY fl.function_schema, fl.function_name;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.audit_function_usage() TO service_role;
