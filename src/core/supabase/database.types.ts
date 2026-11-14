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
          display_name: string;
          locale: string;
          terms_accepted_at: string | null;
          terms_version: string | null;
          user_id: string;
          weight_unit: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string;
          locale?: string;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          user_id: string;
          weight_unit?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          locale?: string;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          user_id?: string;
          weight_unit?: string;
        };
        Relationships: [];
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
      archive_client: { Args: { p_tenant: string; p_user: string }; Returns: undefined };
      create_tenant: { Args: { p_coach_terms_version: string; p_name: string }; Returns: string };
      email_status: { Args: { p_email: string }; Returns: string };
      generate_invite_code: { Args: Record<PropertyKey, never>; Returns: string };
      is_member: { Args: { p_roles?: string[]; p_tenant: string }; Returns: boolean };
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
      regenerate_invite_code: { Args: { p_tenant: string }; Returns: string };
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
