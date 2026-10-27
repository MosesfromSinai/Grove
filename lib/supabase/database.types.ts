
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "business_members": {
                  Row: {
                    "business_id": string,"email": string,"role": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"email": string,"role": string,"user_id"?: string | null
                  }
                  Update: {
                    "business_id"?: string,"email"?: string,"role"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_members_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "business_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "address": string,"campus_id": string,"hours": NonNullable<Json>,"id": string,"is_truck": boolean,"lat": number | null,"lng": number | null,"location": unknown,"logo_url": string | null,"name": string,"owner_id": string,"qr_slug": string,"redemption_mode": string,"staff_pin": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"campus_id": string,"hours"?: NonNullable<Json>,"id"?: string,"is_truck"?: boolean,"lat"?: never,"lng"?: never,"location": unknown,"logo_url"?: string | null,"name": string,"owner_id": string,"qr_slug": string,"redemption_mode"?: string,"staff_pin"?: string | null
                  }
                  Update: {
                    "address"?: string,"campus_id"?: string,"hours"?: NonNullable<Json>,"id"?: string,"is_truck"?: boolean,"lat"?: never,"lng"?: never,"location"?: unknown,"logo_url"?: string | null,"name"?: string,"owner_id"?: string,"qr_slug"?: string,"redemption_mode"?: string,"staff_pin"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "businesses_campus_id_fkey"
      columns: ["campus_id"]
isOneToOne: false
      referencedRelation: "campuses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "businesses_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"campuses": {
                  Row: {
                    "center": unknown,"email_domain": string,"id": string,"name": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "center": unknown,"email_domain": string,"id"?: string,"name": string,"timezone"?: string
                  }
                  Update: {
                    "center"?: unknown,"email_domain"?: string,"id"?: string,"name"?: string,"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"club_nights": {
                  Row: {
                    "business_id": string,"claimed_at": string | null,"claimed_by": string | null,"claimed_club_name": string | null,"created_at": string,"deal_id": string | null,"end_time": string,"giveback": string,"id": string,"night_date": string,"start_time": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"claimed_at"?: string | null,"claimed_by"?: string | null,"claimed_club_name"?: string | null,"created_at"?: string,"deal_id"?: string | null,"end_time": string,"giveback": string,"id"?: string,"night_date": string,"start_time": string
                  }
                  Update: {
                    "business_id"?: string,"claimed_at"?: string | null,"claimed_by"?: string | null,"claimed_club_name"?: string | null,"created_at"?: string,"deal_id"?: string | null,"end_time"?: string,"giveback"?: string,"id"?: string,"night_date"?: string,"start_time"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_nights_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_nights_claimed_by_fkey"
      columns: ["claimed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "club_nights_deal_id_fkey"
      columns: ["deal_id"]
isOneToOne: true
      referencedRelation: "deals"
      referencedColumns: ["id"]
    }
                  ]
                },"deals": {
                  Row: {
                    "active_days": (string)[] | null,"business_id": string,"created_at": string,"daily_end": string | null,"daily_start": string | null,"description": string,"discount_type": string | null,"discount_value": number | null,"ends_at": string | null,"id": string,"photo_url": string | null,"starts_at": string,"students_only": boolean,"title": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active_days"?: (string)[] | null,"business_id": string,"created_at"?: string,"daily_end"?: string | null,"daily_start"?: string | null,"description"?: string,"discount_type"?: string | null,"discount_value"?: number | null,"ends_at"?: string | null,"id"?: string,"photo_url"?: string | null,"starts_at": string,"students_only"?: boolean,"title": string,"visibility"?: string
                  }
                  Update: {
                    "active_days"?: (string)[] | null,"business_id"?: string,"created_at"?: string,"daily_end"?: string | null,"daily_start"?: string | null,"description"?: string,"discount_type"?: string | null,"discount_value"?: number | null,"ends_at"?: string | null,"id"?: string,"photo_url"?: string | null,"starts_at"?: string,"students_only"?: boolean,"title"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deals_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "campus_id": string | null,"created_at": string,"email": string,"full_name": string | null,"id": string,"role": string,"verified_student": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "campus_id"?: string | null,"created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"role"?: string,"verified_student"?: boolean
                  }
                  Update: {
                    "campus_id"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"role"?: string,"verified_student"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_campus_id_fkey"
      columns: ["campus_id"]
isOneToOne: false
      referencedRelation: "campuses"
      referencedColumns: ["id"]
    }
                  ]
                },"redemptions": {
                  Row: {
                    "business_id": string,"deal_id": string,"id": string,"method": string,"redeemed_at": string,"redeemed_on": string,"student_id": string,"student_location": unknown
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"deal_id": string,"id"?: string,"method": string,"redeemed_at"?: string,"redeemed_on": string,"student_id": string,"student_location"?: unknown
                  }
                  Update: {
                    "business_id"?: string,"deal_id"?: string,"id"?: string,"method"?: string,"redeemed_at"?: string,"redeemed_on"?: string,"student_id"?: string,"student_location"?: unknown
                  }
                  Relationships: [
                    {
      foreignKeyName: "redemptions_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redemptions_deal_id_business_id_fkey"
      columns: ["deal_id","business_id"]
isOneToOne: false
      referencedRelation: "deals"
      referencedColumns: ["id","business_id"]
    },{
      foreignKeyName: "redemptions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "deal_by_id":
{ Args: { "deal_id": string }; Returns: {
              "active_days": (string)[] | null,
"business_id": string,
"created_at": string,
"daily_end": string | null,
"daily_start": string | null,
"description": string,
"discount_type": string | null,
"discount_value": number | null,
"ends_at": string | null,
"id": string,
"photo_url": string | null,
"starts_at": string,
"students_only": boolean,
"title": string,
"visibility": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "deals"
        isOneToOne: false
        isSetofReturn: true
      } },
"deal_status":
{ Args: { "at_time"?: string,"d": Omit<Database["public"]['Tables']["deals"]['Row'], Database["public"]['Tables']["deals"]['ComputedFields']> }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
