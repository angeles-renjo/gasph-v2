-- Trigger function to update the confirmations count for price reports
CREATE OR REPLACE FUNCTION public.update_confirmations_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE user_price_reports
    SET confirmations_count = (
      SELECT COUNT(*)::integer 
      FROM price_confirmations 
      WHERE report_id = NEW.report_id
    )
    WHERE id = NEW.report_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE user_price_reports
    SET confirmations_count = COALESCE((
      SELECT COUNT(*)::integer 
      FROM price_confirmations 
      WHERE report_id = OLD.report_id
    ), 0)
    WHERE id = OLD.report_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.update_confirmations_count() TO service_role;

-- Create trigger on price_confirmations table (commented out - uncomment and adjust as needed)
-- CREATE TRIGGER update_confirmations_count_trigger
-- AFTER INSERT OR DELETE ON public.price_confirmations
-- FOR EACH ROW EXECUTE FUNCTION public.update_confirmations_count();
