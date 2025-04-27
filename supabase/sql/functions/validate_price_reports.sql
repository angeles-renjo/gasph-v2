-- Function to validate and update price reports with proper cycle information
CREATE OR REPLACE FUNCTION public.validate_price_reports()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    active_cycle_id UUID;
BEGIN
    -- Get active cycle ID
    SELECT id INTO active_cycle_id FROM price_reporting_cycles WHERE status = 'active';
    
    -- Handle case where there's no active cycle
    IF active_cycle_id IS NULL THEN
        RAISE NOTICE 'No active cycle found. No reports updated.';
        RETURN;
    END IF;
    
    -- Update reports without a cycle_id to use the active cycle
    UPDATE user_price_reports
    SET cycle_id = active_cycle_id
    WHERE cycle_id IS NULL;
    
    -- Update reports with expired dates to use the proper end date from their cycle
    UPDATE user_price_reports upr
    SET expires_at = prc.end_date
    FROM price_reporting_cycles prc
    WHERE upr.cycle_id = prc.id
    AND upr.expires_at <> prc.end_date;
    
    RAISE NOTICE 'Price reports validated and updated.';
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.validate_price_reports() TO service_role;
