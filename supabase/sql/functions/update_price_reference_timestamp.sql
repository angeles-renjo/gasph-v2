-- Trigger function to update timestamp when price references are modified
CREATE OR REPLACE FUNCTION public.update_price_reference_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.update_price_reference_timestamp() TO service_role;

-- Create trigger on price_references table (commented out - uncomment and adjust as needed)
-- CREATE TRIGGER update_price_reference_timestamp_trigger
-- BEFORE UPDATE ON public.price_references
-- FOR EACH ROW EXECUTE FUNCTION public.update_price_reference_timestamp();
