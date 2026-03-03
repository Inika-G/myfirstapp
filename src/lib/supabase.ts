import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      prescriptions: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          status: 'pending' | 'analyzed' | 'error';
          detected_disease: string | null;
          analysis_data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
      };
      medications: {
        Row: {
          id: string;
          prescription_id: string | null;
          user_id: string;
          name: string;
          dosage: string;
          frequency: string;
          timing: string;
          duration_days: number | null;
          start_date: string;
          end_date: string | null;
          notes: string | null;
          created_at: string;
        };
      };
      health_trackers: {
        Row: {
          id: string;
          user_id: string;
          tracker_type: string;
          date: string;
          metrics: Record<string, unknown>;
          notes: string | null;
          created_at: string;
        };
      };
      medication_reminders: {
        Row: {
          id: string;
          medication_id: string;
          user_id: string;
          reminder_time: string;
          days_of_week: string[];
          is_active: boolean;
          last_taken_at: string | null;
          created_at: string;
        };
      };
      diet_plans: {
        Row: {
          id: string;
          user_id: string;
          disease_type: string;
          meal_type: string;
          recommendations: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          gender: string | null;
          detected_conditions: string[];
          active_trackers: string[];
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
