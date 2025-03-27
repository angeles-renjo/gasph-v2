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
export interface PriceCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: "active" | "completed" | "archived";
  doe_import_date?: string;
  created_at: string;
}

// ... other existing types
