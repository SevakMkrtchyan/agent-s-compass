export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      buyer_data: {
        Row: {
          buyer_id: string
          content: string
          created_at: string
          data_type: string
          embedding: string | null
          id: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          content: string
          created_at?: string
          data_type: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          content?: string
          created_at?: string
          data_type?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      buyer_properties: {
        Row: {
          agent_notes: string | null
          ai_analysis: string | null
          ai_analysis_generated_at: string | null
          archived: boolean | null
          assigned_at: string | null
          buyer_id: string
          created_at: string
          favorited: boolean | null
          id: string
          property_id: string
          scheduled_showing_datetime: string | null
          updated_at: string
          viewed: boolean | null
        }
        Insert: {
          agent_notes?: string | null
          ai_analysis?: string | null
          ai_analysis_generated_at?: string | null
          archived?: boolean | null
          assigned_at?: string | null
          buyer_id: string
          created_at?: string
          favorited?: boolean | null
          id?: string
          property_id: string
          scheduled_showing_datetime?: string | null
          updated_at?: string
          viewed?: boolean | null
        }
        Update: {
          agent_notes?: string | null
          ai_analysis?: string | null
          ai_analysis_generated_at?: string | null
          archived?: boolean | null
          assigned_at?: string | null
          buyer_id?: string
          created_at?: string
          favorited?: boolean | null
          id?: string
          property_id?: string
          scheduled_showing_datetime?: string | null
          updated_at?: string
          viewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_recommendations: {
        Row: {
          actions_json: Json
          buyer_id: string
          created_at: string
          expires_at: string
          id: string
          status: string
        }
        Insert: {
          actions_json: Json
          buyer_id: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
        }
        Update: {
          actions_json?: Json
          buyer_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      compliance_rules: {
        Row: {
          blocked_actions: string[] | null
          created_at: string
          description: string
          embedding: string | null
          id: string
          prerequisites: string[] | null
          rule_code: string
          title: string
        }
        Insert: {
          blocked_actions?: string[] | null
          created_at?: string
          description: string
          embedding?: string | null
          id?: string
          prerequisites?: string[] | null
          rule_code: string
          title: string
        }
        Update: {
          blocked_actions?: string[] | null
          created_at?: string
          description?: string
          embedding?: string | null
          id?: string
          prerequisites?: string[] | null
          rule_code?: string
          title?: string
        }
        Relationships: []
      }
      market_feeds: {
        Row: {
          content: string
          embedding: string | null
          feed_type: string
          fetched_at: string
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          embedding?: string | null
          feed_type: string
          fetched_at?: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          embedding?: string | null
          feed_type?: string
          fetched_at?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          bathrooms: number
          bedrooms: number
          city: string
          created_at: string
          days_on_market: number | null
          description: string | null
          features: Json | null
          id: string
          listing_agent: Json | null
          listing_url: string | null
          lot_size: string | null
          mls_id: string | null
          mls_number: string | null
          photos: Json | null
          price: number
          price_per_sqft: number | null
          property_type: string | null
          raw_data: Json | null
          sqft: number
          state: string
          status: string | null
          updated_at: string
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address: string
          bathrooms: number
          bedrooms: number
          city: string
          created_at?: string
          days_on_market?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          listing_agent?: Json | null
          listing_url?: string | null
          lot_size?: string | null
          mls_id?: string | null
          mls_number?: string | null
          photos?: Json | null
          price: number
          price_per_sqft?: number | null
          property_type?: string | null
          raw_data?: Json | null
          sqft: number
          state: string
          status?: string | null
          updated_at?: string
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address?: string
          bathrooms?: number
          bedrooms?: number
          city?: string
          created_at?: string
          days_on_market?: number | null
          description?: string | null
          features?: Json | null
          id?: string
          listing_agent?: Json | null
          listing_url?: string | null
          lot_size?: string | null
          mls_id?: string | null
          mls_number?: string | null
          photos?: Json | null
          price?: number
          price_per_sqft?: number | null
          property_type?: string | null
          raw_data?: Json | null
          sqft?: number
          state?: string
          status?: string | null
          updated_at?: string
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_buyer_context: {
        Args: {
          match_buyer_id: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          buyer_id: string
          content: string
          data_type: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_market_feeds: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          feed_type: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
