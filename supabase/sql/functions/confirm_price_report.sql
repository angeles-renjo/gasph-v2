-- Function to confirm a price report by a user
CREATE OR REPLACE FUNCTION public.confirm_price_report(p_report_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the user has already confirmed this report
  IF NOT EXISTS (
    SELECT 1
    FROM public.price_confirmations pc
    WHERE pc.report_id = p_report_id AND pc.user_id = p_user_id
  ) THEN
    -- Insert a new confirmation record
    INSERT INTO public.price_confirmations (report_id, user_id)
    VALUES (p_report_id, p_user_id);
  END IF;
END;
$function$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.confirm_price_report(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_price_report(uuid, uuid) TO service_role;
