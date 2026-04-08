// Auto-generated from Supabase schema. Do not edit manually.
// Regenerate with: pnpm db:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_type: string
          company_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          country: string
          created_at: string
          current_methods: string[] | null
          deleted_at: string | null
          employee_count: number | null
          facade_revenue_currency: string | null
          facade_revenue_estimate: number | null
          facade_team_size: number | null
          facade_types: string[] | null
          flagged: boolean
          flagged_reason: string | null
          id: string
          name: string
          notes: string | null
          operational_area: string | null
          org_number: string | null
          phase: Database["public"]["Enums"]["customer_phase"]
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          country: string
          created_at?: string
          current_methods?: string[] | null
          deleted_at?: string | null
          employee_count?: number | null
          facade_revenue_currency?: string | null
          facade_revenue_estimate?: number | null
          facade_team_size?: number | null
          facade_types?: string[] | null
          flagged?: boolean
          flagged_reason?: string | null
          id: string
          name: string
          notes?: string | null
          operational_area?: string | null
          org_number?: string | null
          phase?: Database["public"]["Enums"]["customer_phase"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          country?: string
          created_at?: string
          current_methods?: string[] | null
          deleted_at?: string | null
          employee_count?: number | null
          facade_revenue_currency?: string | null
          facade_revenue_estimate?: number | null
          facade_team_size?: number | null
          facade_types?: string[] | null
          flagged?: boolean
          flagged_reason?: string | null
          id?: string
          name?: string
          notes?: string | null
          operational_area?: string | null
          org_number?: string | null
          phase?: Database["public"]["Enums"]["customer_phase"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          is_training_contact: boolean
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          preferred_language: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_primary?: boolean
          is_training_contact?: boolean
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          is_training_contact?: boolean
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_dwa_details: {
        Row: {
          company_id: string
          equipment_needed: string[] | null
          equipment_owned: string[] | null
          existing_drone_experience: string | null
          has_a1_a3: boolean | null
          has_a2: boolean | null
          has_sts01: boolean | null
          pilots_to_train: number | null
          selected_packages: Json | null
          target_start_date: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          equipment_needed?: string[] | null
          equipment_owned?: string[] | null
          existing_drone_experience?: string | null
          has_a1_a3?: boolean | null
          has_a2?: boolean | null
          has_sts01?: boolean | null
          pilots_to_train?: number | null
          selected_packages?: Json | null
          target_start_date?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          equipment_needed?: string[] | null
          equipment_owned?: string[] | null
          existing_drone_experience?: string | null
          has_a1_a3?: boolean | null
          has_a2?: boolean | null
          has_sts01?: boolean | null
          pilots_to_train?: number | null
          selected_packages?: Json | null
          target_start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_dwa_details_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_economy: {
        Row: {
          company_id: string
          currency: string | null
          last_synced_at: string | null
          outstanding_amount: number | null
          paid_amount: number | null
          quoted_price: number | null
          tripletex_customer_id: string | null
        }
        Insert: {
          company_id: string
          currency?: string | null
          last_synced_at?: string | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          quoted_price?: number | null
          tripletex_customer_id?: string | null
        }
        Update: {
          company_id?: string
          currency?: string | null
          last_synced_at?: string | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          quoted_price?: number | null
          tripletex_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_economy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_checklist_items: {
        Row: {
          company_id: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          id: string
          item_key: string
          label: string
          phase: Database["public"]["Enums"]["customer_phase"]
          sort_order: number
        }
        Insert: {
          company_id: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          id: string
          item_key: string
          label: string
          phase: Database["public"]["Enums"]["customer_phase"]
          sort_order?: number
        }
        Update: {
          company_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          item_key?: string
          label?: string
          phase?: Database["public"]["Enums"]["customer_phase"]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "phase_checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Enums: {
      customer_phase:
        | "lead"
        | "qualification"
        | "sales"
        | "onboarding"
        | "training"
        | "operational"
        | "finished"
      task_status: "open" | "in_progress" | "done" | "cancelled"
      task_priority: "low" | "medium" | "high" | "critical"
      task_category: "sales" | "training" | "admin" | "development" | "research" | "other"
      proposal_status:
        | "pending_approval"
        | "rejected"
        | "approved_pending_execution"
        | "executed"
        | "execution_failed"
        | "expired"
      proposal_action_type:
        | "phase_transition"
        | "task_creation"
        | "customer_update"
        | "calendar_event"
        | "email_draft"
        | "document_generation"
        | "welcome_package"
        | "bug_fix"
        | "other"
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
