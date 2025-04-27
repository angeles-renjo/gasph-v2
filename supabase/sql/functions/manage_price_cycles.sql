-- Trigger function to manage price reporting cycles
CREATE OR REPLACE FUNCTION public.manage_price_cycles()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Date overlap check removed

  -- If a new active cycle is created or an existing one is updated to active,
  -- set all other cycles to completed
  IF NEW.status = 'active' THEN
    UPDATE public.price_reporting_cycles
    SET status = 'completed'
    WHERE id != NEW.id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.manage_price_cycles() TO service_role;

-- Create trigger on price_reporting_cycles table (commented out - uncomment and adjust as needed)
-- CREATE TRIGGER manage_price_cycles_trigger
-- BEFORE INSERT OR UPDATE ON public.price_reporting_cycles
-- FOR EACH ROW EXECUTE FUNCTION public.manage_price_cycles();
