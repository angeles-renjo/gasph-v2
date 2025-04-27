-- Function to archive price reporting cycles that are older than a specified threshold
CREATE OR REPLACE FUNCTION public.archive_old_price_cycles()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    archive_threshold INTERVAL = '90 days'; -- Adjust as needed
BEGIN
    -- Update old completed cycles to archived status
    UPDATE price_reporting_cycles
    SET status = 'archived'
    WHERE 
        status = 'completed' 
        AND end_date < (CURRENT_DATE - archive_threshold);
    
    RAISE NOTICE 'Archived cycles older than % days', EXTRACT(DAY FROM archive_threshold);
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.archive_old_price_cycles() TO service_role;
