export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

import type { PopRequestRow, PopCardRow } from "./pop-types";

type RingTier = "free" | "snapshot" | "video" | "takeover" | "vip";
type PaidTier = Exclude<RingTier, "free">;

export type Database = {
  public: {
    Tables: {
      anti_balcony_pop_requests: {
        Row: PopRequestRow;
        Insert: Omit<PopRequestRow, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<PopRequestRow>;
        Relationships: [];
      };
      anti_balcony_pop_cards: {
        Row: PopCardRow;
        Insert: Omit<PopCardRow, "created_at"> & { created_at?: string };
        Update: Partial<PopCardRow>;
        Relationships: [];
      };
      anti_balcony_rings: {
        Row: {
          id: string;
          slug: string;
          startup_name: string;
          website: string | null;
          tagline: string | null;
          category: string | null;
          what_it_does: string | null;
          intended_customer: string | null;
          founder: string | null;
          problem: string | null;
          story: string | null;
          image_url: string | null;
          social_url: string | null;
          tier: RingTier;
          status: string;
          indexable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          startup_name: string;
          website?: string | null;
          tagline?: string | null;
          category?: string | null;
          what_it_does?: string | null;
          intended_customer?: string | null;
          founder?: string | null;
          problem?: string | null;
          story?: string | null;
          image_url?: string | null;
          social_url?: string | null;
          tier?: RingTier;
          status?: string;
          indexable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          startup_name?: string;
          website?: string | null;
          tagline?: string | null;
          category?: string | null;
          what_it_does?: string | null;
          intended_customer?: string | null;
          founder?: string | null;
          problem?: string | null;
          story?: string | null;
          image_url?: string | null;
          social_url?: string | null;
          tier?: RingTier;
          status?: string;
          indexable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      anti_balcony_fulfillment_events: {
        Row: {
          event_id: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      anti_balcony_fulfillment_jobs: {
        Row: {
          stripe_session_id: string;
          event_id: string | null;
          ring_id: string | null;
          startup_name: string;
          email: string;
          allow_social: boolean;
          provider_ref: string | null;
          scheduled_at: string | null;
          tier: PaidTier;
          operations: Json;
          operations_clearance: string;
          status: string;
          proof_url: string | null;
          video_url: string | null;
          live_stream_url: string | null;
          behind_scenes_url: string | null;
          press_kit_url: string | null;
          pr_distribution_url: string | null;
          permit_ref: string | null;
          insurance_ref: string | null;
          talent_release_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          stripe_session_id: string;
          event_id?: string | null;
          ring_id?: string | null;
          startup_name: string;
          email: string;
          allow_social?: boolean;
          provider_ref?: string | null;
          scheduled_at?: string | null;
          tier: PaidTier;
          operations?: Json;
          operations_clearance?: string;
          status: string;
          proof_url?: string | null;
          video_url?: string | null;
          live_stream_url?: string | null;
          behind_scenes_url?: string | null;
          press_kit_url?: string | null;
          pr_distribution_url?: string | null;
          permit_ref?: string | null;
          insurance_ref?: string | null;
          talent_release_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_session_id?: string;
          event_id?: string | null;
          ring_id?: string | null;
          startup_name?: string;
          email?: string;
          allow_social?: boolean;
          provider_ref?: string | null;
          scheduled_at?: string | null;
          tier?: PaidTier;
          operations?: Json;
          operations_clearance?: string;
          status?: string;
          proof_url?: string | null;
          video_url?: string | null;
          live_stream_url?: string | null;
          behind_scenes_url?: string | null;
          press_kit_url?: string | null;
          pr_distribution_url?: string | null;
          permit_ref?: string | null;
          insurance_ref?: string | null;
          talent_release_ref?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "anti_balcony_fulfillment_jobs_ring_id_fkey";
            columns: ["ring_id"];
            isOneToOne: false;
            referencedRelation: "anti_balcony_rings";
            referencedColumns: ["id"];
          },
        ];
      };
      anti_balcony_orders: {
        Row: {
          id: string;
          order_ref: string;
          access_token_hash: string;
          ring_id: string;
          startup_name: string;
          email: string;
          tier: PaidTier;
          board: "nasdaq_tower";
          master_format: "9:16";
          timezone: string;
          requested_window_start: string;
          requested_window_end: string;
          alternative_window_start: string | null;
          alternative_window_end: string | null;
          allow_social: boolean;
          rights_accepted_at: string;
          qr_policy_accepted_at: string;
          capture_consent_at: string;
          terms_accepted_at: string;
          privacy_acknowledged_at: string;
          status: string;
          payment_status: string;
          creative_path: string | null;
          creative_filename: string | null;
          creative_content_type: string | null;
          creative_size_bytes: number | null;
          creative_width: number;
          creative_height: number;
          creative_duration_seconds: number | null;
          creative_received_at: string | null;
          creative_review_notes: string | null;
          provider_name: string;
          provider_campaign_id: string | null;
          provider_ref: string | null;
          provider_moderation_status: string | null;
          provider_proof_of_play_ref: string | null;
          scheduled_window_start: string | null;
          scheduled_window_end: string | null;
          played_at: string | null;
          capture_provider: string | null;
          capture_job_id: string | null;
          capture_path: string | null;
          capture_started_at: string | null;
          capture_completed_at: string | null;
          render_provider: string | null;
          render_job_id: string | null;
          render_callback_token_hash: string | null;
          render_error: string | null;
          deliverable_video_path: string | null;
          deliverable_image_path: string | null;
          delivery_email_id: string | null;
          delivered_at: string | null;
          failure_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          order_ref: string;
          access_token_hash: string;
          ring_id: string;
          startup_name: string;
          email: string;
          tier: PaidTier;
          board?: "nasdaq_tower";
          master_format?: "9:16";
          timezone: string;
          requested_window_start: string;
          requested_window_end: string;
          alternative_window_start?: string | null;
          alternative_window_end?: string | null;
          allow_social?: boolean;
          rights_accepted_at: string;
          qr_policy_accepted_at: string;
          capture_consent_at: string;
          terms_accepted_at: string;
          privacy_acknowledged_at: string;
          status?: string;
          payment_status?: string;
          creative_path?: string | null;
          creative_filename?: string | null;
          creative_content_type?: string | null;
          creative_size_bytes?: number | null;
          creative_width: number;
          creative_height: number;
          creative_duration_seconds?: number | null;
          creative_received_at?: string | null;
          creative_review_notes?: string | null;
          provider_name?: string;
          provider_campaign_id?: string | null;
          provider_ref?: string | null;
          provider_moderation_status?: string | null;
          provider_proof_of_play_ref?: string | null;
          scheduled_window_start?: string | null;
          scheduled_window_end?: string | null;
          played_at?: string | null;
          capture_provider?: string | null;
          capture_job_id?: string | null;
          capture_path?: string | null;
          capture_started_at?: string | null;
          capture_completed_at?: string | null;
          render_provider?: string | null;
          render_job_id?: string | null;
          render_callback_token_hash?: string | null;
          render_error?: string | null;
          deliverable_video_path?: string | null;
          deliverable_image_path?: string | null;
          delivery_email_id?: string | null;
          delivered_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["anti_balcony_orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "anti_balcony_orders_ring_id_fkey";
            columns: ["ring_id"];
            isOneToOne: false;
            referencedRelation: "anti_balcony_rings";
            referencedColumns: ["id"];
          },
        ];
      };
      anti_balcony_order_events: {
        Row: {
          id: string;
          order_id: string;
          event_type: string;
          status: string | null;
          source: "customer" | "system" | "operations" | "blindspot" | "capture" | "shotstack" | "email";
          idempotency_key: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          order_id: string;
          event_type: string;
          status?: string | null;
          source: "customer" | "system" | "operations" | "blindspot" | "capture" | "shotstack" | "email";
          idempotency_key?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["anti_balcony_order_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "anti_balcony_order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "anti_balcony_orders";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
