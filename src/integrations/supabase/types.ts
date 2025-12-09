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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          movie_id: number | null
          movie_poster: string | null
          movie_title: string | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cinema_showtimes: {
        Row: {
          booking_url: string | null
          cinema_id: string
          created_at: string
          id: string
          movie_id: number | null
          movie_title: string
          scraped_at: string
          showtime: string
          ticket_price: string | null
        }
        Insert: {
          booking_url?: string | null
          cinema_id: string
          created_at?: string
          id?: string
          movie_id?: number | null
          movie_title: string
          scraped_at?: string
          showtime: string
          ticket_price?: string | null
        }
        Update: {
          booking_url?: string | null
          cinema_id?: string
          created_at?: string
          id?: string
          movie_id?: number | null
          movie_title?: string
          scraped_at?: string
          showtime?: string
          ticket_price?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cinema_showtimes_cinema_id_fkey"
            columns: ["cinema_id"]
            isOneToOne: false
            referencedRelation: "cinemas"
            referencedColumns: ["id"]
          },
        ]
      }
      cinemas: {
        Row: {
          address: string | null
          chain: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          chain?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          chain?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      enhanced_watchlist_items: {
        Row: {
          added_at: string
          collection_id: string | null
          id: string
          mood_tags: string[] | null
          movie_id: number
          movie_poster: string | null
          movie_title: string
          notes: string | null
          priority: string | null
          progress_percent: number | null
          user_id: string
          watched_at: string | null
        }
        Insert: {
          added_at?: string
          collection_id?: string | null
          id?: string
          mood_tags?: string[] | null
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          notes?: string | null
          priority?: string | null
          progress_percent?: number | null
          user_id: string
          watched_at?: string | null
        }
        Update: {
          added_at?: string
          collection_id?: string | null
          id?: string
          mood_tags?: string[] | null
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          notes?: string | null
          priority?: string | null
          progress_percent?: number | null
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_collection"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "watchlist_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          added_at: string | null
          id: string
          list_id: string | null
          movie_id: number
          movie_poster: string | null
          movie_title: string
          notes: string | null
          position: number | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          list_id?: string | null
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          notes?: string | null
          position?: number | null
        }
        Update: {
          added_at?: string | null
          id?: string
          list_id?: string | null
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          notes?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "user_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_likes: {
        Row: {
          created_at: string | null
          id: string
          list_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_likes_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "user_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_diary: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          movie_id: number
          movie_poster: string | null
          movie_title: string
          notes: string | null
          rating: number | null
          user_id: string
          watched_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          notes?: string | null
          rating?: number | null
          user_id: string
          watched_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          notes?: string | null
          rating?: number | null
          user_id?: string
          watched_date?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          movie_id: number
          movie_title: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: number
          movie_title: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: number
          movie_title?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      review_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          review_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "user_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_likes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_likes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "user_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_diary: {
        Row: {
          created_at: string
          episode_number: number | null
          id: string
          notes: string | null
          rating: number | null
          season_number: number | null
          tv_id: number
          tv_poster: string | null
          tv_title: string
          user_id: string
          watched_date: string
        }
        Insert: {
          created_at?: string
          episode_number?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          season_number?: number | null
          tv_id: number
          tv_poster?: string | null
          tv_title: string
          user_id: string
          watched_date?: string
        }
        Update: {
          created_at?: string
          episode_number?: number | null
          id?: string
          notes?: string | null
          rating?: number | null
          season_number?: number | null
          tv_id?: number
          tv_poster?: string | null
          tv_title?: string
          user_id?: string
          watched_date?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          location_city: string | null
          location_country: string | null
          location_latitude: number | null
          location_longitude: number | null
          notifications_enabled: boolean | null
          preferred_actors: string[] | null
          preferred_directors: string[] | null
          preferred_genres: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          notifications_enabled?: boolean | null
          preferred_actors?: string[] | null
          preferred_directors?: string[] | null
          preferred_genres?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          notifications_enabled?: boolean | null
          preferred_actors?: string[] | null
          preferred_directors?: string[] | null
          preferred_genres?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          created_at: string
          id: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          created_at: string
          id: string
          is_spoiler: boolean | null
          movie_id: number
          movie_poster: string | null
          movie_title: string
          rating: number | null
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_spoiler?: boolean | null
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          rating?: number | null
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_spoiler?: boolean | null
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          rating?: number | null
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          activity_streak: number | null
          average_rating: number | null
          created_at: string
          experience_points: number | null
          favorite_genres: string[] | null
          id: string
          last_activity_date: string | null
          level: number | null
          movies_watched: number | null
          reviews_written: number | null
          total_hours_watched: number | null
          total_movies_watched: number | null
          total_ratings: number | null
          total_watch_time: number | null
          updated_at: string
          user_id: string
          watching_streak: number | null
        }
        Insert: {
          activity_streak?: number | null
          average_rating?: number | null
          created_at?: string
          experience_points?: number | null
          favorite_genres?: string[] | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          movies_watched?: number | null
          reviews_written?: number | null
          total_hours_watched?: number | null
          total_movies_watched?: number | null
          total_ratings?: number | null
          total_watch_time?: number | null
          updated_at?: string
          user_id: string
          watching_streak?: number | null
        }
        Update: {
          activity_streak?: number | null
          average_rating?: number | null
          created_at?: string
          experience_points?: number | null
          favorite_genres?: string[] | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          movies_watched?: number | null
          reviews_written?: number | null
          total_hours_watched?: number | null
          total_movies_watched?: number | null
          total_ratings?: number | null
          total_watch_time?: number | null
          updated_at?: string
          user_id?: string
          watching_streak?: number | null
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          list_type: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_type?: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_type?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_friend_suggestions: {
        Args: { p_user_id?: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "member"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "member"],
    },
  },
} as const
