export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      gas_stations: {
        Row: {
          address: string;
          amenities: Json | null;
          brand: string;
          city: string;
          created_at: string | null;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          operating_hours: Json | null;
          province: string;
          status: string;
          updated_at: string | null;
          place_id?: string | null; // Add place_id
        };
        Insert: {
          address: string;
          amenities?: Json | null;
          brand: string;
          city: string;
          created_at?: string | null;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          operating_hours?: Json | null;
          province: string;
          status?: string;
          updated_at?: string | null;
          place_id?: string | null; // Add place_id
        };
        Update: {
          address?: string;
          amenities?: Json | null;
          brand?: string;
          city?: string;
          created_at?: string | null;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          operating_hours?: Json | null;
          province?: string;
          status?: string;
          updated_at?: string | null;
          place_id?: string | null; // Add place_id
        };
        Relationships: [];
      };
      price_confirmations: {
        Row: {
          confirmed_at: string | null;
          id: string;
          report_id: string | null;
          user_id: string | null;
        };
        Insert: {
          confirmed_at?: string | null;
          id?: string;
          report_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          confirmed_at?: string | null;
          id?: string;
          report_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'price_confirmations_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'active_price_reports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_confirmations_report_id_fkey';
            columns: ['report_id'];
            isOneToOne: false;
            referencedRelation: 'user_price_reports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_confirmations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      price_references: {
        Row: {
          area: string;
          brand: string | null;
          created_at: string | null;
          cycle_id: string | null;
          fuel_type: string;
          id: string;
          max_price: number | null;
          min_price: number | null;
          price: number | null;
          price_type: Database['public']['Enums']['price_type'];
          updated_at: string | null;
          week_of: string;
        };
        Insert: {
          area: string;
          brand?: string | null;
          created_at?: string | null;
          cycle_id?: string | null;
          fuel_type: string;
          id?: string;
          max_price?: number | null;
          min_price?: number | null;
          price?: number | null;
          price_type: Database['public']['Enums']['price_type'];
          updated_at?: string | null;
          week_of: string;
        };
        Update: {
          area?: string;
          brand?: string | null;
          created_at?: string | null;
          cycle_id?: string | null;
          fuel_type?: string;
          id?: string;
          max_price?: number | null;
          min_price?: number | null;
          price?: number | null;
          price_type?: Database['public']['Enums']['price_type'];
          updated_at?: string | null;
          week_of?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'price_references_cycle_id_fkey';
            columns: ['cycle_id'];
            isOneToOne: false;
            referencedRelation: 'current_price_cycle';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'price_references_cycle_id_fkey';
            columns: ['cycle_id'];
            isOneToOne: false;
            referencedRelation: 'price_reporting_cycles';
            referencedColumns: ['id'];
          }
        ];
      };
      price_reporting_cycles: {
        Row: {
          created_at: string | null;
          cycle_number: number;
          doe_import_date: string | null;
          // end_date: string | null // Removed
          id: string;
          // start_date: string | null // Removed
          status: string;
        };
        Insert: {
          created_at?: string | null;
          cycle_number?: number;
          doe_import_date?: string | null;
          // end_date?: string | null // Removed
          id?: string;
          // start_date?: string | null // Removed
          status?: string;
        };
        Update: {
          created_at?: string | null;
          cycle_number?: number;
          doe_import_date?: string | null;
          // end_date?: string | null // Removed
          id?: string;
          // start_date?: string | null // Removed
          status?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          id: string;
          is_admin: boolean | null;
          reputation_score: number | null;
          username: string;
          is_pro: boolean; // Add is_pro field
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          id: string;
          is_admin?: boolean | null;
          reputation_score?: number | null;
          username: string;
          is_pro?: boolean; // Add is_pro field
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_admin?: boolean | null;
          reputation_score?: number | null;
          username?: string;
          is_pro?: boolean; // Add is_pro field
        };
        Relationships: [];
      };
      user_price_reports: {
        Row: {
          cycle_id: string;
          fuel_type: string;
          id: string;
          price: number;
          reported_at: string | null;
          station_id: string;
          user_id: string;
        };
        Insert: {
          cycle_id: string;
          fuel_type: string;
          id?: string;
          price: number;
          reported_at?: string | null;
          station_id: string;
          user_id: string;
        };
        Update: {
          cycle_id?: string;
          fuel_type?: string;
          id?: string;
          price?: number;
          reported_at?: string | null;
          station_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_price_reports_cycle_id_fkey';
            columns: ['cycle_id'];
            isOneToOne: false;
            referencedRelation: 'current_price_cycle';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_price_reports_cycle_id_fkey';
            columns: ['cycle_id'];
            isOneToOne: false;
            referencedRelation: 'price_reporting_cycles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_price_reports_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'doe_price_view';
            referencedColumns: ['gas_station_id'];
          },
          {
            foreignKeyName: 'user_price_reports_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'gas_stations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_price_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      station_reports: {
        Row: {
          created_at: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          reason: string | null;
          report_type: Database['public']['Enums']['report_type'];
          reported_data: Json | null;
          resolved_at: string | null;
          resolver_id: string | null;
          station_id: string | null;
          status: Database['public']['Enums']['report_status'];
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          reason?: string | null;
          report_type: Database['public']['Enums']['report_type'];
          reported_data?: Json | null;
          resolved_at?: string | null;
          resolver_id?: string | null;
          station_id?: string | null;
          status?: Database['public']['Enums']['report_status'];
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          reason?: string | null;
          report_type?: Database['public']['Enums']['report_type'];
          reported_data?: Json | null;
          resolved_at?: string | null;
          resolver_id?: string | null;
          station_id?: string | null;
          status?: Database['public']['Enums']['report_status'];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'station_reports_resolver_id_fkey';
            columns: ['resolver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'station_reports_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'doe_price_view';
            referencedColumns: ['gas_station_id'];
          },
          {
            foreignKeyName: 'station_reports_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'gas_stations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'station_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          station_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          station_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          station_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_favorites_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'gas_stations';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      active_price_reports: {
        Row: {
          confidence_score: number | null;
          confirmations_count: number | null;
          cycle_id: string | null;
          fuel_type: string | null;
          id: string | null;
          price: number | null;
          reported_at: string | null;
          reporter_username: string | null;
          station_brand: string | null;
          station_city: string | null;
          station_id: string | null;
          station_latitude: number | null;
          station_longitude: number | null;
          station_name: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_price_reports_cycle_id_fkey';
            columns: ['cycle_id'];
            isOneToOne: false;
            referencedRelation: 'current_price_cycle';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_price_reports_cycle_id_fkey';
            columns: ['cycle_id'];
            isOneToOne: false;
            referencedRelation: 'price_reporting_cycles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_price_reports_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'doe_price_view';
            referencedColumns: ['gas_station_id'];
          },
          {
            foreignKeyName: 'user_price_reports_station_id_fkey';
            columns: ['station_id'];
            isOneToOne: false;
            referencedRelation: 'gas_stations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_price_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      current_price_cycle: {
        Row: {
          created_at: string | null;
          cycle_number: number | null;
          doe_import_date: string | null;
          end_date: string | null;
          id: string | null;
          start_date: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          cycle_number?: number | null;
          doe_import_date?: string | null;
          end_date?: string | null;
          id?: string | null;
          start_date?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          cycle_number?: number | null;
          doe_import_date?: string | null;
          end_date?: string | null;
          id?: string | null;
          start_date?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      doe_price_view: {
        Row: {
          common_price: number | null;
          fuel_type: string | null;
          gas_station_address: string | null;
          gas_station_city: string | null;
          gas_station_id: string | null;
          gas_station_name: string | null;
          max_price: number | null;
          min_price: number | null;
          source_type: string | null;
          week_of: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      archive_old_price_cycles: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      assign_admin_role: {
        Args: {
          user_email: string;
        };
        Returns: undefined;
      };
      audit_function_usage: {
        Args: Record<PropertyKey, never>;
        Returns: {
          function_name: string;
          function_schema: string;
          used_in_triggers: boolean;
          used_in_views: boolean;
          used_in_constraints: boolean;
          used_in_functions: boolean;
          last_called: string;
        }[];
      };
      confirm_price_report: {
        Args: {
          p_report_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      decrement: {
        Args: {
          row_id: string;
          column_name: string;
          table_name: string;
        };
        Returns: number;
      };
      increment: {
        Args: {
          row_id: string;
          column_name: string;
          table_name: string;
        };
        Returns: number;
      };
      is_user_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
      revoke_admin_role: {
        Args: {
          user_email: string;
        };
        Returns: undefined;
      };
      validate_price_reports: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      price_type: 'brand_range' | 'overall_range' | 'common';
      report_status: 'pending' | 'approved' | 'rejected';
      report_type: 'add' | 'update' | 'delete';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
  ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;
