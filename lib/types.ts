export type Role = "admin" | "user";
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  timezone: string;
  created_at: string;
}

export interface Chore {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  points: number;
  recurrence: DayOfWeek[];
  is_active: boolean;
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
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Profile> };
      chores: { Row: Chore; Insert: Omit<Chore, "id" | "created_at">; Update: Partial<Chore> };
      chore_completions: { Row: ChoreCompletion; Insert: Omit<ChoreCompletion, "id">; Update: Partial<ChoreCompletion> };
      daily_bonuses: { Row: DailyBonus; Insert: Omit<DailyBonus, "id" | "awarded_at">; Update: Partial<DailyBonus> };
      streaks: { Row: Streak; Insert: Omit<Streak, "id">; Update: Partial<Streak> };
      badges: { Row: Badge; Insert: Omit<Badge, "id">; Update: Partial<Badge> };
      user_badges: { Row: UserBadge; Insert: Omit<UserBadge, "id" | "earned_at">; Update: Partial<UserBadge> };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};
