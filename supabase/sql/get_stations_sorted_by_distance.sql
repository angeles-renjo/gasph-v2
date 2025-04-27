-- Function to get stations sorted by distance with multi-brand filtering
CREATE OR REPLACE FUNCTION get_stations_sorted_by_distance(
    user_lat float,
    user_lon float,
    search_term text default null,
    brand_filters text[] default null, -- Changed to array
    page_num int default 1,
    page_size int default 20
)
RETURNS TABLE (
    id uuid,
    name text,
    brand text,
    address text,
    city text,
    latitude float,
    longitude float,
    created_at timestamptz,
    updated_at timestamptz,
    place_id text,
    distance_meters float
)
LANGUAGE sql
STABLE
AS $$
SELECT
    gs.id,
    gs.name,
    gs.brand,
    gs.address,
    gs.city,
    gs.latitude,
    gs.longitude,
    gs.created_at,
    gs.updated_at,
    gs.place_id,
    -- Calculate distance using PostGIS geography type for accuracy (returns meters)
    ST_Distance(
        ST_MakePoint(gs.longitude, gs.latitude)::geography,
        ST_MakePoint(user_lon, user_lat)::geography
    ) AS distance_meters
FROM
    public.gas_stations gs
WHERE
    -- Apply search term filter (case-insensitive) if provided
    (search_term IS NULL OR search_term = '' OR (
        gs.name ILIKE '%' || search_term || '%' OR
        gs.brand ILIKE '%' || search_term || '%' OR
        gs.address ILIKE '%' || search_term || '%' OR
        gs.city ILIKE '%' || search_term || '%'
    ))
    AND
    -- Apply brand filter (case-insensitive) if provided - now handles array of brands
    (brand_filters IS NULL OR array_length(brand_filters, 1) IS NULL OR 
     gs.brand ILIKE ANY(brand_filters))
ORDER BY
    distance_meters ASC -- Sort by calculated distance
LIMIT page_size -- Apply pagination limit
OFFSET (page_num - 1) * page_size; -- Apply pagination offset
$$;

-- Grant execution permission to relevant roles
GRANT EXECUTE ON FUNCTION public.get_stations_sorted_by_distance(float, float, text, text[], int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stations_sorted_by_distance(float, float, text, text[], int, int) TO service_role;
