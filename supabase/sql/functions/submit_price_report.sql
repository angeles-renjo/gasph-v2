-- Function to submit a price report with cooldown check
CREATE OR REPLACE FUNCTION public.submit_price_report(
  p_station_id UUID,
  p_fuel_type TEXT,
  p_price NUMERIC,
  p_cycle_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This is crucial to bypass RLS
SET search_path = public
AS $function$
DECLARE
  v_user_id UUID;
  v_existing_report_id UUID;
  v_cooldown_hours INT := 24; -- Configurable cooldown period
  v_new_report_id UUID;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  -- Check if the user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit price reports';
  END IF;

  -- Check if the user has already submitted a report for this station and fuel type within the cooldown period
  SELECT id INTO v_existing_report_id
  FROM public.user_price_reports
  WHERE user_id = v_user_id
    AND station_id = p_station_id
    AND fuel_type = p_fuel_type
    AND reported_at > (NOW() - (v_cooldown_hours || ' hours')::INTERVAL);

  -- If a recent report exists, reject the submission
  IF v_existing_report_id IS NOT NULL THEN
    RAISE EXCEPTION 'You have already reported a price for this station and fuel type within the last % hours', v_cooldown_hours;
  END IF;

  -- Insert the new price report
  INSERT INTO public.user_price_reports (
    station_id,
    fuel_type,
    price,
    user_id,
    reported_at,
    cycle_id
  )
  VALUES (
    p_station_id,
    p_fuel_type,
    p_price,
    v_user_id,
    NOW(),
    p_cycle_id
  )
  RETURNING id INTO v_new_report_id;

  RETURN v_new_report_id;
END;
$function$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_price_report(UUID, TEXT, NUMERIC, UUID) TO authenticated;
