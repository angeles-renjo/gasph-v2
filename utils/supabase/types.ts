export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      fuel_prices: {
        Row: {
          id: string;
          area: string;
          brand: string;
          fuel_type: string;
          min_price: number;
          max_price: number;
          common_price: number;
          week_of: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          area: string;
          brand: string;
          fuel_type: string;
          min_price: number;
          max_price: number;
          common_price: number;
          week_of: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          area?: string;
          brand?: string;
          fuel_type?: string;
          min_price?: number;
          max_price?: number;
          common_price?: number;
          week_of?: string;
          updated_at?: string;
        };
      };

      price_confirmations: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          confirmed_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          user_id: string;
          confirmed_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          user_id?: string;
          confirmed_at?: string;
        };
      };

      gas_stations: {
        Row: {
          id: string;
          name: string;
          brand: string;
          address: string;
          city: string;
          province: string;
          latitude: number;
          longitude: number;
          amenities: Json;
          operating_hours: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand: string;
          address: string;
          city: string;
          province: string;
          latitude: number;
          longitude: number;
          amenities?: Json;
          operating_hours?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string;
          address?: string;
          city?: string;
          province?: string;
          latitude?: number;
          longitude?: number;
          amenities?: Json;
          operating_hours?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      price_reporting_cycles: {
        Row: {
          id: string;
          cycle_number: number;
          start_date: string;
          end_date: string;
          status: "active" | "completed" | "archived";
          doe_import_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cycle_number?: number;
          start_date: string;
          end_date: string;
          status?: "active" | "completed" | "archived";
          doe_import_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cycle_number?: number;
          start_date?: string;
          end_date?: string;
          status?: "active" | "completed" | "archived";
          doe_import_date?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          reputation_score: number | null;
          is_admin: boolean | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          reputation_score?: number | null;
          is_admin?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          reputation_score?: number | null;
          is_admin?: boolean | null;
          created_at?: string;
        };
      };
      user_price_reports: {
        Row: {
          id: string;
          station_id: string;
          fuel_type: string;
          price: number;
          user_id: string;
          reported_at: string;
          expires_at: string;
          upvotes: number;
          downvotes: number;
          cycle_id: string | null;
          confirmations_count?: number;
        };
        Insert: {
          id?: string;
          station_id: string;
          fuel_type: string;
          price: number;
          user_id: string;
          reported_at?: string;
          expires_at: string;
          upvotes?: number;
          downvotes?: number;
          cycle_id?: string | null;
          confirmations_count?: number;
        };
        Update: {
          id?: string;
          station_id?: string;
          fuel_type?: string;
          price?: number;
          user_id?: string;
          reported_at?: string;
          expires_at?: string;
          upvotes?: number;
          downvotes?: number;
          cycle_id?: string | null;
          confirmations_count?: number;
        };
      };
      user_price_votes: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          is_upvote: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          user_id: string;
          is_upvote: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          user_id?: string;
          is_upvote?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      active_price_reports: {
        Row: {
          id: string;
          station_id: string;
          fuel_type: string;
          price: number;
          user_id: string;
          reported_at: string;
          expires_at: string;
          upvotes: number;
          downvotes: number;
          cycle_id: string | null;
          station_name: string;
          station_brand: string;
          station_city: string;
          station_latitude: number;
          station_longitude: number;
          reporter_username: string;
          confidence_score: number;
        };
      };
      best_prices: {
        Row: {
          city: string;
          province: string;
          fuel_type: string;
          price: number;
          station_id: string;
          station_name: string;
          station_brand: string;
          station_latitude: number;
          station_longitude: number;
          price_rank: number;
        };
      };
      current_price_cycle: {
        Row: {
          id: string;
          cycle_number: number;
          start_date: string;
          end_date: string;
          status: "active" | "completed" | "archived";
          doe_import_date: string | null;
          created_at: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
