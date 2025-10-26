-- Fix profiles table RLS policy - only authenticated users should view profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Update the courses table to remove xp_points column
ALTER TABLE public.courses DROP COLUMN IF EXISTS xp_points;

-- Add course_program_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='courses' 
                 AND column_name='course_program_name') THEN
    ALTER TABLE public.courses ADD COLUMN course_program_name text;
  END IF;
END $$;

-- Drop content_url column if exists
ALTER TABLE public.courses DROP COLUMN IF EXISTS content_url;