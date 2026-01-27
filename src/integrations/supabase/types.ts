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
      api_logs: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_params: Json | null
          response_status: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_params?: Json | null
          response_status?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_params?: Json | null
          response_status?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      artifacts: {
        Row: {
          artifact_type: string
          buyer_id: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          shared_at: string | null
          stage_id: string | null
          title: string
          visibility: string
        }
        Insert: {
          artifact_type: string
          buyer_id: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          shared_at?: string | null
          stage_id?: string | null
          title: string
          visibility?: string
        }
        Update: {
          artifact_type?: string
          buyer_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          shared_at?: string | null
          stage_id?: string | null
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
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
          assigned_by: string | null
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
          assigned_by?: string | null
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
          assigned_by?: string | null
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
      buyers: {
        Row: {
          agent_id: string
          agent_notes: string | null
          avatar_url: string | null
          budget_max: number | null
          budget_min: number | null
          buyer_type: string | null
          created_at: string
          current_stage: string | null
          email: string | null
          id: string
          min_baths: number | null
          min_beds: number | null
          must_haves: string | null
          name: string
          nice_to_haves: string | null
          phone: string | null
          portal_link: string | null
          pre_approval_amount: number | null
          pre_approval_status: string | null
          preferred_cities: string[] | null
          property_types: string[] | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_notes?: string | null
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_type?: string | null
          created_at?: string
          current_stage?: string | null
          email?: string | null
          id?: string
          min_baths?: number | null
          min_beds?: number | null
          must_haves?: string | null
          name: string
          nice_to_haves?: string | null
          phone?: string | null
          portal_link?: string | null
          pre_approval_amount?: number | null
          pre_approval_status?: string | null
          preferred_cities?: string[] | null
          property_types?: string[] | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_notes?: string | null
          avatar_url?: string | null
          budget_max?: number | null
          budget_min?: number | null
          buyer_type?: string | null
          created_at?: string
          current_stage?: string | null
          email?: string | null
          id?: string
          min_baths?: number | null
          min_beds?: number | null
          must_haves?: string | null
          name?: string
          nice_to_haves?: string | null
          phone?: string | null
          portal_link?: string | null
          pre_approval_amount?: number | null
          pre_approval_status?: string | null
          preferred_cities?: string[] | null
          property_types?: string[] | null
          updated_at?: string
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
          created_by: string | null
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
          source_id: string | null
          source_type: string | null
          source_url: string | null
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
          created_by?: string | null
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
          source_id?: string | null
          source_type?: string | null
          source_url?: string | null
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
          created_by?: string | null
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
          source_id?: string | null
          source_type?: string | null
          source_url?: string | null
          sqft?: number
          state?: string
          status?: string | null
          updated_at?: string
          year_built?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      property_cache: {
        Row: {
          cache_key: string
          cached_at: string
          data: Json
          expires_at: string
          id: string
          source: string | null
          zpid: string | null
        }
        Insert: {
          cache_key: string
          cached_at?: string
          data: Json
          expires_at?: string
          id?: string
          source?: string | null
          zpid?: string | null
        }
        Update: {
          cache_key?: string
          cached_at?: string
          data?: Json
          expires_at?: string
          id?: string
          source?: string | null
          zpid?: string | null
        }
        Relationships: []
      }
      stage_completion: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string
          criteria_index: number
          id: string
          is_completed: boolean
          stage_number: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          criteria_index: number
          id?: string
          is_completed?: boolean
          stage_number: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          criteria_index?: number
          id?: string
          is_completed?: boolean
          stage_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_completion_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          artifacts: Json | null
          completion_criteria: Json | null
          created_at: string
          icon: string | null
          id: string
          next_actions: Json | null
          stage_name: string
          stage_number: number
          stage_objective: string | null
          updated_at: string
        }
        Insert: {
          artifacts?: Json | null
          completion_criteria?: Json | null
          created_at?: string
          icon?: string | null
          id?: string
          next_actions?: Json | null
          stage_name: string
          stage_number: number
          stage_objective?: string | null
          updated_at?: string
        }
        Update: {
          artifacts?: Json | null
          completion_criteria?: Json | null
          created_at?: string
          icon?: string | null
          id?: string
          next_actions?: Json | null
          stage_name?: string
          stage_number?: number
          stage_objective?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          agent_id: string
          assigned_to: string
          assigned_to_name: string | null
          buyer_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          priority: string
          property_id: string | null
          source_action_id: string | null
          stage_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          assigned_to?: string
          assigned_to_name?: string | null
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          property_id?: string | null
          source_action_id?: string | null
          stage_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          assigned_to?: string
          assigned_to_name?: string | null
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          property_id?: string | null
          source_action_id?: string | null
          stage_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_cache: { Args: never; Returns: undefined }
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
