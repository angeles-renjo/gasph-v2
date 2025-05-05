-- Trigger function to prevent duplicate pending reports from the same user for the same station
CREATE OR REPLACE FUNCTION public.check_duplicate_pending_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Only check for reports linked to a specific station (update/delete)
    IF NEW.station_id IS NOT NULL THEN
        -- Check if the same user already has a 'pending' report for the same station
        IF EXISTS (
            SELECT 1
            FROM public.station_reports
            WHERE user_id = NEW.user_id
              AND station_id = NEW.station_id
              AND status = 'pending'
              -- Optional: Exclude the row being inserted if it somehow already exists (belt-and-suspenders)
              AND (TG_OP = 'INSERT' OR id <> NEW.id)
        ) THEN
            -- If a pending report exists, raise an exception
            RAISE EXCEPTION 'User already has a pending report for this station.';
        END IF;
    END IF;

    -- If no duplicate pending report is found, allow the operation
    RETURN NEW;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.check_duplicate_pending_report() TO service_role;

-- Create trigger on station_reports table (commented out - uncomment and adjust as needed)
-- CREATE TRIGGER check_duplicate_pending_report_trigger
-- BEFORE INSERT OR UPDATE ON public.station_reports
-- FOR EACH ROW EXECUTE FUNCTION public.check_duplicate_pending_report();
