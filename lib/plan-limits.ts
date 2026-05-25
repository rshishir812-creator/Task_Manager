/** Plan limits + trial length. Plain constants — safe to import from client or server. */
export const FREE_LIMITS = {
  maxActiveChores: 6,
  maxChildren: 1,
} as const;

export const TRIAL_DAYS = 7;
