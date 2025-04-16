import { Tables, Json } from '@/utils/supabase/types'; // Import base types

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

// --- Added Types from Reports ---

// Type for a report fetched from the DB, potentially joining user info
export type StationReportWithUser = Tables<'station_reports'> & {
  // Use the alias 'profile' defined in the select statement
  profile: { username: string | null } | null;
};

// Define the expected structure within reported_data for 'add' reports
export type ReportedAddData = {
  name?: Json | undefined;
  brand?: Json | undefined;
  address?: Json | undefined;
  city?: Json | undefined;
  province?: Json | undefined;
  amenities?: Json | undefined;
  operating_hours_notes?: Json | undefined;
  comments?: Json | undefined;
  // Add index signature to align with Json object type and resolve predicate error
  [key: string]: Json | undefined;
};

// Type guard to check if the reported_data is a valid object (non-null, non-array)
// Note: Type guards generally live closer to their usage, but placing it here for consolidation as requested.
// Consider moving it back if it causes issues or feels out of place later.
export function isValidReportedAddData(
  data: Json | null
): data is ReportedAddData {
  return data !== null && typeof data === 'object' && !Array.isArray(data);
}

// --- End Added Types ---
