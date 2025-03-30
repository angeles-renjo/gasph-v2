export interface BestPricesParams {
  fuelType?: string;
  maxDistance?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface PriceCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "archived";
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
}

export interface Station {
  name: string;
  brand: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  amenities: Record<string, boolean>;
  operating_hours: Record<string, string>;
  status: "active";
}

export interface PlaceDetails {
  formatted_address: string;
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
