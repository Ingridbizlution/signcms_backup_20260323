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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          category: string
          created_at: string
          detail: string | null
          id: string
          ip_address: string | null
          org_id: string | null
          target_id: string | null
          target_name: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          ip_address?: string | null
          org_id?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      design_projects: {
        Row: {
          aspect: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string | null
          updated_at: string
          zones: Json
        }
        Insert: {
          aspect?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id?: string | null
          updated_at?: string
          zones?: Json
        }
        Update: {
          aspect?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string | null
          updated_at?: string
          zones?: Json
        }
        Relationships: [
          {
            foreignKeyName: "design_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_devices: {
        Row: {
          created_at: string
          created_by: string | null
          device_type: string
          id: string
          name: string
          org_id: string | null
          screen_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_type?: string
          id?: string
          name: string
          org_id?: string | null
          screen_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_type?: string
          id?: string
          name?: string
          org_id?: string | null
          screen_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iot_devices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_devices_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_sensor_readings: {
        Row: {
          device_id: string
          id: string
          org_id: string | null
          recorded_at: string
          screen_id: string
          unit: string
          value: number
        }
        Insert: {
          device_id: string
          id?: string
          org_id?: string | null
          recorded_at?: string
          screen_id: string
          unit?: string
          value: number
        }
        Update: {
          device_id?: string
          id?: string
          org_id?: string | null
          recorded_at?: string
          screen_id?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "iot_sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "iot_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_sensor_readings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_sensor_readings_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: string
          file_type: string
          id: string
          knowledge_item_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: string
          file_type?: string
          id?: string
          knowledge_item_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: string
          file_type?: string
          id?: string
          knowledge_item_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          file_count: number
          id: string
          org_id: string | null
          sub_category: string
          synced: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string
          file_count?: number
          id?: string
          org_id?: string | null
          sub_category?: string
          synced?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          file_count?: number
          id?: string
          org_id?: string | null
          sub_category?: string
          synced?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          created_at: string
          design_project_id: string | null
          dimensions: string
          duration: string | null
          id: string
          is_system: boolean
          name: string
          org_id: string | null
          size: string
          thumbnail: string
          type: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          design_project_id?: string | null
          dimensions?: string
          duration?: string | null
          id?: string
          is_system?: boolean
          name: string
          org_id?: string | null
          size?: string
          thumbnail?: string
          type?: string
          uploaded_by?: string | null
          url?: string
        }
        Update: {
          created_at?: string
          design_project_id?: string | null
          dimensions?: string
          duration?: string | null
          id?: string
          is_system?: boolean
          name?: string
          org_id?: string | null
          size?: string
          thumbnail?: string
          type?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_items_design_project_id_fkey"
            columns: ["design_project_id"]
            isOneToOne: false
            referencedRelation: "design_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      playback_logs: {
        Row: {
          duration_seconds: number
          id: string
          media_id: string | null
          media_name: string
          org_id: string | null
          played_at: string
          screen_id: string | null
        }
        Insert: {
          duration_seconds?: number
          id?: string
          media_id?: string | null
          media_name?: string
          org_id?: string | null
          played_at?: string
          screen_id?: string | null
        }
        Update: {
          duration_seconds?: number
          id?: string
          media_id?: string | null
          media_name?: string
          org_id?: string | null
          played_at?: string
          screen_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playback_logs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_logs_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      publish_records: {
        Row: {
          created_at: string
          id: string
          published_by: string | null
          schedule_id: string | null
          schedule_name: string
          scheduled_at: string | null
          screen_id: string | null
          screen_name: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_by?: string | null
          schedule_id?: string | null
          schedule_name?: string
          scheduled_at?: string | null
          screen_id?: string | null
          screen_name?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          published_by?: string | null
          schedule_id?: string | null
          schedule_name?: string
          scheduled_at?: string | null
          screen_id?: string | null
          screen_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_records_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_records_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string
          design_project_id: string | null
          duration: number
          id: string
          item_type: string
          media_id: string | null
          schedule_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          design_project_id?: string | null
          duration?: number
          id?: string
          item_type?: string
          media_id?: string | null
          schedule_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          design_project_id?: string | null
          duration?: number
          id?: string
          item_type?: string
          media_id?: string | null
          schedule_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_design_project_id_fkey"
            columns: ["design_project_id"]
            isOneToOne: false
            referencedRelation: "design_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string | null
          days: string[]
          enabled: boolean
          end_date: string | null
          end_time: string
          id: string
          name: string
          org_id: string | null
          screen_id: string | null
          start_date: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          days?: string[]
          enabled?: boolean
          end_date?: string | null
          end_time?: string
          id?: string
          name: string
          org_id?: string | null
          screen_id?: string | null
          start_date?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          days?: string[]
          enabled?: boolean
          end_date?: string | null
          end_time?: string
          id?: string
          name?: string
          org_id?: string | null
          screen_id?: string | null
          start_date?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screen_logs: {
        Row: {
          created_at: string
          created_by: string | null
          event_detail: string | null
          event_title: string
          event_type: string
          id: string
          org_id: string | null
          screen_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_detail?: string | null
          event_title: string
          event_type?: string
          id?: string
          org_id?: string | null
          screen_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_detail?: string | null
          event_title?: string
          event_type?: string
          id?: string
          org_id?: string | null
          screen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screen_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screen_logs_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screens: {
        Row: {
          avg_download_speed: string
          avg_upload_speed: string
          branch: string
          connection_type: string
          created_at: string
          id: string
          ip_address: string
          location: string
          name: string
          online: boolean
          org_id: string | null
          resolution: string
          serial_number: string
          status: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          avg_download_speed?: string
          avg_upload_speed?: string
          branch?: string
          connection_type?: string
          created_at?: string
          id?: string
          ip_address?: string
          location?: string
          name: string
          online?: boolean
          org_id?: string | null
          resolution?: string
          serial_number?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          avg_download_speed?: string
          avg_upload_speed?: string
          branch?: string
          connection_type?: string
          created_at?: string
          id?: string
          ip_address?: string
          location?: string
          name?: string
          online?: boolean
          org_id?: string | null
          resolution?: string
          serial_number?: string
          status?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_in_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
