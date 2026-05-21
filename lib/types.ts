export type Role = "parent" | "child";
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  timezone: string;
  family_id: string;
  is_super_admin: boolean;
  created_at: string;
}

export interface ChildInvitation {
  id: string;
  family_id: string;
  email: string;
  invited_by: string | null;
  role: Role;
  created_at: string;
  accepted_at: string | null;
}

export interface ChoreAssignment {
  chore_id: string;
  user_id: string;
  created_at: string;
  removed_at: string | null;
}

export interface Chore {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  points: number;
  recurrence: DayOfWeek[];
  is_active: boolean;
  deactivated_at: string | null;
  family_id: string;
  created_by: string | null;
  created_at: string;
  sort_order: number;
  // Verification (Phase 5a) — all optional, all combinable
  requires_parent_approval: boolean;
  requires_self_report: boolean;
  window_start_time: string | null;  // "HH:MM:SS" or null
  window_end_time: string | null;
}

export type CompletionStatus = "verified" | "pending" | "denied";

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  user_id: string;
  completed_date: string;
  is_exception: boolean;
  exception_reason: string | null;
  completed_at: string | null;
  points_earned: number | null;
  // Verification (Phase 5a)
  status: CompletionStatus;
  verified_by: string | null;
  verified_at: string | null;
  denial_reason: string | null;
  self_report_start_at: string | null;
  self_report_end_at: string | null;
  notes: string | null;
}

export interface DailyBonus {
  id: string;
  user_id: string;
  bonus_date: string;
  points_bonus: number;
  awarded_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  chore_id: string | null;
  current_streak: number;
  longest_streak: number;
  last_completed: string | null;
  updated_at: string;
}

export type BadgeType = "streak" | "milestone" | "special";

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  badge_type: BadgeType;
  threshold: number | null;
  chore_id: string | null;
  family_id: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Reward {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  points_cost: number;
  is_active: boolean;
  deactivated_at: string | null;
  created_by: string | null;
  created_at: string;
  sort_order: number;
}

export interface RewardAssignment {
  reward_id: string;
  user_id: string;
  created_at: string;
  removed_at: string | null;
}

export type RedemptionStatus = "pending" | "approved" | "denied";

export interface Redemption {
  id: string;
  family_id: string;
  user_id: string;
  reward_id: string | null;
  reward_title: string;
  reward_icon: string | null;
  points_cost: number;
  status: RedemptionStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decided_note: string | null;
}

// Supabase Database type for typed client
export type Database = {
  public: {
    Tables: {
      families: { Row: Family; Insert: Omit<Family, "id" | "created_at"> & { id?: string }; Update: Partial<Family> };
      child_invitations: { Row: ChildInvitation; Insert: Omit<ChildInvitation, "id" | "created_at"> & { id?: string }; Update: Partial<ChildInvitation> };
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Profile> };
      chores: { Row: Chore; Insert: Omit<Chore, "id" | "created_at">; Update: Partial<Chore> };
      chore_completions: { Row: ChoreCompletion; Insert: Omit<ChoreCompletion, "id">; Update: Partial<ChoreCompletion> };
      daily_bonuses: { Row: DailyBonus; Insert: Omit<DailyBonus, "id" | "awarded_at">; Update: Partial<DailyBonus> };
      streaks: { Row: Streak; Insert: Omit<Streak, "id">; Update: Partial<Streak> };
      badges: { Row: Badge; Insert: Omit<Badge, "id">; Update: Partial<Badge> };
      user_badges: { Row: UserBadge; Insert: Omit<UserBadge, "id" | "earned_at">; Update: Partial<UserBadge> };
      chore_assignments: { Row: ChoreAssignment; Insert: ChoreAssignment; Update: Partial<ChoreAssignment> };
      rewards: { Row: Reward; Insert: Omit<Reward, "id" | "created_at">; Update: Partial<Reward> };
      reward_assignments: { Row: RewardAssignment; Insert: RewardAssignment; Update: Partial<RewardAssignment> };
      redemptions: { Row: Redemption; Insert: Omit<Redemption, "id" | "requested_at">; Update: Partial<Redemption> };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};
