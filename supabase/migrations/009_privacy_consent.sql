-- Add privacy consent timestamp to profiles.
-- Null = consent not yet given (new parent); non-null = timestamp when parent accepted.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS privacy_consent_given_at TIMESTAMPTZ NULL;
