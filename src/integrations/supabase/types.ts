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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_action_logs: {
        Row: {
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          input: Json
          output: Json
          success: boolean
          tool_name: string
          workspace_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json
          success?: boolean
          tool_name: string
          workspace_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json
          success?: boolean
          tool_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_settings: {
        Row: {
          agent_name: string
          autonomy_level: string
          enabled: boolean
          escalation_rules: string
          forbidden_topics: string
          instructions: string
          tone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_name?: string
          autonomy_level?: string
          enabled?: boolean
          escalation_rules?: string
          forbidden_topics?: string
          instructions?: string
          tone?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_name?: string
          autonomy_level?: string
          enabled?: boolean
          escalation_rules?: string
          forbidden_topics?: string
          instructions?: string
          tone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          autonomy_level: string
          channels: string[]
          created_at: string
          enabled: boolean
          escalation_rules: string
          forbidden_topics: string
          id: string
          instructions: string
          is_default: boolean
          name: string
          purpose: string
          tone: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          autonomy_level?: string
          channels?: string[]
          created_at?: string
          enabled?: boolean
          escalation_rules?: string
          forbidden_topics?: string
          id?: string
          instructions?: string
          is_default?: boolean
          name?: string
          purpose?: string
          tone?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          autonomy_level?: string
          channels?: string[]
          created_at?: string
          enabled?: boolean
          escalation_rules?: string
          forbidden_topics?: string
          id?: string
          instructions?: string
          is_default?: boolean
          name?: string
          purpose?: string
          tone?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_status_history: {
        Row: {
          actor: string | null
          appointment_id: string
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
          workspace_id: string
        }
        Insert: {
          actor?: string | null
          appointment_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
          workspace_id: string
        }
        Update: {
          actor?: string | null
          appointment_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_status_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          contact_id: string
          conversation_id: string | null
          created_at: string
          deposit_pence: number
          deposit_status: string
          ends_at: string
          external_calendar_id: string | null
          external_event_id: string | null
          id: string
          last_synced_at: string | null
          notes: string | null
          price_pence: number
          service_id: string
          staff_id: string
          starts_at: string
          status: string
          sync_status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contact_id: string
          conversation_id?: string | null
          created_at?: string
          deposit_pence?: number
          deposit_status?: string
          ends_at: string
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          price_pence?: number
          service_id: string
          staff_id: string
          starts_at: string
          status?: string
          sync_status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contact_id?: string
          conversation_id?: string | null
          created_at?: string
          deposit_pence?: number
          deposit_status?: string
          ends_at?: string
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          price_pence?: number
          service_id?: string
          staff_id?: string
          starts_at?: string
          status?: string
          sync_status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_events: {
        Row: {
          appointment_id: string | null
          channel: string | null
          conversation_id: string | null
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          scheduled_for: string
          sent_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          appointment_id?: string | null
          channel?: string | null
          conversation_id?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string | null
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_flows: {
        Row: {
          created_at: string
          edges: Json
          enabled: boolean
          id: string
          kind: string
          name: string
          nodes: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          edges?: Json
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          nodes?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          edges?: Json
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          nodes?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_flows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          appointment_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          workspace_id: string
        }
        Insert: {
          appointment_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          workspace_id: string
        }
        Update: {
          appointment_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_policies: {
        Row: {
          body: string
          id: string
          kind: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body: string
          id?: string
          kind: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          id?: string
          kind?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_policies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          address: string | null
          buffer_minutes: number
          currency: string
          email: string | null
          legal_name: string | null
          max_days_ahead: number
          min_notice_minutes: number
          opening_hours: Json
          phone: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          address?: string | null
          buffer_minutes?: number
          currency?: string
          email?: string | null
          legal_name?: string | null
          max_days_ahead?: number
          min_notice_minutes?: number
          opening_hours?: Json
          phone?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          address?: string | null
          buffer_minutes?: number
          currency?: string
          email?: string | null
          legal_name?: string | null
          max_days_ahead?: number
          min_notice_minutes?: number
          opening_hours?: Json
          phone?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_categories: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          position: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          position?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          position?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_connections: {
        Row: {
          channel: string
          config: Json
          display_name: string | null
          id: string
          last_error: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel: string
          config?: Json
          display_name?: string | null
          id?: string
          last_error?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel?: string
          config?: Json
          display_name?: string | null
          id?: string
          last_error?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_secrets: {
        Row: {
          channel: string
          secrets: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel: string
          secrets?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel?: string
          secrets?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_secrets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_channels: {
        Row: {
          channel: string
          contact_id: string
          created_at: string
          display_name: string | null
          external_id: string
          id: string
          verified: boolean
          workspace_id: string
        }
        Insert: {
          channel: string
          contact_id: string
          created_at?: string
          display_name?: string | null
          external_id: string
          id?: string
          verified?: boolean
          workspace_id: string
        }
        Update: {
          channel?: string
          contact_id?: string
          created_at?: string
          display_name?: string | null
          external_id?: string
          id?: string
          verified?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_channels_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          ai_summary: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_interaction_at: string | null
          notes: string | null
          phone: string | null
          tags: string[]
          workspace_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_interaction_at?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          workspace_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_interaction_at?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          ai_lock_at: string | null
          assigned_to: string | null
          channel: string
          contact_id: string
          created_at: string
          external_thread_id: string | null
          handling_mode: string
          id: string
          intent: string | null
          last_message_at: string
          needs_attention: boolean
          state: string
          status: string
          subject: string | null
          unread: boolean
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          ai_lock_at?: string | null
          assigned_to?: string | null
          channel: string
          contact_id: string
          created_at?: string
          external_thread_id?: string | null
          handling_mode?: string
          id?: string
          intent?: string | null
          last_message_at?: string
          needs_attention?: boolean
          state?: string
          status?: string
          subject?: string | null
          unread?: boolean
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          ai_lock_at?: string | null
          assigned_to?: string | null
          channel?: string
          contact_id?: string
          created_at?: string
          external_thread_id?: string | null
          handling_mode?: string
          id?: string
          intent?: string | null
          last_message_at?: string
          needs_attention?: boolean
          state?: string
          status?: string
          subject?: string | null
          unread?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_connections: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          connected_by: string | null
          created_at: string
          google_email: string | null
          last_error: string | null
          refresh_token: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          connected_by?: string | null
          created_at?: string
          google_email?: string | null
          last_error?: string | null
          refresh_token: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          connected_by?: string | null
          created_at?: string
          google_email?: string | null
          last_error?: string | null
          refresh_token?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      handoffs: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          reason: string
          recommended_action: string | null
          resolved_at: string | null
          status: string
          summary: string
          taken_by: string | null
          workspace_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          reason: string
          recommended_action?: string | null
          resolved_at?: string | null
          status?: string
          summary: string
          taken_by?: string | null
          workspace_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          reason?: string
          recommended_action?: string | null
          resolved_at?: string | null
          status?: string
          summary?: string
          taken_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoffs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoffs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          level: string
          message: string
          payload: Json
          workspace_id: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          level?: string
          message: string
          payload?: Json
          workspace_id: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          payload?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          active: boolean
          body: string
          id: string
          kind: string
          tags: string[]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          body: string
          id?: string
          kind?: string
          tags?: string[]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          body?: string
          id?: string
          kind?: string
          tags?: string[]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          channel: string
          contact_id: string | null
          content_type: string
          conversation_id: string
          created_at: string
          direction: string
          external_message_id: string | null
          id: string
          metadata: Json
          sender_name: string | null
          sender_type: string
          workspace_id: string
        }
        Insert: {
          attachments?: Json
          body?: string
          channel: string
          contact_id?: string | null
          content_type?: string
          conversation_id: string
          created_at?: string
          direction: string
          external_message_id?: string | null
          id?: string
          metadata?: Json
          sender_name?: string | null
          sender_type?: string
          workspace_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          channel?: string
          contact_id?: string | null
          content_type?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          external_message_id?: string | null
          id?: string
          metadata?: Json
          sender_name?: string | null
          sender_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_pence: number
          appointment_id: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string
          currency: string
          id: string
          kind: string
          link_url: string | null
          paid_at: string | null
          provider: string
          provider_ref: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          amount_pence: number
          appointment_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          link_url?: string | null
          paid_at?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          amount_pence?: number
          appointment_id?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          link_url?: string | null
          paid_at?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reservations: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          kind: string
          note: string | null
          product_id: string
          quantity: number
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          kind?: string
          note?: string | null
          product_id: string
          quantity?: number
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          kind?: string
          note?: string | null
          product_id?: string
          quantity?: number
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reservations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          compare_at_pence: number | null
          created_at: string
          description: string | null
          fulfilment: string
          id: string
          image_urls: string[]
          name: string
          position: number
          price_pence: number
          sku: string | null
          stock: number | null
          updated_at: string
          visible_in_store: boolean
          workspace_id: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          compare_at_pence?: number | null
          created_at?: string
          description?: string | null
          fulfilment?: string
          id?: string
          image_urls?: string[]
          name: string
          position?: number
          price_pence?: number
          sku?: string | null
          stock?: number | null
          updated_at?: string
          visible_in_store?: boolean
          workspace_id: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          compare_at_pence?: number | null
          created_at?: string
          description?: string | null
          fulfilment?: string
          id?: string
          image_urls?: string[]
          name?: string
          position?: number
          price_pence?: number
          sku?: string | null
          stock?: number | null
          updated_at?: string
          visible_in_store?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      service_addons: {
        Row: {
          duration_minutes: number
          id: string
          name: string
          position: number
          price_pence: number
          service_id: string
          workspace_id: string
        }
        Insert: {
          duration_minutes?: number
          id?: string
          name: string
          position?: number
          price_pence?: number
          service_id: string
          workspace_id: string
        }
        Update: {
          duration_minutes?: number
          id?: string
          name?: string
          position?: number
          price_pence?: number
          service_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_addons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_addons_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      service_questions: {
        Row: {
          id: string
          label: string
          options: string[]
          position: number
          required: boolean
          service_id: string
          type: string
          workspace_id: string
        }
        Insert: {
          id?: string
          label: string
          options?: string[]
          position?: number
          required?: boolean
          service_id: string
          type?: string
          workspace_id: string
        }
        Update: {
          id?: string
          label?: string
          options?: string[]
          position?: number
          required?: boolean
          service_id?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_questions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_questions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      service_variants: {
        Row: {
          duration_minutes: number
          id: string
          name: string
          position: number
          price_pence: number
          service_id: string
          workspace_id: string
        }
        Insert: {
          duration_minutes?: number
          id?: string
          name: string
          position?: number
          price_pence?: number
          service_id: string
          workspace_id: string
        }
        Update: {
          duration_minutes?: number
          id?: string
          name?: string
          position?: number
          price_pence?: number
          service_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_variants_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_variants_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          archived: boolean
          buffer_minutes: number
          category_id: string | null
          created_at: string
          deposit_pence: number
          description: string | null
          duration_minutes: number
          id: string
          image_urls: string[]
          location_type: string
          name: string
          online_booking: boolean
          payment_mode: string
          position: number
          price_pence: number
          visible_in_store: boolean
          workspace_id: string
        }
        Insert: {
          active?: boolean
          archived?: boolean
          buffer_minutes?: number
          category_id?: string | null
          created_at?: string
          deposit_pence?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          image_urls?: string[]
          location_type?: string
          name: string
          online_booking?: boolean
          payment_mode?: string
          position?: number
          price_pence?: number
          visible_in_store?: boolean
          workspace_id: string
        }
        Update: {
          active?: boolean
          archived?: boolean
          buffer_minutes?: number
          category_id?: string | null
          created_at?: string
          deposit_pence?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          image_urls?: string[]
          location_type?: string
          name?: string
          online_booking?: boolean
          payment_mode?: string
          position?: number
          price_pence?: number
          visible_in_store?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          role_title: string | null
          workspace_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          role_title?: string | null
          workspace_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          role_title?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          id: string
          service_id: string
          staff_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          service_id: string
          staff_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          service_id?: string
          staff_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_off: {
        Row: {
          ends_at: string
          id: string
          reason: string | null
          staff_id: string
          starts_at: string
          workspace_id: string
        }
        Insert: {
          ends_at: string
          id?: string
          reason?: string | null
          staff_id: string
          starts_at: string
          workspace_id: string
        }
        Update: {
          ends_at?: string
          id?: string
          reason?: string | null
          staff_id?: string
          starts_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_off_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_working_hours: {
        Row: {
          end_time: string
          id: string
          staff_id: string
          start_time: string
          weekday: number
          workspace_id: string
        }
        Insert: {
          end_time: string
          id?: string
          staff_id: string
          start_time: string
          weekday: number
          workspace_id: string
        }
        Update: {
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
          weekday?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_working_hours_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_working_hours_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      website_configs: {
        Row: {
          about: string | null
          accent: string | null
          category: string
          created_at: string
          faqs: Json
          heading_font: string | null
          headline: string | null
          hero_image: string | null
          mode: string
          radius: string
          sections: Json
          socials: Json
          subheadline: string | null
          template: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          about?: string | null
          accent?: string | null
          category?: string
          created_at?: string
          faqs?: Json
          heading_font?: string | null
          headline?: string | null
          hero_image?: string | null
          mode?: string
          radius?: string
          sections?: Json
          socials?: Json
          subheadline?: string | null
          template?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          about?: string | null
          accent?: string | null
          category?: string
          created_at?: string
          faqs?: Json
          heading_font?: string | null
          headline?: string | null
          hero_image?: string | null
          mode?: string
          radius?: string
          sections?: Json
          socials?: Json
          subheadline?: string | null
          template?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_files: {
        Row: {
          created_at: string
          folder: string | null
          id: string
          kind: string
          mime: string | null
          name: string
          path: string | null
          size_bytes: number
          uploaded_by: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          folder?: string | null
          id?: string
          kind?: string
          mime?: string | null
          name: string
          path?: string | null
          size_bytes?: number
          uploaded_by?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          folder?: string | null
          id?: string
          kind?: string
          mime?: string | null
          name?: string
          path?: string | null
          size_bytes?: number
          uploaded_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          external_website_url: string | null
          id: string
          logo_url: string | null
          name: string
          onboarded_at: string | null
          slug: string
          store_enabled: boolean
          store_tagline: string | null
          timezone: string
        }
        Insert: {
          created_at?: string
          external_website_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarded_at?: string | null
          slug: string
          store_enabled?: boolean
          store_tagline?: string | null
          timezone?: string
        }
        Update: {
          created_at?: string
          external_website_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarded_at?: string | null
          slug?: string
          store_enabled?: boolean
          store_tagline?: string | null
          timezone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_member: { Args: { _workspace_id: string }; Returns: boolean }
      public_store: { Args: { _slug: string }; Returns: Json }
      site_data: { Args: { _workspace_id: string }; Returns: Json }
      workspace_team: {
        Args: { _workspace_id: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          joined_at: string
          role: string
          user_id: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
