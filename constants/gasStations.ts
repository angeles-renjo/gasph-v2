// constants/gasStations.ts
import { Database } from '@/utils/supabase/types';

export const NCR_CITIES = [
  'Quezon City',
  'Manila',
  'Makati',
  'Pasig',
  'Taguig',
  'Parañaque',
  'Caloocan',
  'Las Piñas',
  'Mandaluyong',
  'Muntinlupa',
  'Pasay',
  'Marikina',
  'Valenzuela',
  'Malabon',
  'San Juan',
  'Navotas',
  'Pateros',
];

export const COMMON_BRANDS = [
  'Shell',
  'Petron',
  'Caltex',
  'Phoenix',
  'Seaoil',
  'PTT',
  'Unioil',
  'Total',
  'Jetti',
  'Eastern Petroleum',
  'Flying V',
  'Insular Oil',
  'Petro Gazz',
  'Cleanfuel',
  'Metro Oil',
];

export const DEFAULT_AMENITIES = {
  convenience_store: false,
  restroom: false,
  car_wash: false,
  atm: false,
  food_service: false,
  air_pump: false,
  water_station: false,
  wifi: false,
};

export const DEFAULT_OPERATING_HOURS = {
  is24Hours: false,
  Monday: { open: '06:00', close: '22:00' },
  Tuesday: { open: '06:00', close: '22:00' },
  Wednesday: { open: '06:00', close: '22:00' },
  Thursday: { open: '06:00', close: '22:00' },
  Friday: { open: '06:00', close: '22:00' },
  Saturday: { open: '06:00', close: '22:00' },
  Sunday: { open: '06:00', close: '22:00' },
};

export type GasStation = Database['public']['Tables']['gas_stations']['Row'];

export interface ImportStatus {
  city: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  stationsFound?: number;
  stationsImported?: number;
  error?: string;
}

export interface OverallProgress {
  total: number;
  processed: number;
  imported: number;
}

export const RATE_LIMIT = {
  SEARCH: {
    DELAY: 1000,
  },
  DETAILS: {
    DELAY: 1000,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000,
  },
};
