# GasPH Database Schema

This document outlines the key tables and views used in the GasPH application's Supabase PostgreSQL database.

## Views

### `active_price_reports`

Provides a consolidated view of user-reported prices that belong to the currently active reporting cycle, including station details, reporter info, confirmation counts, and a calculated confidence score.

```sql
create view public.active_price_reports as
select
  upr.id,
  upr.station_id,
  upr.fuel_type,
  upr.price,
  upr.user_id,
  upr.reported_at,
  upr.cycle_id,
  gs.name as station_name,
  gs.brand as station_brand,
  gs.city as station_city,
  gs.latitude as station_latitude,
  gs.longitude as station_longitude,
  p.username as reporter_username,
  COALESCE(pc.confirmations_count, 0)::integer AS confirmations_count,
  -- Calculate confidence score based on confirmations and recency
  CASE
    WHEN COALESCE(pc.confirmations_count, 0) >= 5 THEN 90 -- High confidence with many confirmations
    WHEN COALESCE(pc.confirmations_count, 0) >= 3 THEN 80
    WHEN COALESCE(pc.confirmations_count, 0) >= 1 THEN 70
    ELSE
      CASE
        -- More recent reports get higher baseline confidence
        WHEN upr.reported_at > (NOW() - INTERVAL '1 day') THEN 65
        WHEN upr.reported_at > (NOW() - INTERVAL '3 days') THEN 55
        WHEN upr.reported_at > (NOW() - INTERVAL '7 days') THEN 45
        ELSE 35
      END
  END AS confidence_score
from
  user_price_reports upr
JOIN
  gas_stations gs ON upr.station_id = gs.id
JOIN
  profiles p ON upr.user_id = p.id
LEFT JOIN (
  SELECT
    report_id,
    COUNT(*)::integer AS confirmations_count
  FROM
    price_confirmations
  GROUP BY
    report_id
) pc ON upr.id = pc.report_id
JOIN
  price_reporting_cycles prc ON upr.cycle_id = prc.id
WHERE
  -- Only include reports from active or completed cycles (not archived)
  prc.status IN ('active', 'completed')
  -- And reports that haven't expired yet
  AND upr.expires_at > NOW();
```

### `current_price_cycle`

Selects the details of the price reporting cycle that is currently marked as 'active'.

```sql
create view public.current_price_cycle as
select
  price_reporting_cycles.id,
  price_reporting_cycles.cycle_number,
  price_reporting_cycles.start_date,
  price_reporting_cycles.end_date,
  price_reporting_cycles.status,
  price_reporting_cycles.doe_import_date,
  price_reporting_cycles.created_at
from
  price_reporting_cycles
where
  price_reporting_cycles.status = 'active'::text
order by
  price_reporting_cycles.created_at desc
limit
  1;
```

_(Note: Added `order by created_at desc limit 1` to ensure only the most recent active cycle is returned, assuming this was the intent based on the name)_

### `doe_price_view`

A complex view that determines the most relevant Department of Energy (DOE) price reference for each gas station and fuel type. It uses a fallback mechanism:

1.  Brand-specific price range for the station's city.
2.  Overall price range for the station's city.
3.  NCR prevailing price range (if the station is in NCR).
    It also joins common prices where available.

```sql
create view public.doe_price_view as
with
  latest_doe_week as (
    select
      max(price_references.week_of) as value
    from
      price_references
  ),
  latest_brand_data as (
    select
      pr.area,
      pr.brand,
      pr.fuel_type,
      pr.min_price,
      pr.max_price,
      pr.week_of
    from
      price_references pr
      join latest_doe_week ldw on pr.week_of = ldw.value
    where
      pr.price_type = 'brand_range'::price_type
  ),
  latest_city_data as (
    select
      pr.area,
      pr.fuel_type,
      pr.min_price,
      pr.max_price,
      pr.week_of
    from
      price_references pr
      join latest_doe_week ldw on pr.week_of = ldw.value
    where
      pr.price_type = 'overall_range'::price_type
      and pr.area <> 'NCR'::text
  ),
  latest_ncr_data as (
    select
      pr.fuel_type,
      pr.min_price,
      pr.max_price,
      pr.week_of
    from
      price_references pr
      join latest_doe_week ldw on pr.week_of = ldw.value
    where
      pr.price_type = 'overall_range'::price_type
      and pr.area = 'NCR'::text
  ),
  latest_common_data as (
    select
      pr.area,
      pr.fuel_type,
      pr.price as common_price,
      pr.week_of,
      case
        when lower(
          TRIM(
            both
            from
              pr.area
          )
        ) = 'ncr'::text then 2
        else 1
      end as common_priority
    from
      price_references pr
      join latest_doe_week ldw on pr.week_of = ldw.value
    where
      pr.price_type = 'common'::price_type
  ),
  potential_sources as (
    select
      gs_1.id as gas_station_id,
      lbd.fuel_type,
      lbd.min_price,
      lbd.max_price,
      lbd.week_of,
      1 as priority,
      'brand_specific'::text as source_type
    from
      gas_stations gs_1
      join latest_brand_data lbd on lower(
        TRIM(
          both
          from
            lbd.area
        )
      ) ~~ (
        lower(
          TRIM(
            both
            from
              gs_1.city
          )
        ) || '%'::text
      )
      and lower(
        TRIM(
          both
          from
            lbd.brand
        )
      ) = lower(
        TRIM(
          both
          from
            gs_1.brand
        )
      )
    union all
    select
      gs_1.id as gas_station_id,
      lcd_1.fuel_type,
      lcd_1.min_price,
      lcd_1.max_price,
      lcd_1.week_of,
      2 as priority,
      'city_overall'::text as source_type
    from
      gas_stations gs_1
      join latest_city_data lcd_1 on lower(
        TRIM(
          both
          from
            lcd_1.area
        )
      ) ~~ (
        lower(
          TRIM(
            both
            from
              gs_1.city
          )
        ) || '%'::text
      )
    union all
    select
      gs_1.id as gas_station_id,
      lnd.fuel_type,
      lnd.min_price,
      lnd.max_price,
      lnd.week_of,
      3 as priority,
      'ncr_prevailing'::text as source_type
    from
      gas_stations gs_1
      cross join latest_ncr_data lnd
    where
      lower(
        TRIM(
          both
          from
            gs_1.city
        )
      ) = any (
        array[
          'pasay'::text,
          'muntinlupa'::text,
          'parañaque'::text,
          'paranaque'::text,
          'makati'::text,
          'taguig'::text,
          'pasig'::text,
          'manila'::text,
          'quezon city'::text,
          'quezon'::text,
          'caloocan'::text,
          'mandaluyong'::text,
          'marikina'::text,
          'san juan'::text,
          'valenzuela'::text,
          'navotas'::text,
          'malabon'::text,
          'las piñas'::text,
          'las pinas'::text,
          'pateros'::text
        ]
      )
  ),
  ranked_sources as (
    select
      ps.gas_station_id,
      ps.fuel_type,
      ps.min_price,
      ps.max_price,
      ps.week_of,
      ps.priority,
      ps.source_type,
      row_number() over (
        partition by
          ps.gas_station_id,
          ps.fuel_type
        order by
          ps.priority
      ) as rn
    from
      potential_sources ps
  )
select
  gs.id as gas_station_id,
  gs.name as gas_station_name,
  gs.address as gas_station_address,
  gs.city as gas_station_city,
  gs.brand as gas_station_brand,
  rs.fuel_type,
  rs.min_price,
  rs.max_price,
  COALESCE(lcd_city.common_price, lcd_ncr.common_price) as common_price,
  rs.week_of,
  rs.source_type
from
  gas_stations gs
  join ranked_sources rs on gs.id = rs.gas_station_id
  and rs.rn = 1
  left join latest_common_data lcd_city on rs.fuel_type = lcd_city.fuel_type
  and rs.week_of = lcd_city.week_of
  and lcd_city.common_priority = 1
  and lower(
    TRIM(
      both
      from
        lcd_city.area
    )
  ) ~~ (
    lower(
      TRIM(
        both
        from
          gs.city
      )
    ) || '%'::text
  )
  left join latest_common_data lcd_ncr on rs.fuel_type = lcd_ncr.fuel_type
  and rs.week_of = lcd_ncr.week_of
  and lcd_ncr.common_priority = 2;
```

## Tables

### `gas_stations`

Stores information about individual gas stations.

```sql
create table public.gas_stations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  brand text not null,
  address text not null,
  city text not null,
  province text not null,
  latitude numeric(10, 6) not null,
  longitude numeric(10, 6) not null,
  amenities jsonb null default '{}'::jsonb,
  operating_hours jsonb null default '{}'::jsonb,
  status text not null default 'active'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  place_id text null,
  constraint gas_stations_pkey primary key (id),
  constraint gas_stations_place_id_unique unique (place_id)
) TABLESPACE pg_default;

create index IF not exists gas_stations_latitude_idx on public.gas_stations using btree (latitude) TABLESPACE pg_default;
create index IF not exists gas_stations_longitude_idx on public.gas_stations using btree (longitude) TABLESPACE pg_default;
create index IF not exists gas_stations_brand_idx on public.gas_stations using btree (brand) TABLESPACE pg_default;
create index IF not exists gas_stations_city_idx on public.gas_stations using btree (city) TABLESPACE pg_default;
create index IF not exists gas_stations_status_idx on public.gas_stations using btree (status) TABLESPACE pg_default;
create index IF not exists idx_gas_stations_lower_city on public.gas_stations using btree (lower(city)) TABLESPACE pg_default;
```

### `price_confirmations`

Records user confirmations for specific price reports. Used to increase confidence in community-reported prices.

```sql
create table public.price_confirmations (
  id uuid not null default extensions.uuid_generate_v4 (),
  report_id uuid null,
  user_id uuid null,
  confirmed_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint price_confirmations_pkey primary key (id),
  constraint price_confirmations_report_id_user_id_key unique (report_id, user_id),
  constraint price_confirmations_report_id_fkey foreign KEY (report_id) references user_price_reports (id) on delete CASCADE,
  constraint price_confirmations_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

-- Assuming a trigger function 'update_confirmations_count' exists
create trigger update_price_confirmation_count
after INSERT
or DELETE on price_confirmations for EACH row
execute FUNCTION update_confirmations_count ();
```

### `price_references`

Stores official DOE price reference data, categorized by type (brand range, overall range, common price).

```sql
-- Assuming 'price_type' enum exists: CREATE TYPE public.price_type AS ENUM ('brand_range', 'overall_range', 'common');
create table public.price_references (
  id uuid not null default gen_random_uuid (),
  area text not null,
  fuel_type text not null,
  brand text null,
  price_type public.price_type not null,
  min_price numeric(10, 2) null,
  max_price numeric(10, 2) null,
  price numeric(10, 2) null,
  week_of date not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  cycle_id uuid null,
  constraint price_references_pkey primary key (id),
  constraint price_references_cycle_id_fkey foreign KEY (cycle_id) references price_reporting_cycles (id) on delete set null,
  constraint min_max_check check (
    (
      (
        (min_price is null)
        and (max_price is null)
      )
      or (min_price <= max_price)
    )
  ),
  constraint valid_price_ranges check (
    (
      (
        (price_type = 'brand_range'::price_type)
        and (brand is not null)
        and (min_price is not null)
        and (max_price is not null)
        and (price is null)
      )
      or (
        (price_type = 'overall_range'::price_type)
        and (brand is null)
        and (min_price is not null)
        and (max_price is not null)
        and (price is null)
      )
      or (
        (price_type = 'common'::price_type)
        and (brand is null)
        and (min_price is null)
        and (max_price is null)
        and (price is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_price_references_area_fuel on public.price_references using btree (area, fuel_type) TABLESPACE pg_default;
create index IF not exists idx_price_references_brand on public.price_references using btree (brand) TABLESPACE pg_default where (brand is not null);
create index IF not exists idx_price_references_week on public.price_references using btree (week_of) TABLESPACE pg_default;
create unique INDEX IF not exists idx_brand_prices_unique on public.price_references using btree (area, fuel_type, brand, week_of) TABLESPACE pg_default where (price_type = 'brand_range'::price_type);
create unique INDEX IF not exists idx_overall_range_unique on public.price_references using btree (area, fuel_type, week_of) TABLESPACE pg_default where (price_type = 'overall_range'::price_type);
create unique INDEX IF not exists idx_common_price_unique on public.price_references using btree (area, fuel_type, week_of) TABLESPACE pg_default where (price_type = 'common'::price_type);
create index IF not exists idx_price_references_cycle_id on public.price_references using btree (cycle_id) TABLESPACE pg_default;
```

### `price_reporting_cycles`

Manages the cycles for community price reporting and DOE data imports. Tracks status (active, completed, archived).

```sql
create table public.price_reporting_cycles (
  id uuid not null default gen_random_uuid (),
  start_date date null,
  end_date date null,
  doe_import_date timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  cycle_number serial not null,
  status text not null default 'active'::text,
  constraint price_reporting_cycles_pkey primary key (id),
  constraint price_reporting_cycles_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'completed'::text,
          'archived'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_price_reporting_cycles_cycle_number on public.price_reporting_cycles using btree (cycle_number) TABLESPACE pg_default;

-- Assuming a trigger function 'manage_price_cycles' exists
create trigger price_cycles_management BEFORE INSERT
or
update on price_reporting_cycles for EACH row
execute FUNCTION manage_price_cycles ();
```

### `profiles`

Stores user profile information, linked to Supabase Auth users. Includes admin status and reputation.

```sql
create table public.profiles (
  id uuid not null,
  username text not null,
  avatar_url text null,
  reputation_score integer null default 0,
  is_admin boolean null default false,
  created_at timestamp with time zone null default now(),
  is_pro boolean not null default false,
  full_name text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_username_check check ((char_length(username) >= 3))
) TABLESPACE pg_default;

create index IF not exists idx_profiles_is_pro on public.profiles using btree (is_pro) TABLESPACE pg_default;

create index IF not exists idx_profiles_id_is_admin on public.profiles using btree (id) INCLUDE (is_admin) TABLESPACE pg_default;

create trigger on_profile_deleted after DELETE on profiles for EACH row execute FUNCTION handle_delete_user ();
```

### `station_reports`

```sql
create table public.station_reports (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  report_type public.report_type not null,
  station_id uuid null,
  latitude numeric(10, 6) null,
  longitude numeric(10, 6) null,
  reported_data jsonb null,
  reason text null,
  status public.report_status not null default 'pending'::report_status,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  resolved_at timestamp with time zone null,
  resolver_id uuid null,
  constraint station_reports_pkey primary key (id),
  constraint station_reports_resolver_id_fkey foreign KEY (resolver_id) references auth.users (id) on delete set null,
  constraint station_reports_station_id_fkey foreign KEY (station_id) references gas_stations (id) on delete CASCADE,
  constraint station_reports_user_id_fkey foreign KEY (user_id) references profiles (id),
  constraint check_reason_for_delete_update check (
    (
      (report_type = 'add'::report_type)
      or (
        (
          report_type = any (
            array['update'::report_type, 'delete'::report_type]
          )
        )
        and (reason is not null)
        and (reason <> ''::text)
      )
    )
  ),
  constraint check_station_id_for_report_type check (
    (
      (
        (report_type = 'add'::report_type)
        and (station_id is null)
      )
      or (
        (
          report_type = any (
            array['update'::report_type, 'delete'::report_type]
          )
        )
        and (station_id is not null)
      )
    )
  ),
  constraint check_location_for_add_report check (
    (
      (report_type <> 'add'::report_type)
      or (
        (report_type = 'add'::report_type)
        and (latitude is not null)
        and (longitude is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_station_reports_user_id on public.station_reports using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_station_reports_station_id on public.station_reports using btree (station_id) TABLESPACE pg_default
where
  (station_id is not null);

create index IF not exists idx_station_reports_status on public.station_reports using btree (status) TABLESPACE pg_default;

create index IF not exists idx_station_reports_report_type on public.station_reports using btree (report_type) TABLESPACE pg_default;

create trigger before_insert_update_station_report_check_duplicate BEFORE INSERT
or
update on station_reports for EACH row when (new.status = 'pending'::report_status)
execute FUNCTION check_duplicate_pending_report ();
```

### `user_favorites`

```sql
create table public.user_favorites (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  station_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint user_favorites_pkey primary key (id),
  constraint user_favorites_user_id_station_id_key unique (user_id, station_id),
  constraint user_favorites_station_id_fkey foreign KEY (station_id) references gas_stations (id) on delete CASCADE,
  constraint user_favorites_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_favorites_user_id on public.user_favorites using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_favorites_station_id on public.user_favorites using btree (station_id) TABLESPACE pg_default;

create trigger enforce_favorite_limit_before_insert BEFORE INSERT on user_favorites for EACH row
execute FUNCTION check_favorite_limit ();
```

### `user_price_reports`

Stores fuel prices reported by users for specific stations during a reporting cycle.

```sql
create table public.user_price_reports (
  id uuid not null default gen_random_uuid (),
  station_id uuid not null,
  fuel_type text not null,
  price numeric(10, 2) not null,
  user_id uuid not null,
  reported_at timestamp with time zone null default now(),
  cycle_id uuid not null,
  constraint user_price_reports_pkey primary key (id),
  constraint user_price_reports_cycle_id_fkey foreign KEY (cycle_id) references price_reporting_cycles (id) on delete CASCADE,
  constraint user_price_reports_station_id_fkey foreign KEY (station_id) references gas_stations (id) on delete CASCADE,
  constraint user_price_reports_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint user_price_reports_price_check check ((price > (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists user_price_reports_station_id_idx on public.user_price_reports using btree (station_id) TABLESPACE pg_default;
create index IF not exists user_price_reports_user_id_idx on public.user_price_reports using btree (user_id) TABLESPACE pg_default;
create index IF not exists user_price_reports_reported_at_idx on public.user_price_reports using btree (reported_at) TABLESPACE pg_default;
create index IF not exists user_price_reports_cycle_id_idx on public.user_price_reports using btree (cycle_id) TABLESPACE pg_default;
```

</final_file_content>
