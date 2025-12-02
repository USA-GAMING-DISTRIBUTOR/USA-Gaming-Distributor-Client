export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
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
      customer_issues: {
        Row: {
          created_at: string | null;
          created_by: string;
          customer_id: string;
          id: string;
          issue_text: string;
          status: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          customer_id: string;
          id?: string;
          issue_text: string;
          status?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          customer_id?: string;
          id?: string;
          issue_text?: string;
          status?: string | null;
        };
        Relationships: [];
      };
      customer_platform_usernames: {
        Row: {
          created_at: string | null;
          customer_id: string;
          id: string;
          platform_id: string;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          id?: string;
          platform_id: string;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          id?: string;
          platform_id?: string;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_platform_usernames_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_platform_usernames_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'game_coins';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_pricing: {
        Row: {
          created_at: string | null;
          customer_id: string | null;
          id: string;
          is_default: boolean | null;
          max_quantity: number | null;
          min_quantity: number;
          platform_id: string | null;
          unit_price: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_id?: string | null;
          id?: string;
          is_default?: boolean | null;
          max_quantity?: number | null;
          min_quantity?: number;
          platform_id?: string | null;
          unit_price: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string | null;
          id?: string;
          is_default?: boolean | null;
          max_quantity?: number | null;
          min_quantity?: number;
          platform_id?: string | null;
          unit_price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_pricing_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_pricing_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'game_coins';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_usernames: {
        Row: {
          created_at: string | null;
          customer_id: string;
          id: string;
          is_active: boolean | null;
          notes: string | null;
          platform_id: string;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          platform_id: string;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          platform_id?: string;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_usernames_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_usernames_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'game_coins';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          contact_numbers: string[] | null;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          contact_numbers?: string[] | null;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          contact_numbers?: string[] | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      game_coins: {
        Row: {
          account_type: string;
          cost_price: number;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          inventory: number;
          low_stock_alert: number | null;
          is_visible_to_employee: boolean | null;
          platform: string;
          updated_at: string | null;
        };
        Insert: {
          account_type?: string;
          cost_price?: number;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          inventory?: number;
          low_stock_alert?: number | null;
          is_visible_to_employee?: boolean | null;
          platform: string;
          updated_at?: string | null;
        };
        Update: {
          account_type?: string;
          cost_price?: number;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          inventory?: number;
          low_stock_alert?: number | null;
          is_visible_to_employee?: boolean | null;
          platform?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      logs: {
        Row: {
          action: string;
          details: string | null;
          id: string;
          timestamp: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          details?: string | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          details?: string | null;
          id?: string;
          timestamp?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string | null;
          id: string;
          order_id: string | null;
          platform_id: string | null;
          quantity: number;
          total_price: number;
          unit_price: number;
          username: string | null;
          usernames: string[] | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          platform_id?: string | null;
          quantity: number;
          total_price: number;
          unit_price: number;
          username?: string | null;
          usernames?: string[] | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          platform_id?: string | null;
          quantity?: number;
          total_price?: number;
          unit_price?: number;
          username?: string | null;
          usernames?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'game_coins';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          created_at: string | null;
          created_by: string;
          customer_id: string | null;
          deleted_at: string | null;
          id: string;
          notes: string | null;
          order_number: string;
          payment_method: string | null;
          payment_status: string | null;
          status: string;
          total_amount: number;
          updated_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          customer_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          notes?: string | null;
          order_number: string;
          payment_method?: string | null;
          payment_status?: string | null;
          status?: string;
          total_amount?: number;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          customer_id?: string | null;
          deleted_at?: string | null;
          id?: string;
          notes?: string | null;
          order_number?: string;
          payment_method?: string | null;
          payment_status?: string | null;
          status?: string;
          total_amount?: number;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_verified_by_fkey';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_details: {
        Row: {
          amount: number;
          bank_amount_in_currency: number | null;
          bank_exchange_rate: number | null;
          bank_purpose: string | null;
          bank_sender_bank: string | null;
          bank_sender_name: string | null;
          bank_transaction_reference: string | null;
          bank_transaction_time: string | null;
          bank_transaction_type: string | null;
          cash_receipt_number: string | null;
          cash_received_by: string | null;
          created_at: string | null;
          crypto_currency: string | null;
          crypto_network: string | null;
          crypto_pay_id: string | null;
          crypto_transaction_hash: string | null;
          crypto_username: string | null;
          crypto_wallet_address: string | null;
          currency: string | null;
          id: string;
          notes: string | null;
          order_id: string | null;
          payment_data: Json | null;
          payment_method: string;
          transaction_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          bank_amount_in_currency?: number | null;
          bank_exchange_rate?: number | null;
          bank_purpose?: string | null;
          bank_sender_bank?: string | null;
          bank_sender_name?: string | null;
          bank_transaction_reference?: string | null;
          bank_transaction_time?: string | null;
          bank_transaction_type?: string | null;
          cash_receipt_number?: string | null;
          cash_received_by?: string | null;
          created_at?: string | null;
          crypto_currency?: string | null;
          crypto_network?: string | null;
          crypto_pay_id?: string | null;
          crypto_transaction_hash?: string | null;
          crypto_username?: string | null;
          crypto_wallet_address?: string | null;
          currency?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          payment_data?: Json | null;
          payment_method: string;
          transaction_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          bank_amount_in_currency?: number | null;
          bank_exchange_rate?: number | null;
          bank_purpose?: string | null;
          bank_sender_bank?: string | null;
          bank_sender_name?: string | null;
          bank_transaction_reference?: string | null;
          bank_transaction_time?: string | null;
          bank_transaction_type?: string | null;
          cash_receipt_number?: string | null;
          cash_received_by?: string | null;
          created_at?: string | null;
          crypto_currency?: string | null;
          crypto_network?: string | null;
          crypto_pay_id?: string | null;
          crypto_transaction_hash?: string | null;
          crypto_username?: string | null;
          crypto_wallet_address?: string | null;
          currency?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          payment_data?: Json | null;
          payment_method?: string;
          transaction_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_details_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_history: {
        Row: {
          cost_per_unit: number;
          created_at: string | null;
          id: string;
          new_inventory: number;
          notes: string | null;
          platform_id: string | null;
          previous_inventory: number;
          purchased_by: string | null;
          quantity: number;
          supplier: string | null;
          total_cost: number;
        };
        Insert: {
          cost_per_unit: number;
          created_at?: string | null;
          id?: string;
          new_inventory?: number;
          notes?: string | null;
          platform_id?: string | null;
          previous_inventory?: number;
          purchased_by?: string | null;
          quantity: number;
          supplier?: string | null;
          total_cost: number;
        };
        Update: {
          cost_per_unit?: number;
          created_at?: string | null;
          id?: string;
          new_inventory?: number;
          notes?: string | null;
          platform_id?: string | null;
          previous_inventory?: number;
          purchased_by?: string | null;
          quantity?: number;
          supplier?: string | null;
          total_cost?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_history_platform_id_fkey';
            columns: ['platform_id'];
            isOneToOne: false;
            referencedRelation: 'game_coins';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_history_purchased_by_fkey';
            columns: ['purchased_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      refunds_replacements: {
        Row: {
          amount: number | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          notes: string | null;
          order_id: string | null;
          processed_at: string | null;
          processed_by: string | null;
          reason: string;
          replacement_order_id: string | null;
          status: string;
          type: string;
        };
        Insert: {
          amount?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          reason: string;
          replacement_order_id?: string | null;
          status?: string;
          type: string;
        };
        Update: {
          amount?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          reason?: string;
          replacement_order_id?: string | null;
          status?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'refunds_replacements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_replacements_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_replacements_processed_by_fkey';
            columns: ['processed_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'refunds_replacements_replacement_order_id_fkey';
            columns: ['replacement_order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      usernames: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          password: string;
          role: string;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          password: string;
          role: string;
          username: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          password?: string;
          role?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_order: { Args: { order_id: string }; Returns: undefined };
      edit_order: {
        Args: { new_notes?: string; new_status?: string; order_id: string };
        Returns: undefined;
      };
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
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
