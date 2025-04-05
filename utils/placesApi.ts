// utils/placesApi.ts
import {
  COMMON_BRANDS,
  DEFAULT_AMENITIES,
  DEFAULT_OPERATING_HOURS,
} from '@/constants/gasStations';
import type { GooglePlacesStation } from '@/hooks/queries/utils/types'; // Assuming this type exists

// Helper function for delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const normalizeBrand = (name: string): string => {
  // Try to extract the brand from the station name
  const nameLower = name.toLowerCase();

  for (const brand of COMMON_BRANDS) {
    if (nameLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  // If no brand is detected, use a default or unknown
  if (nameLower.includes('gas station') || nameLower.includes('gasoline')) {
    return 'Independent';
  }

  return 'Unknown';
};

export const formatAmenities = (place: any): Record<string, boolean> => {
  const amenities = { ...DEFAULT_AMENITIES };

  // Check types for possible amenities
  if (place.types) {
    if (place.types.includes('convenience_store')) {
      amenities.convenience_store = true;
    }
    if (place.types.includes('car_wash')) {
      amenities.car_wash = true;
    }
    if (place.types.includes('restaurant') || place.types.includes('cafe')) {
      amenities.food_service = true;
    }
    if (place.types.includes('atm')) {
      amenities.atm = true;
    }
  }

  return amenities;
};

export const formatOperatingHours = (place: any): Record<string, any> => {
  // If we have actual opening hours from Google
  if (place.opening_hours && place.opening_hours.periods) {
    const hours: Record<string, any> = {
      is24Hours: false,
    };

    // Check if it's open 24/7
    const is24_7 =
      place.opening_hours.periods.length === 1 &&
      place.opening_hours.periods[0].open &&
      place.opening_hours.periods[0].open.day === 0 &&
      place.opening_hours.periods[0].open.time === '0000' &&
      !place.opening_hours.periods[0].close;

    if (is24_7) {
      hours.is24Hours = true;
      return hours;
    }

    // Process each period
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    place.opening_hours.periods.forEach((period: any) => {
      if (period.open && period.close) {
        const day = days[period.open.day];
        const openTime = `${period.open.time.slice(
          0,
          2
        )}:${period.open.time.slice(2, 4)}`;
        const closeTime = `${period.close.time.slice(
          0,
          2
        )}:${period.close.time.slice(2, 4)}`;

        hours[day] = { open: openTime, close: closeTime };
      }
    });

    return hours;
  }

  return DEFAULT_OPERATING_HOURS;
};

export const fetchPlaceDetails = async (placeId: string, apiKey: string) => {
  try {
    // Added address_components to the requested fields
    const fields =
      'name,formatted_address,geometry,type,opening_hours,business_status,address_components';
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch place details: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API-level errors first
    if (data.status !== 'OK') {
      console.error(
        `Places API error for placeId ${placeId}: ${data.status} - ${
          data.error_message || ''
        }`
      );
      // Throw specific errors based on status if needed, e.g., NOT_FOUND, INVALID_REQUEST
      throw new Error(`Places API error: ${data.status}`);
    }
    // Check if result exists, even if status is OK
    if (!data.result) {
      console.warn(
        `Places API returned OK status but no result for placeId ${placeId}`
      );
      // Depending on requirements, you might throw an error or return null/undefined
      throw new Error(`Places API returned no result for placeId ${placeId}`);
    }

    return data.result;
  } catch (error) {
    // Log the specific placeId causing the error
    console.error(
      `Error fetching place details for placeId ${placeId}:`,
      error
    );
    throw error; // Re-throw to allow calling function to handle
  }
};

export const searchGasStations = async (
  city: string,
  apiKey: string
): Promise<GooglePlacesStation[]> => {
  let allResults: GooglePlacesStation[] = [];
  let nextPageToken: string | undefined = undefined;
  const maxPages = 3; // Limit to fetching 3 pages (approx 60 results)
  let currentPage = 0;
  const initialQuery = `gas station in ${city}, Philippines`;
  const encodedInitialQuery = encodeURIComponent(initialQuery);
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedInitialQuery}&type=gas_station&region=ph&key=${apiKey}`;

  try {
    do {
      currentPage++;
      console.log(`Fetching page ${currentPage} for city: ${city}`);

      const response = await fetch(url);

      if (!response.ok) {
        // Log response status for debugging
        console.error(
          `HTTP error fetching page ${currentPage} for ${city}: ${response.status} ${response.statusText}`
        );
        // Attempt to read response body for more details if possible
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.error('Error response body:', errorBody);
        } catch (e) {
          console.error('Could not read error response body:', e);
        }
        throw new Error(
          `Failed to fetch page ${currentPage} of gas stations: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Handle specific Places API status codes
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(
          `Places API status error on page ${currentPage} for ${city}: ${
            data.status
          } - ${data.error_message || ''}`
        );
        // Stop pagination on critical errors like OVER_QUERY_LIMIT, REQUEST_DENIED
        if (
          ['OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'UNKNOWN_ERROR'].includes(
            data.status
          )
        ) {
          throw new Error(`Places API critical error: ${data.status}`);
        }
        // Treat INVALID_REQUEST on subsequent pages as potentially expired token
        if (currentPage > 1 && data.status === 'INVALID_REQUEST') {
          console.warn(
            `Places API returned INVALID_REQUEST on page ${currentPage}, likely expired token. Stopping pagination.`
          );
          nextPageToken = undefined; // Stop pagination
        } else if (currentPage === 1) {
          // If status is not OK/ZERO_RESULTS on the first page (and not critical), throw error
          throw new Error(`Places API error on first page: ${data.status}`);
        } else {
          // For other non-OK statuses on subsequent pages, just stop pagination
          console.warn(
            `Places API status ${data.status} on page ${currentPage}, stopping pagination.`
          );
          nextPageToken = undefined;
        }
      }

      if (data.results) {
        allResults = [...allResults, ...data.results];
      }

      nextPageToken = data.next_page_token;

      if (nextPageToken && currentPage < maxPages) {
        // IMPORTANT: Google requires a short delay before using the next_page_token
        await sleep(2000); // Wait 2 seconds
        // Prepare URL for the next page request
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
      } else {
        nextPageToken = undefined; // Ensure loop terminates if token missing or max pages reached
      }
    } while (nextPageToken && currentPage < maxPages);

    console.log(
      `Finished fetching for ${city}. Total results found: ${allResults.length}`
    );
    return allResults;
  } catch (error) {
    console.error(
      `Error searching gas stations for ${city} with pagination:`,
      error
    );
    // Re-throw the error to be handled by the calling code (e.g., useImportStations hook)
    throw error;
  }
};
