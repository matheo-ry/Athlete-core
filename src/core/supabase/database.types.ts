// Archivo generado con `npm run db:types` a partir de supabase/migrations/.
// No se edita a mano: cambia la migración y vuelve a generarlo.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          at: string;
          id: number;
          meta: NonNullable<Json>;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          at?: string;
          id?: never;
          meta?: NonNullable<Json>;
          tenant_id: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          at?: string;
          id?: never;
          meta?: NonNullable<Json>;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'audit_log_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      body_measurements: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          measured_on: string;
          side: string | null;
          tenant_id: string;
          updated_at: string;
          user_id: string;
          value_cm: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          measured_on: string;
          side?: string | null;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
          value_cm: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          measured_on?: string;
          side?: string | null;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
          value_cm?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'body_measurements_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'body_measurements_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      body_weights: {
        Row: {
          created_at: string;
          id: string;
          measured_on: string;
          tenant_id: string;
          updated_at: string;
          user_id: string;
          weight_kg: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          measured_on: string;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          measured_on?: string;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'body_weights_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'body_weights_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      client_exercise_setups: {
        Row: {
          client_id: string;
          created_at: string;
          exercise_id: string;
          id: string;
          setup: string;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          client_id: string;
          created_at?: string;
          exercise_id: string;
          id?: string;
          setup: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          exercise_id?: string;
          id?: string;
          setup?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'client_exercise_setups_tenant_id_exercise_id_fkey';
            columns: ['tenant_id', 'exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['tenant_id', 'id'];
          },
          {
            foreignKeyName: 'client_exercise_setups_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'client_exercise_setups_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      exercise_library: {
        Row: {
          equipment: string;
          is_unilateral: boolean;
          key: string;
          measurement: string;
          muscle_group: string;
          name_en: string;
          name_es: string;
        };
        ComputedFields: never;
        Insert: {
          equipment: string;
          is_unilateral?: boolean;
          key: string;
          measurement: string;
          muscle_group: string;
          name_en: string;
          name_es: string;
        };
        Update: {
          equipment?: string;
          is_unilateral?: boolean;
          key?: string;
          measurement?: string;
          muscle_group?: string;
          name_en?: string;
          name_es?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          equipment: string | null;
          id: string;
          instructions: string | null;
          is_unilateral: boolean;
          library_key: string | null;
          measurement: string;
          muscle_group: string | null;
          name: string | null;
          tenant_id: string;
          updated_at: string;
          video_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          equipment?: string | null;
          id?: string;
          instructions?: string | null;
          is_unilateral?: boolean;
          library_key?: string | null;
          measurement: string;
          muscle_group?: string | null;
          name?: string | null;
          tenant_id: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          equipment?: string | null;
          id?: string;
          instructions?: string | null;
          is_unilateral?: boolean;
          library_key?: string | null;
          measurement?: string;
          muscle_group?: string | null;
          name?: string | null;
          tenant_id?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'exercises_library_key_fkey';
            columns: ['library_key'];
            isOneToOne: false;
            referencedRelation: 'exercise_library';
            referencedColumns: ['key'];
          },
          {
            foreignKeyName: 'exercises_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'exercises_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      features: {
        Row: {
          config_schema: Json | null;
          description: string | null;
          is_enabled: boolean;
          key: string;
          kind: string;
          sunset_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          config_schema?: Json | null;
          description?: string | null;
          is_enabled?: boolean;
          key: string;
          kind: string;
          sunset_at?: string | null;
        };
        Update: {
          config_schema?: Json | null;
          description?: string | null;
          is_enabled?: boolean;
          key?: string;
          kind?: string;
          sunset_at?: string | null;
        };
        Relationships: [];
      };
      health_consents: {
        Row: {
          created_at: string;
          granted_at: string;
          id: string;
          tenant_id: string;
          text_version: string;
          updated_at: string;
          user_id: string;
          withdrawn_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          granted_at: string;
          id?: string;
          tenant_id: string;
          text_version: string;
          updated_at?: string;
          user_id: string;
          withdrawn_at?: string | null;
        };
        Update: {
          created_at?: string;
          granted_at?: string;
          id?: string;
          tenant_id?: string;
          text_version?: string;
          updated_at?: string;
          user_id?: string;
          withdrawn_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'health_consents_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'health_consents_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      plan_features: {
        Row: {
          feature_key: string;
          plan: string;
        };
        ComputedFields: never;
        Insert: {
          feature_key: string;
          plan: string;
        };
        Update: {
          feature_key?: string;
          plan?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_features_feature_key_fkey';
            columns: ['feature_key'];
            isOneToOne: false;
            referencedRelation: 'features';
            referencedColumns: ['key'];
          },
          {
            foreignKeyName: 'plan_features_feature_key_fkey';
            columns: ['feature_key'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['feature_key'];
          },
          {
            foreignKeyName: 'plan_features_plan_fkey';
            columns: ['plan'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['key'];
          },
        ];
      };
      plans: {
        Row: {
          key: string;
          max_clients: number | null;
          name: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          max_clients?: number | null;
          name: string;
          sort_order?: number;
        };
        Update: {
          key?: string;
          max_clients?: number | null;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          default_rest_seconds: number;
          display_name: string;
          locale: string;
          rest_autostart: boolean;
          rest_sound: boolean;
          rest_vibration: boolean;
          same_button: string;
          terms_accepted_at: string | null;
          terms_version: string | null;
          user_id: string;
          weight_unit: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          default_rest_seconds?: number;
          display_name?: string;
          locale?: string;
          rest_autostart?: boolean;
          rest_sound?: boolean;
          rest_vibration?: boolean;
          same_button?: string;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          user_id: string;
          weight_unit?: string;
        };
        Update: {
          created_at?: string;
          default_rest_seconds?: number;
          display_name?: string;
          locale?: string;
          rest_autostart?: boolean;
          rest_sound?: boolean;
          rest_vibration?: boolean;
          same_button?: string;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          user_id?: string;
          weight_unit?: string;
        };
        Relationships: [];
      };
      program_blocks: {
        Row: {
          cycle_days: number;
          id: string;
          laps: number | null;
          name: string | null;
          position: number;
          program_id: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          cycle_days: number;
          id?: string;
          laps?: number | null;
          name?: string | null;
          position: number;
          program_id: string;
          tenant_id: string;
        };
        Update: {
          cycle_days?: number;
          id?: string;
          laps?: number | null;
          name?: string | null;
          position?: number;
          program_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_blocks_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'program_blocks_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_blocks_tenant_id_program_id_fkey';
            columns: ['tenant_id', 'program_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['tenant_id', 'id'];
          },
        ];
      };
      program_day_exercises: {
        Row: {
          day_id: string;
          exercise_id: string;
          id: string;
          note: string | null;
          position: number;
          program_id: string;
          rest_seconds: number | null;
          superset_group: number | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          day_id: string;
          exercise_id: string;
          id?: string;
          note?: string | null;
          position: number;
          program_id: string;
          rest_seconds?: number | null;
          superset_group?: number | null;
          tenant_id: string;
        };
        Update: {
          day_id?: string;
          exercise_id?: string;
          id?: string;
          note?: string | null;
          position?: number;
          program_id?: string;
          rest_seconds?: number | null;
          superset_group?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_day_exercises_tenant_id_exercise_id_fkey';
            columns: ['tenant_id', 'exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['tenant_id', 'id'];
          },
          {
            foreignKeyName: 'program_day_exercises_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'program_day_exercises_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_day_exercises_tenant_id_program_id_day_id_fkey';
            columns: ['tenant_id', 'program_id', 'day_id'];
            isOneToOne: false;
            referencedRelation: 'program_days';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
        ];
      };
      program_days: {
        Row: {
          block_id: string;
          day_number: number;
          id: string;
          kind: string;
          name: string | null;
          place: string | null;
          program_id: string;
          subtitle: string | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          block_id: string;
          day_number: number;
          id?: string;
          kind: string;
          name?: string | null;
          place?: string | null;
          program_id: string;
          subtitle?: string | null;
          tenant_id: string;
        };
        Update: {
          block_id?: string;
          day_number?: number;
          id?: string;
          kind?: string;
          name?: string | null;
          place?: string | null;
          program_id?: string;
          subtitle?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_days_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'program_days_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_days_tenant_id_program_id_block_id_fkey';
            columns: ['tenant_id', 'program_id', 'block_id'];
            isOneToOne: false;
            referencedRelation: 'program_blocks';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
        ];
      };
      program_missed_day_rules: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          program_id: string;
          rule: string;
          starts_on: string;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          program_id: string;
          rule: string;
          starts_on: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          program_id?: string;
          rule?: string;
          starts_on?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_missed_day_rules_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'program_missed_day_rules_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_missed_day_rules_tenant_id_program_id_fkey';
            columns: ['tenant_id', 'program_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['tenant_id', 'id'];
          },
        ];
      };
      program_missed_days: {
        Row: {
          block_id: string | null;
          created_at: string;
          day_number: number;
          id: string;
          missed_on: string;
          program_day_id: string | null;
          program_id: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          block_id?: string | null;
          created_at?: string;
          day_number: number;
          id?: string;
          missed_on: string;
          program_day_id?: string | null;
          program_id: string;
          tenant_id: string;
        };
        Update: {
          block_id?: string | null;
          created_at?: string;
          day_number?: number;
          id?: string;
          missed_on?: string;
          program_day_id?: string | null;
          program_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_missed_days_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'program_missed_days_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_missed_days_tenant_id_program_id_block_id_fkey';
            columns: ['tenant_id', 'program_id', 'block_id'];
            isOneToOne: false;
            referencedRelation: 'program_blocks';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
          {
            foreignKeyName: 'program_missed_days_tenant_id_program_id_fkey';
            columns: ['tenant_id', 'program_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['tenant_id', 'id'];
          },
          {
            foreignKeyName: 'program_missed_days_tenant_id_program_id_program_day_id_fkey';
            columns: ['tenant_id', 'program_id', 'program_day_id'];
            isOneToOne: false;
            referencedRelation: 'program_days';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
        ];
      };
      program_sets: {
        Row: {
          day_exercise_id: string;
          distance_meters: number | null;
          duration_seconds: number | null;
          id: string;
          intensity_type: string | null;
          intensity_value: number | null;
          position: number;
          program_id: string;
          reps_max: number | null;
          reps_min: number | null;
          target_load_kg: number | null;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          day_exercise_id: string;
          distance_meters?: number | null;
          duration_seconds?: number | null;
          id?: string;
          intensity_type?: string | null;
          intensity_value?: number | null;
          position: number;
          program_id: string;
          reps_max?: number | null;
          reps_min?: number | null;
          target_load_kg?: number | null;
          tenant_id: string;
        };
        Update: {
          day_exercise_id?: string;
          distance_meters?: number | null;
          duration_seconds?: number | null;
          id?: string;
          intensity_type?: string | null;
          intensity_value?: number | null;
          position?: number;
          program_id?: string;
          reps_max?: number | null;
          reps_min?: number | null;
          target_load_kg?: number | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_sets_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'program_sets_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_sets_tenant_id_program_id_day_exercise_id_fkey';
            columns: ['tenant_id', 'program_id', 'day_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'program_day_exercises';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
        ];
      };
      programs: {
        Row: {
          archived_at: string | null;
          client_id: string | null;
          created_at: string;
          created_by: string | null;
          ended_at: string | null;
          id: string;
          mode: string;
          name: string;
          source_program_id: string | null;
          start_block_id: string | null;
          starts_on: string | null;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          ended_at?: string | null;
          id?: string;
          mode?: string;
          name: string;
          source_program_id?: string | null;
          start_block_id?: string | null;
          starts_on?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          client_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          ended_at?: string | null;
          id?: string;
          mode?: string;
          name?: string;
          source_program_id?: string | null;
          start_block_id?: string | null;
          starts_on?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'programs_start_block_fkey';
            columns: ['tenant_id', 'id', 'start_block_id'];
            isOneToOne: false;
            referencedRelation: 'program_blocks';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
          {
            foreignKeyName: 'programs_tenant_id_client_id_fkey';
            columns: ['tenant_id', 'client_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_members';
            referencedColumns: ['tenant_id', 'user_id'];
          },
          {
            foreignKeyName: 'programs_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'programs_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_features: {
        Row: {
          config: NonNullable<Json>;
          enabled: boolean;
          expires_at: string | null;
          feature_key: string;
          source: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          config?: NonNullable<Json>;
          enabled: boolean;
          expires_at?: string | null;
          feature_key: string;
          source?: string;
          tenant_id: string;
        };
        Update: {
          config?: NonNullable<Json>;
          enabled?: boolean;
          expires_at?: string | null;
          feature_key?: string;
          source?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_features_feature_key_fkey';
            columns: ['feature_key'];
            isOneToOne: false;
            referencedRelation: 'features';
            referencedColumns: ['key'];
          },
          {
            foreignKeyName: 'tenant_features_feature_key_fkey';
            columns: ['feature_key'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['feature_key'];
          },
          {
            foreignKeyName: 'tenant_features_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'tenant_features_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_invites: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          is_active: boolean;
          tenant_id: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          is_active?: boolean;
          tenant_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          is_active?: boolean;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_invites_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'tenant_invites_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenant_members: {
        Row: {
          created_at: string;
          role: string;
          status: string;
          tenant_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          role: string;
          status?: string;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: string;
          status?: string;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenant_members_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'tenant_members_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
        ];
      };
      tenants: {
        Row: {
          branding: NonNullable<Json>;
          config_version: number;
          created_at: string;
          id: string;
          name: string;
          plan: string;
          settings: NonNullable<Json>;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          branding?: NonNullable<Json>;
          config_version?: number;
          created_at?: string;
          id?: string;
          name: string;
          plan?: string;
          settings?: NonNullable<Json>;
          status?: string;
        };
        Update: {
          branding?: NonNullable<Json>;
          config_version?: number;
          created_at?: string;
          id?: string;
          name?: string;
          plan?: string;
          settings?: NonNullable<Json>;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tenants_plan_fkey';
            columns: ['plan'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['key'];
          },
        ];
      };
      workout_exercises: {
        Row: {
          changed_at: string;
          coach_note: string | null;
          day_note: string | null;
          exercise_id: string;
          id: string;
          is_skipped: boolean;
          position: number;
          prescribed_rest_seconds: number | null;
          prescribed_sets: NonNullable<Json>;
          program_day_exercise_id: string | null;
          replaces_exercise_id: string | null;
          superset_group: number | null;
          tenant_id: string;
          workout_id: string;
        };
        ComputedFields: never;
        Insert: {
          changed_at: string;
          coach_note?: string | null;
          day_note?: string | null;
          exercise_id: string;
          id: string;
          is_skipped?: boolean;
          position: number;
          prescribed_rest_seconds?: number | null;
          prescribed_sets?: NonNullable<Json>;
          program_day_exercise_id?: string | null;
          replaces_exercise_id?: string | null;
          superset_group?: number | null;
          tenant_id: string;
          workout_id: string;
        };
        Update: {
          changed_at?: string;
          coach_note?: string | null;
          day_note?: string | null;
          exercise_id?: string;
          id?: string;
          is_skipped?: boolean;
          position?: number;
          prescribed_rest_seconds?: number | null;
          prescribed_sets?: NonNullable<Json>;
          program_day_exercise_id?: string | null;
          replaces_exercise_id?: string | null;
          superset_group?: number | null;
          tenant_id?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_tenant_id_exercise_id_fkey';
            columns: ['tenant_id', 'exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['tenant_id', 'id'];
          },
          {
            foreignKeyName: 'workout_exercises_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'workout_exercises_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_tenant_id_program_day_exercise_id_fkey';
            columns: ['tenant_id', 'program_day_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'program_day_exercises';
            referencedColumns: ['tenant_id', 'id'];
          },
          {
            foreignKeyName: 'workout_exercises_tenant_id_replaces_exercise_id_fkey';
            columns: ['tenant_id', 'replaces_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['tenant_id', 'id'];
          },
          {
            foreignKeyName: 'workout_exercises_tenant_id_workout_id_fkey';
            columns: ['tenant_id', 'workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['tenant_id', 'id'];
          },
        ];
      };
      workout_sets: {
        Row: {
          distance_meters: number | null;
          duration_seconds: number | null;
          id: string;
          intensity_type: string | null;
          intensity_value: number | null;
          is_done: boolean;
          is_extra: boolean;
          recorded_at: string;
          reps: number | null;
          set_number: number;
          side: string;
          tenant_id: string;
          weight_kg: number | null;
          workout_exercise_id: string;
          workout_id: string;
        };
        ComputedFields: never;
        Insert: {
          distance_meters?: number | null;
          duration_seconds?: number | null;
          id: string;
          intensity_type?: string | null;
          intensity_value?: number | null;
          is_done?: boolean;
          is_extra?: boolean;
          recorded_at: string;
          reps?: number | null;
          set_number: number;
          side?: string;
          tenant_id: string;
          weight_kg?: number | null;
          workout_exercise_id: string;
          workout_id: string;
        };
        Update: {
          distance_meters?: number | null;
          duration_seconds?: number | null;
          id?: string;
          intensity_type?: string | null;
          intensity_value?: number | null;
          is_done?: boolean;
          is_extra?: boolean;
          recorded_at?: string;
          reps?: number | null;
          set_number?: number;
          side?: string;
          tenant_id?: string;
          weight_kg?: number | null;
          workout_exercise_id?: string;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_sets_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'workout_sets_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_sets_tenant_id_workout_id_workout_exercise_id_fkey';
            columns: ['tenant_id', 'workout_id', 'workout_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'workout_exercises';
            referencedColumns: ['tenant_id', 'workout_id', 'id'];
          },
        ];
      };
      workouts: {
        Row: {
          block_id: string | null;
          client_id: string;
          close_reason: string | null;
          closed_at: string | null;
          created_at: string;
          day_number: number;
          device_since: string | null;
          edited_at: string | null;
          id: string;
          last_changed_at: string;
          open_device_id: string | null;
          performed_on: string;
          program_day_id: string | null;
          program_id: string | null;
          started_at: string;
          tenant_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          block_id?: string | null;
          client_id: string;
          close_reason?: string | null;
          closed_at?: string | null;
          created_at?: string;
          day_number: number;
          device_since?: string | null;
          edited_at?: string | null;
          id: string;
          last_changed_at: string;
          open_device_id?: string | null;
          performed_on: string;
          program_day_id?: string | null;
          program_id?: string | null;
          started_at: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          block_id?: string | null;
          client_id?: string;
          close_reason?: string | null;
          closed_at?: string | null;
          created_at?: string;
          day_number?: number;
          device_since?: string | null;
          edited_at?: string | null;
          id?: string;
          last_changed_at?: string;
          open_device_id?: string | null;
          performed_on?: string;
          program_day_id?: string | null;
          program_id?: string | null;
          started_at?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_tenant_id_client_id_fkey';
            columns: ['tenant_id', 'client_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_members';
            referencedColumns: ['tenant_id', 'user_id'];
          },
          {
            foreignKeyName: 'workouts_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenant_effective_features';
            referencedColumns: ['tenant_id'];
          },
          {
            foreignKeyName: 'workouts_tenant_id_fkey';
            columns: ['tenant_id'];
            isOneToOne: false;
            referencedRelation: 'tenants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workouts_tenant_id_program_id_block_id_fkey';
            columns: ['tenant_id', 'program_id', 'block_id'];
            isOneToOne: false;
            referencedRelation: 'program_blocks';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
          {
            foreignKeyName: 'workouts_tenant_id_program_id_fkey';
            columns: ['tenant_id', 'program_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['tenant_id', 'id'];
          },
          {
            foreignKeyName: 'workouts_tenant_id_program_id_program_day_id_fkey';
            columns: ['tenant_id', 'program_id', 'program_day_id'];
            isOneToOne: false;
            referencedRelation: 'program_days';
            referencedColumns: ['tenant_id', 'program_id', 'id'];
          },
        ];
      };
    };
    Views: {
      tenant_effective_features: {
        Row: {
          config: Json | null;
          enabled: boolean | null;
          feature_key: string;
          tenant_id: string;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      accept_terms: { Args: { p_version: string }; Returns: undefined };
      achievements_enabled: { Args: { p_tenant: string }; Returns: boolean };
      archive_client: { Args: { p_tenant: string; p_user: string }; Returns: undefined };
      assign_program: {
        Args: {
          p_clients: string[];
          p_mode: string;
          p_starts_on: string;
          p_template: string;
          p_tenant: string;
          p_today: string;
        };
        Returns: Json;
      };
      can_manage_logo: { Args: { p_object_name: string }; Returns: boolean };
      cancel_next_program: {
        Args: { p_program: string; p_tenant: string; p_today: string };
        Returns: undefined;
      };
      copy_exercise_library_to_all_tenants: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_client_program: {
        Args: {
          p_client: string;
          p_cycle_days: number;
          p_mode: string;
          p_name: string;
          p_starts_on: string;
          p_tenant: string;
          p_today: string;
        };
        Returns: string;
      };
      create_tenant: { Args: { p_coach_terms_version: string; p_name: string }; Returns: string };
      discard_workout: { Args: { p_tenant: string; p_workout: string }; Returns: undefined };
      email_status: { Args: { p_email: string }; Returns: string };
      end_program: {
        Args: { p_program: string; p_tenant: string; p_today: string };
        Returns: undefined;
      };
      generate_invite_code: { Args: Record<PropertyKey, never>; Returns: string };
      grant_health_consent: {
        Args: { p_tenant: string; p_text_version: string };
        Returns: undefined;
      };
      has_health_consent: { Args: { p_tenant: string; p_user: string }; Returns: boolean };
      is_exercise_in_my_programs: {
        Args: { p_exercise: string; p_tenant: string };
        Returns: boolean;
      };
      is_member: { Args: { p_roles?: string[]; p_tenant: string }; Returns: boolean };
      is_program_client: { Args: { p_program: string; p_tenant: string }; Returns: boolean };
      is_workout_client: { Args: { p_tenant: string; p_workout: string }; Returns: boolean };
      join_tenant_with_code: { Args: { p_code: string }; Returns: Json };
      my_spaces: {
        Args: Record<PropertyKey, never>;
        Returns: {
          branding: Json;
          joined_at: string;
          role: string;
          status: string;
          tenant_id: string;
          tenant_name: string;
        }[];
      };
      preview_invite: { Args: { p_code: string }; Returns: Json };
      reactivate_client: { Args: { p_tenant: string; p_user: string }; Returns: undefined };
      record_missed_days: {
        Args: { p_days: Json; p_program: string; p_tenant: string; p_today: string };
        Returns: undefined;
      };
      regenerate_invite_code: { Args: { p_tenant: string }; Returns: string };
      remove_logo: { Args: { p_tenant: string }; Returns: undefined };
      restart_program: {
        Args: {
          p_block: string;
          p_program: string;
          p_starts_on: string;
          p_tenant: string;
          p_today: string;
        };
        Returns: undefined;
      };
      save_program: { Args: { p_program: Json; p_tenant: string }; Returns: Json };
      save_program_as_template: {
        Args: { p_name: string; p_program: string; p_tenant: string };
        Returns: string;
      };
      set_logo: { Args: { p_path: string; p_tenant: string }; Returns: undefined };
      set_missed_day_rule: {
        Args: { p_program: string; p_rule: string; p_tenant: string; p_today: string };
        Returns: undefined;
      };
      set_program_archived: {
        Args: { p_archived: boolean; p_program: string; p_tenant: string };
        Returns: undefined;
      };
      sync_workout: { Args: { p_tenant: string; p_workout: Json }; Returns: undefined };
      update_brand: {
        Args: {
          p_accent: string;
          p_mode: string;
          p_name: string;
          p_primary: string;
          p_tenant: string;
        };
        Returns: undefined;
      };
      withdraw_health_consent: { Args: { p_tenant: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
