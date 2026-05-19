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
}

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  user_id: string;
  completed_date: string;
  is_exception: boolean;
  exception_reason: string | null;
  completed_at: string | null;
  points_earned: number | null;
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
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};
