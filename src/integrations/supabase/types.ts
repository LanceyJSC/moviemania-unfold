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
      club_memberships: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "movie_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      community_list_items: {
        Row: {
          added_at: string
          id: string
          list_id: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
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
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_collaborative?: boolean | null
          is_public?: boolean | null
          title?: string
          user_id?: string
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
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          thread_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          thread_id?: string
          user_id?: string | null
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
          club_id: string
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          movie_id: number | null
          movie_poster: string | null
          movie_title: string | null
          title: string
        }
        Insert: {
          club_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          title: string
        }
        Update: {
          club_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_threads_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "movie_clubs"
            referencedColumns: ["id"]
          },
        ]
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
      friend_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          friend_id: string
          id: string
          movie_id: number | null
          movie_poster: string | null
          movie_title: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          friend_id: string
          id?: string
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          friend_id?: string
          id?: string
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      friend_reactions: {
        Row: {
          activity_id: string
          comment: string | null
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          activity_id: string
          comment?: string | null
          created_at?: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_reactions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "friend_activities"
            referencedColumns: ["id"]
          },
        ]
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
          created_by: string | null
          description: string | null
          genre: string | null
          id: string
          is_public: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          is_public?: boolean
          name?: string
        }
        Relationships: []
      }
      movie_night_poll_options: {
        Row: {
          added_by: string
          created_at: string
          id: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          poll_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          poll_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_night_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "movie_night_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_night_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_night_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "movie_night_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_night_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "movie_night_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_night_polls: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string
          id: string
          scheduled_at: string | null
          status: string
          title: string
          winner_movie_id: number | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          scheduled_at?: string | null
          status?: string
          title: string
          winner_movie_id?: number | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          scheduled_at?: string | null
          status?: string
          title?: string
          winner_movie_id?: number | null
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
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
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
      shared_watchlist_items: {
        Row: {
          added_at: string
          added_by: string
          id: string
          movie_id: number
          movie_poster: string | null
          movie_title: string
          votes: number | null
          watchlist_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          movie_id: number
          movie_poster?: string | null
          movie_title: string
          votes?: number | null
          watchlist_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          movie_id?: number
          movie_poster?: string | null
          movie_title?: string
          votes?: number | null
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_watchlist_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "shared_watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_watchlist_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          user_id: string
          watchlist_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          user_id: string
          watchlist_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_watchlist_members_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "shared_watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_watchlists: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          created_at: string
          follower_id: string | null
          following_id: string | null
          friend_id: string | null
          id: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          follower_id?: string | null
          following_id?: string | null
          friend_id?: string | null
          id?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          follower_id?: string | null
          following_id?: string | null
          friend_id?: string | null
          id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      taste_compatibility: {
        Row: {
          common_movies: number | null
          compatibility_score: number | null
          friend_id: string
          id: string
          last_calculated: string
          shared_genres: string[] | null
          user_id: string
        }
        Insert: {
          common_movies?: number | null
          compatibility_score?: number | null
          friend_id: string
          id?: string
          last_calculated?: string
          shared_genres?: string[] | null
          user_id: string
        }
        Update: {
          common_movies?: number | null
          compatibility_score?: number | null
          friend_id?: string
          id?: string
          last_calculated?: string
          shared_genres?: string[] | null
          user_id?: string
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
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          movie_id: number | null
          movie_poster: string | null
          movie_title: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          movie_id?: number | null
          movie_poster?: string | null
          movie_title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_count: number | null
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_count?: number | null
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_count?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
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
      watch_parties: {
        Row: {
          created_at: string
          host_id: string
          id: string
          max_participants: number | null
          movie_title: string
          party_name: string
          scheduled_at: string
          status: string
        }
        Insert: {
          created_at?: string
          host_id: string
          id?: string
          max_participants?: number | null
          movie_title: string
          party_name: string
          scheduled_at: string
          status?: string
        }
        Update: {
          created_at?: string
          host_id?: string
          id?: string
          max_participants?: number | null
          movie_title?: string
          party_name?: string
          scheduled_at?: string
          status?: string
        }
        Relationships: []
      }
      watch_party_participants: {
        Row: {
          id: string
          joined_at: string
          party_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          party_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          party_id?: string
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
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string | null
          ends_at: string
          id: string
          starts_at: string
          target_count: number | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          starts_at: string
          target_count?: number | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          starts_at?: string
          target_count?: number | null
          title?: string
          xp_reward?: number | null
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
