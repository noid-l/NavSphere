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
      categories: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          sort: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          sort?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          sort?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      links: {
        Row: {
          category_id: string
          created_at: string
          created_by: string
          description: string | null
          env: 'test' | 'prod'
          icon: string | null
          id: string
          is_public: boolean
          name: string
          sort: number
          updated_at: string
          url: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string
          description?: string | null
          env?: 'test' | 'prod'
          icon?: string | null
          id?: string
          is_public?: boolean
          name: string
          sort?: number
          updated_at?: string
          url: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          env?: 'test' | 'prod'
          icon?: string | null
          id?: string
          is_public?: boolean
          name?: string
          sort?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'links_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'links_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      link_environment: 'test' | 'prod'
    }
    CompositeTypes: Record<string, never>
  }
}
