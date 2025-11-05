-- Add deleted_at column to profiles table for soft delete
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Add index for better query performance on non-deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- Update RLS policies to exclude deleted users from normal views
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view active profiles" 
ON public.profiles 
FOR SELECT 
USING (deleted_at IS NULL);