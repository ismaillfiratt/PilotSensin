-- Add is_superadmin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_superadmin boolean NOT NULL DEFAULT false;

-- Set application owner as superadmin
UPDATE profiles SET is_superadmin = true WHERE email = 'destek@pilotsensin.com';
