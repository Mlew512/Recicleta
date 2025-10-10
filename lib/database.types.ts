export interface Database {
  public: {
    Tables: {
      rentals: {
        Row: {
          id: string
          user_id: string
          bike_id: string
          start_date: string
          end_date: string | null
          rental_type: string
          user_type: 'adult' | 'child' | 'charity'
          deposit: number
          rental_fee: number
          total_cost: number | null
          damage_cost: number | null
          deposit_refund: number | null
          status: 'Activo' | 'Completado'
          created_at: string
          transaction_id: string
          bikes?: {
            id: string
            bike_id: string
            type: string
            status: string
            brand_model: string
            size: string
            condition: string
          }
          users?: {
            id: string
            name: string
            email: string
            dni: string
          }
        }
        Insert: Omit<Database['public']['Tables']['rentals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rentals']['Row']>
      }
      bikes: {
        Row: {
          id: string
          bike_id: string
          type: string
          status: string
          brand_model: string
          size: string
          condition: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          dni: string
        }
      }
    }
  }
}