-- Add walkthrough seen timestamp to profiles.
-- Null = user has not completed (or skipped) the in-app walkthrough yet;
-- non-null = timestamp when they first dismissed it.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS walkthrough_seen_at TIMESTAMPTZ NULL;
