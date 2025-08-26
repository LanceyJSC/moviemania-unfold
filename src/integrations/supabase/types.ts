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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cinema_showtimes: {
        Row: {
          booking_url: string | null
          cinema_id: string
          created_at: string
          id: string
          movie_id: number
          movie_title: string
          showtime: string
          ticket_price: number | null
        }
        Insert: {
          booking_url?: string | null
          cinema_id: string
          created_at?: string
          id?: string
          movie_id: number
          movie_title: string
          showtime: string
          ticket_price?: number | null
        }
        Update: {
          booking_url?: string | null
          cinema_id?: string
          created_at?: string
          id?: string
          movie_id?: number
          movie_title?: string
          showtime?: string
          ticket_price?: number | null
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
          address: string
          city: string
          country: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      club_memberships: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_list_items: {
        Row: {
          added_at: string
          added_by: string
          id: string
          list_id: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          movie_type: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          list_id: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          movie_type?: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          list_id?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          movie_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "community_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      community_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_collaborative: boolean | null
          is_public: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string | null
          movie_data: Json | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          movie_data?: Json | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          movie_data?: Json | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      discussion_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "discussion_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "discussion_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_threads: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          movie_id: number
          movie_title: string
          movie_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          movie_id: number
          movie_title: string
          movie_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          movie_id?: number
          movie_title?: string
          movie_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enhanced_watchlist_items: {
        Row: {
          added_at: string
          collection_id: string | null
          expected_watch_date: string | null
          id: string
          mood_tags: string[] | null
          movie_id: number
          movie_poster: string | null
          movie_title: string
          personal_notes: string | null
          priority: string | null
          progress_percent: number | null
          user_id: string
          watched_at: string | null
        }
        Insert: {
          added_at?: string
          collection_id?: string | null
          expected_watch_date?: string | null
          id?: string
          mood_tags?: string[] | null
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          personal_notes?: string | null
          priority?: string | null
          progress_percent?: number | null
          user_id: string
          watched_at?: string | null
        }
        Update: {
          added_at?: string
          collection_id?: string | null
          expected_watch_date?: string | null
          id?: string
          mood_tags?: string[] | null
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          personal_notes?: string | null
          priority?: string | null
          progress_percent?: number | null
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_watchlist_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "watchlist_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          friend_id: string
          id: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          friend_id: string
          id?: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          friend_id?: string
          id?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_suggestions: {
        Row: {
          created_at: string
          id: string
          score: number | null
          shared_data: Json | null
          suggested_user_id: string
          suggestion_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number | null
          shared_data?: Json | null
          suggested_user_id: string
          suggestion_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number | null
          shared_data?: Json | null
          suggested_user_id?: string
          suggestion_type?: string
          user_id?: string
        }
        Relationships: []
      }
      movie_clubs: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          genre: string
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          genre: string
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          genre?: string
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      movie_discussions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_spoiler: boolean | null
          movie_id: number
          movie_title: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_spoiler?: boolean | null
          movie_id: number
          movie_title: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_spoiler?: boolean | null
          movie_id?: number
          movie_title?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      movie_preferences: {
        Row: {
          created_at: string
          id: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          preference: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          preference: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          preference?: string
          user_id?: string
        }
        Relationships: []
      }
      movie_streaming_availability: {
        Row: {
          available_from: string | null
          available_until: string | null
          created_at: string
          id: string
          movie_id: number
          movie_title: string
          platform_id: string
          streaming_url: string | null
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          id?: string
          movie_id: number
          movie_title: string
          platform_id: string
          streaming_url?: string | null
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          created_at?: string
          id?: string
          movie_id?: number
          movie_title?: string
          platform_id?: string
          streaming_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_streaming_availability_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "streaming_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
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
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string
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
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: number
          movie_title: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: number
          movie_title?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_interactions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "user_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      streaming_platforms: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          movie_id: number
          movie_title: string
          movie_type: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          movie_id: number
          movie_title: string
          movie_type?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          movie_id?: number
          movie_title?: string
          movie_type?: string
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
          push_notifications: boolean | null
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
          push_notifications?: boolean | null
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
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          created_at: string
          helpful_count: number | null
          id: string
          is_spoiler: boolean | null
          movie_id: number
          movie_title: string
          movie_type: string
          rating: number | null
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_spoiler?: boolean | null
          movie_id: number
          movie_title: string
          movie_type?: string
          rating?: number | null
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_spoiler?: boolean | null
          movie_id?: number
          movie_title?: string
          movie_type?: string
          rating?: number | null
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          average_rating: number | null
          created_at: string
          experience_points: number | null
          favorite_genres: string[] | null
          id: string
          last_activity_date: string | null
          level: number | null
          total_hours_watched: number | null
          total_movies_watched: number | null
          total_ratings: number | null
          updated_at: string
          user_id: string
          watching_streak: number | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string
          experience_points?: number | null
          favorite_genres?: string[] | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          total_hours_watched?: number | null
          total_movies_watched?: number | null
          total_ratings?: number | null
          updated_at?: string
          user_id: string
          watching_streak?: number | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string
          experience_points?: number | null
          favorite_genres?: string[] | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          total_hours_watched?: number | null
          total_movies_watched?: number | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
          watching_streak?: number | null
        }
        Relationships: []
      }
      watch_parties: {
        Row: {
          created_at: string
          description: string | null
          host_id: string
          id: string
          is_public: boolean | null
          max_participants: number | null
          movie_id: number
          movie_title: string
          party_code: string | null
          party_name: string
          scheduled_at: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          host_id: string
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          movie_id: number
          movie_title: string
          party_code?: string | null
          party_name: string
          scheduled_at: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          host_id?: string
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          movie_id?: number
          movie_title?: string
          party_code?: string | null
          party_name?: string
          scheduled_at?: string
          status?: string | null
        }
        Relationships: []
      }
      watch_party_participants: {
        Row: {
          id: string
          joined_at: string
          party_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          party_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          party_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_party_participants_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "watch_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_progress: {
        Row: {
          completed: boolean | null
          episode_number: number | null
          id: string
          last_watched: string
          movie_id: number
          movie_title: string
          movie_type: string
          progress_percent: number | null
          season_number: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          episode_number?: number | null
          id?: string
          last_watched?: string
          movie_id: number
          movie_title: string
          movie_type?: string
          progress_percent?: number | null
          season_number?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          episode_number?: number | null
          id?: string
          last_watched?: string
          movie_id?: number
          movie_title?: string
          movie_type?: string
          progress_percent?: number | null
          season_number?: number | null
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string
          id: string
          list_type: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          list_type: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          user_id: string
        }
        Update: {
          added_at?: string
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
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_friend_rating_comparison: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: {
          friend_rating: number
          movie_id: number
          movie_title: string
          rating_difference: number
          user_rating: number
        }[]
      }
      get_friend_watchlist_comparison: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: {
          friend_list_type: string
          in_friend_watchlist: boolean
          in_user_watchlist: boolean
          movie_id: number
          movie_poster: string
          movie_title: string
          user_list_type: string
        }[]
      }
      get_mutual_friends: {
        Args: { p_user_id: string }
        Returns: {
          connection_date: string
          friend_avatar_url: string
          friend_id: string
          friend_username: string
        }[]
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
    Enums: {},
  },
} as const
