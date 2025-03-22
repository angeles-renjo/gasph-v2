// utils/placesApi.ts
import {
  COMMON_BRANDS,
  DEFAULT_AMENITIES,
  DEFAULT_OPERATING_HOURS,
} from '@/constants/gasStations';

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
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,type,opening_hours,business_status&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch place details: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status}`);
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
};

export const searchGasStations = async (city: string, apiKey: string) => {
  try {
    // Start with a search for gas stations in the city
    const query = `gas station in ${city}, Metro Manila, Philippines`;
    const encodedQuery = encodeURIComponent(query);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&type=gas_station&region=ph&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch gas stations: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status}`);
    }

    return data.results;
  } catch (error) {
    console.error('Error searching gas stations:', error);
    throw error;
  }
};
