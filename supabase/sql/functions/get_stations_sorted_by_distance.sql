
-- 2. get_favorite_station_prices function fix
CREATE OR REPLACE FUNCTION public.get_favorite_station_prices(user_id uuid)
RETURNS TABLE (
  station_id uuid,
  station_name text,
  station_brand text,
  station_address text,
  station_city text,
  fuel_type text,
  price numeric,
  reported_at timestamptz,
  distance_meters float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
SELECT
  gs.id as station_id,
  gs.name as station_name,
  gs.brand as station_brand,
  gs.address as station_address,
  gs.city as station_city,
  apr.fuel_type,
  apr.price,
  apr.reported_at,
  -- If you're using location, include distance
  0.0 as distance_meters -- Placeholder for distance
FROM
  public.user_favorites uf
JOIN
  public.gas_stations gs ON uf.station_id = gs.id
LEFT JOIN LATERAL (
  SELECT *
  FROM public.active_price_reports apr
  WHERE apr.station_id = gs.id
  ORDER BY apr.fuel_type, apr.confirmations_count DESC, apr.reported_at DESC
  LIMIT 10
) apr ON true
WHERE
  uf.user_id = user_id
ORDER BY
  gs.brand, gs.name, apr.fuel_type;
$$;