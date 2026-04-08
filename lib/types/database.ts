export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      farms: {
        Row: {
          id: string
          name: string
          description: string | null
          short_description: string | null
          address: string
          latitude: number | null
          longitude: number | null
          region: string | null
          phone: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          short_description?: string | null
          address: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          phone?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          short_description?: string | null
          address?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          phone?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          title: string
          description: string | null
          target_audience: string | null
          process_description: string | null
          duration_minutes: number | null
          notice: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          target_audience?: string | null
          process_description?: string | null
          duration_minutes?: number | null
          notice?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          target_audience?: string | null
          process_description?: string | null
          duration_minutes?: number | null
          notice?: string | null
          image_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      farm_programs: {
        Row: {
          id: string
          farm_id: string
          program_id: string
          is_active: boolean
        }
        Insert: {
          id?: string
          farm_id: string
          program_id: string
          is_active?: boolean
        }
        Update: {
          id?: string
          farm_id?: string
          program_id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'farm_programs_farm_id_fkey'
            columns: ['farm_id']
            referencedRelation: 'farms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'farm_programs_program_id_fkey'
            columns: ['program_id']
            referencedRelation: 'programs'
            referencedColumns: ['id']
          }
        ]
      }
      farm_schedules: {
        Row: {
          id: string
          farm_id: string
          day_of_week: number
          start_time: string
          end_time: string
          max_capacity: number
          recommended_capacity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          farm_id: string
          day_of_week: number
          start_time: string
          end_time: string
          max_capacity?: number
          recommended_capacity?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          farm_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          max_capacity?: number
          recommended_capacity?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'farm_schedules_farm_id_fkey'
            columns: ['farm_id']
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      reservations: {
        Row: {
          id: string
          reservation_no: string
          farm_id: string
          program_id: string | null
          schedule_id: string
          reservation_date: string
          start_time: string
          end_time: string
          head_count: number
          applicant_name: string
          applicant_phone: string
          phone_verified: boolean
          request_memo: string | null
          status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          reject_reason: string | null
          confirmed_at: string | null
          rejected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_no?: string
          farm_id: string
          program_id?: string | null
          schedule_id: string
          reservation_date: string
          start_time: string
          end_time: string
          head_count: number
          applicant_name: string
          applicant_phone: string
          phone_verified?: boolean
          request_memo?: string | null
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          reject_reason?: string | null
          confirmed_at?: string | null
          rejected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_no?: string
          farm_id?: string
          program_id?: string | null
          schedule_id?: string
          reservation_date?: string
          start_time?: string
          end_time?: string
          head_count?: number
          applicant_name?: string
          applicant_phone?: string
          phone_verified?: boolean
          request_memo?: string | null
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          reject_reason?: string | null
          confirmed_at?: string | null
          rejected_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reservations_farm_id_fkey'
            columns: ['farm_id']
            referencedRelation: 'farms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservations_schedule_id_fkey'
            columns: ['schedule_id']
            referencedRelation: 'farm_schedules'
            referencedColumns: ['id']
          }
        ]
      }
      phone_verifications: {
        Row: {
          id: string
          phone: string
          code: string
          expires_at: string
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          code: string
          expires_at: string
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          code?: string
          expires_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          id: string
          name: string
          role: 'super_admin' | 'farm_admin'
          farm_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role?: 'super_admin' | 'farm_admin'
          farm_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'super_admin' | 'farm_admin'
          farm_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_profiles_farm_id_fkey'
            columns: ['farm_id']
            referencedRelation: 'farms'
            referencedColumns: ['id']
          }
        ]
      }
      reservation_logs: {
        Row: {
          id: string
          reservation_id: string
          action: 'created' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          actor_type: 'user' | 'admin' | 'system'
          actor_id: string | null
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          action: 'created' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          actor_type: 'user' | 'admin' | 'system'
          actor_id?: string | null
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          action?: 'created' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
          actor_type?: 'user' | 'admin' | 'system'
          actor_id?: string | null
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reservation_logs_reservation_id_fkey'
            columns: ['reservation_id']
            referencedRelation: 'reservations'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_farm_id: {
        Args: Record<PropertyKey, never>
        Returns: string
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
