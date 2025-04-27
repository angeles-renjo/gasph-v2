-- Function to get favorite stations with the latest price for a specific fuel type
-- and distance from the user's location.

create or replace function get_favorite_station_prices (
    p_user_id uuid,
    p_fuel_type text,
    p_user_lat double precision,
    p_user_lon double precision
)
returns table (
    id uuid,
    name text,
    brand text,
    city text,
    latitude numeric, -- Match gas_stations table type
    longitude numeric, -- Match gas_stations table type
    distance double precision,
    fuel_type text,
    price numeric, -- Match active_price_reports view type
    confirmations_count integer
)
language plpgsql
as $$
declare
    v_active_cycle_id uuid;
    earth_radius_km double precision := 6371; -- Earth's radius in kilometers
begin
    -- 1. Get the currently active price cycle ID
    select prc.id into v_active_cycle_id
    from public.price_reporting_cycles prc -- Correct table name
    where prc.status = 'active' -- Correct column and value check
    limit 1;

    if v_active_cycle_id is null then
        -- Handle case where no active cycle is found, maybe return empty set or raise error
        -- Returning empty set for now
        return query select
            null::uuid, null::text, null::text, null::text, null::double precision,
            null::double precision, null::double precision, null::text, null::double precision,
            null::integer
        where false; -- Ensures returning the correct structure but no rows
    end if;

    -- 2. Fetch favorite stations, their details, latest price for the specific fuel type, and calculate distance
    return query
    with favorite_stations as (
        -- Select favorite station IDs for the user
        select uf.station_id
        from public.user_favorites uf
        where uf.user_id = p_user_id
    ),
    latest_prices as (
        -- Find the latest price for the target fuel type within the active cycle for favorite stations
        select
            apr.station_id,
            apr.price,
            apr.confirmations_count,
            -- Order by confidence score (desc) then timestamp (desc) to get the most reliable report
            row_number() over (partition by apr.station_id order by apr.confidence_score desc, apr.reported_at desc) as rn
        from public.active_price_reports apr -- Use the correct view
        join favorite_stations fs on apr.station_id = fs.station_id
        where apr.fuel_type = p_fuel_type
          -- No need to filter by cycle_id here, the view already does it (prc.status = 'active')
    )
    -- Join stations with their latest price (if available) and calculate distance
    select
        s.id,
        s.name,
        s.brand,
        s.city,
        s.latitude,
        s.longitude,
        -- Haversine distance calculation (similar to lib/geo.ts)
        (earth_radius_km * 2 * asin(sqrt(
            sin(radians(s.latitude - p_user_lat) / 2)^2 +
            cos(radians(p_user_lat)) * cos(radians(s.latitude)) *
            sin(radians(s.longitude - p_user_lon) / 2)^2
        ))) as distance,
        p_fuel_type as fuel_type, -- Return the requested fuel type
        lp.price, -- The latest price for the specific fuel type
        coalesce(lp.confirmations_count, 0) as confirmations_count -- Default to 0 if no price found
    from public.gas_stations s
    join favorite_stations fs on s.id = fs.station_id
    left join latest_prices lp on s.id = lp.station_id and lp.rn = 1 -- Join only the latest price (rn=1)
    order by distance; -- Order results by distance

end;
$$;

-- Example Usage (from SQL editor or client):
-- select * from get_favorite_station_prices(
--   'YOUR_USER_ID'::uuid,
--   'RON 95', -- Target fuel type
--   14.5995,  -- User's latitude
--   120.9842   -- User's longitude
-- );
