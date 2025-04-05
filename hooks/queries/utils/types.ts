export interface BestPricesParams {
  fuelType?: string;
  maxDistance?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  stationCount?: number; // Add optional stationCount for query key dependency
}

export interface PriceCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'archived';
  doe_import_date?: string;
  created_at: string;
}

// We'll add more types as we implement features
export interface GooglePlacesStation {
  place_id: string;
  name: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address?: string;
  opening_hours?: {
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  types?: string[];
  address_components?: Array<{
    // Added address_components
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface Station {
  place_id: string; // Re-added: Column now exists in DB schema
  name: string;
  brand: string;
  address: string;
  city: string;
  province: string; // Added province field correctly
  latitude: number;
  longitude: number;
  amenities: Record<string, boolean>;
  operating_hours: Record<string, string>; // Assuming this is stored as JSONB/text
  status: 'active';
}

export interface PlaceDetails {
  business_status?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'; // Added based on Google Places API
  formatted_address: string;
  address_components?: Array<{
    // Added address_components here
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    periods: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text: string[];
  };
  types?: string[];
}

export interface ImportResult {
  importedStations: Station[];
  errors: Array<{ city: string; error: string }>;
}
