export const ALLOWED_ADMIN_EMAILS = [
  "r.shishir812@gmail.com",
  "amriitarao@gmail.com",
] as const;

export const ALLOWED_USER_EMAILS = ["ridhamrao@gmail.com"] as const;

export const ALL_ALLOWED_EMAILS = [
  ...ALLOWED_ADMIN_EMAILS,
  ...ALLOWED_USER_EMAILS,
] as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, min: 0,     max: 499,   name: "Rookie" },
  { level: 2, min: 500,   max: 999,   name: "Apprentice" },
  { level: 3, min: 1000,  max: 1999,  name: "Achiever" },
  { level: 4, min: 2000,  max: 3499,  name: "Champion" },
  { level: 5, min: 3500,  max: 5999,  name: "Hero" },
  { level: 6, min: 6000,  max: 9999,  name: "Legend" },
  { level: 7, min: 10000, max: Infinity, name: "Grand Master ⭐" },
] as const;

export const DAILY_BONUS_POINTS = 50;
