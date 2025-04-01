# System Understanding Notes (As of 2025-04-01)

This document summarizes the understanding gained about the GasPH database schema, codebase structure, and recent feature implementations/fixes.

## Database Schema Notes

### Key Tables:

- **`gas_stations`**: Stores details about each gas station (name, brand, address, city, province, coordinates, etc.).
  - _Note:_ `city` column stores names like 'Makati', 'Quezon', 'Malabon'. `province` stores 'Metro Manila' (potentially inconsistently).
- **`price_references`**: Consolidated table for official DOE price benchmarks.
  - Contains `area` (e.g., 'Makati', 'Quezon', 'NCR'), `fuel_type`, `brand` (nullable), `price_type` ('brand_range', 'overall_range', 'common'), `min_price`, `max_price`, `price`, `week_of`.
  - _Data Consistency:_ The `area` column was updated to use city names without the " City" suffix (e.g., 'Makati') to match `gas_stations.city`, except for 'NCR'.
- **`user_price_reports`**: Stores individual price reports submitted by users.
  - Contains `station_id`, `fuel_type`, `price`, `user_id`, `reported_at`, `expires_at`, `cycle_id`.
  - _Note:_ The `confirmations_count` column on this table was identified as redundant and likely unused; the recommendation is to drop it.
- **`price_confirmations`**: Stores records of users confirming existing price reports.
  - Likely contains `report_id` (linking to `user_price_reports.id`), `user_id`, `confirmed_at`.
- **`price_reporting_cycles`**: Defines periods for price reporting.
  - Contains `cycle_number`, `start_date`, `end_date`, `status` ('active', 'completed', etc.).
  - _Crucial for `active_price_reports`:_ The `expires_at` in `user_price_reports` is set based on the `end_date` of the cycle marked 'active' when the report is submitted.
- **`profiles`**: Stores user information (username, etc.).

### Key Views:

- **`active_price_reports`**: Provides a view of user reports considered "active".
  - Joins `user_price_reports`, `gas_stations`, and `profiles`.
  - Calculates `confirmations_count` by counting related rows in `price_confirmations`.
  - Calculates a `confidence_score`.
  - **Filters:** Critically, it only includes reports where `upr.expires_at > now()` and the associated `price_reporting_cycles.status` is 'active' or 'completed'.
- **`doe_price_view`**: Calculates the most relevant DOE benchmark for each station/fuel type combination.
  - **Logic:** Implements a priority system:
    1.  Tries to find the latest 'brand_range' price matching the station's city and brand.
    2.  If not found, tries to find the latest 'overall_range' price matching the station's city (excluding 'NCR').
    3.  If not found, and the station's city is in the defined NCR list, finds the latest 'overall_range' price for 'NCR'.
  - Also joins the latest 'common' price for the station's city.
  - _Debugging History:_ Required multiple revisions to fix joins (using `gas_station_id`), city name matching (standardizing data vs. flexible joins), type casting, and column ordering. The current version uses standardized city names in `price_references` and simple joins.

## Codebase Structure Notes

### Key Hooks:

- **`useStationDetails` (`hooks/queries/stations/useStationDetails.ts`)**:
  - Fetches core details for a single station (`gas_stations`).
  - Fetches _all_ active community reports (`active_price_reports`) for the station.
  - **Processes** community reports to find the single "best" report per fuel type (highest confirmations, then latest date). Stores this in `bestCommunityPrices`.
  - Fetches relevant DOE benchmarks from `doe_price_view`.
  - Used by the main station detail screen (`app/station/[id].tsx`).
- **`useStationFuelTypePrices` (`hooks/queries/stations/useStationFuelTypePrices.ts`)**:
  - Fetches _all_ active community reports (`active_price_reports`) for a _specific_ station AND _specific_ fuel type.
  - Orders results by confirmations, then date.
  - Used by the community prices list screen (`app/station/community-prices.tsx`).
- **`useBestPrices` (`hooks/queries/prices/useBestPrices.ts`)**:
  - Fetches best community-reported prices near the user's location.
  - Filters by distance and optionally by a specific `fuelType`.
  - **Logic:**
    - If a specific `fuelType` is selected, returns all reports for that type within the distance, sorted by price.
    - If "All Types" is selected, finds the single lowest price report for _each distinct fuel type_ within the distance (potentially from different stations or the same station multiple times) and returns that list, sorted by price.
  - Includes `confirmations_count` in the returned data.
  - Used by the main best prices screen (`app/(tabs)/index.tsx`).
- **`queryKeys` (`hooks/queries/utils/queryKeys.ts`)**: Defines structures for TanStack Query keys to manage caching and invalidation.

### Key Screens:

- **`app/station/[id].tsx` (Station Detail Screen)**:
  - Uses `useStationDetails`.
  - Displays station info, DOE prices (`DOEPriceTable`), and community prices.
  - **Community Prices Display:** Now iterates through `bestCommunityPrices` from the hook, showing only one `PriceCard` per fuel type.
  - Includes a "View all reports" button/link next to each best price card.
  - Uses `useRouter` to navigate to the community prices screen, passing `stationId`, `fuelType`, and `stationName`.
  - Contains the `handleReportPrice` function which submits new reports and invalidates relevant queries (`stations.detail`, `prices.best`, `users.contributions`, and `stations.fuelTypePrices`).
- **`app/station/community-prices.tsx` (Community Prices List Screen)**:
  - New screen created for the "View all reports" feature.
  - Uses `useLocalSearchParams` to get `stationId` and `fuelType`.
  - Uses `useStationFuelTypePrices` to fetch the list of reports.
  - Maps over the fetched `prices` array and renders a `PriceCard` for each report.
- **`app/(tabs)/index.tsx` (Best Prices Screen)**:
  - Uses `useBestPrices` to fetch nearby price data based on location and filters.
  - Provides UI filters for fuel type (chips) and distance (chips).
  - Renders a `FlatList` of `BestPriceCard` components based on the data from `useBestPrices`.
  - Passes `confirmations_count` to each `BestPriceCard`.

## Recent Tasks Summary

1.  **DOE Price Display Fixes:**
    - Initially, DOE data wasn't showing. Traced back to `useStationDetails` not querying `doe_price_view`.
    - Added query, fixed column name (`station_id` vs `gas_station_id`).
    - Fixed view logic multiple times due to priority issues (stations defaulting to NCR). Debugged by comparing view logic to DOE report structure.
    - Resolved city name mismatch ('Makati' vs 'Makati City') by standardizing city names in `price_references.area` via `UPDATE` statements.
    - Simplified `doe_price_view` using `UNION ALL` and `row_number()` after data standardization. Fixed view replacement errors (type casting, column order).
2.  **Community Price Display Refactor:**
    - **Goal:** Show only the "best" report on the main station detail screen, provide a link to a full list.
    - Modified `useStationDetails` to calculate `bestCommunityPrices`.
    - Updated `app/station/[id].tsx` to use `bestCommunityPrices` and add navigation button.
    - Created new screen `app/station/community-prices.tsx`.
    - Created new hook `useStationFuelTypePrices`.
    - Updated `queryKeys.ts`.
    - Integrated hook into the new screen.
    - Added query invalidation to `handleReportPrice`.
    - **Debugging:** Traced empty community price list screen issue back to `active_price_reports` view filtering based on `expires_at`. Resolved by ensuring correct 'active' `price_reporting_cycles` exist. Confirmed hook returns data via console logs. Fixed minor JSX warning.
3.  **Main Screen Best Price Display Update:**
    - **Goal:** Modify the main screen (`index.tsx`) to display the best price _per fuel type_ (allowing duplicate stations) with confirmation counts, sorted by price.
    - Modified `useBestPrices` hook to implement the new fetching/filtering logic (best per fuel type for "All Types" filter, all reports for specific fuel type filter).
    - Updated `BestPriceCard` component to accept and display `confirmations_count`.
    - Updated `index.tsx` to pass the `confirmations_count` to the card.

## Potential Next Steps / Areas for Improvement

- **Drop Redundant Columns/Tables:** Drop the `confirmations_count` column from `user_price_reports`. Drop old tables (`fuel_prices`, `city_overall_prices`, `ncr_prevailing_prices`) once fully confident.
- **Implement Confirmations:** Add UI and logic for users to confirm existing price reports (inserting into `price_confirmations`).
- **Refine `doe_price_view` (Optional):** Revisit the view logic if edge cases or performance issues arise.
- **Error Handling:** Improve error handling and user feedback in hooks and components.
- **Testing:** Implement automated tests (unit, integration, e2e) to verify functionality and prevent regressions.
- **Code Cleanup:** Remove debugging `console.log` statements.
