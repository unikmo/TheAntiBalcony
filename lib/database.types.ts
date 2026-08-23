export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type RingTier = "free" | "snapshot" | "video" | "takeover" | "vip";
type PaidTier = Exclude<RingTier, "free">;

export type Database = {
  public: {
    Tables: {
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
