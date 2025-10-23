-- =========================================
-- PixelateAI - Complete Supabase Schema
-- =========================================
-- This file contains the complete database schema for PixelateAI
-- Run this in your Supabase SQL Editor
-- =========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =========================================
-- CLEANUP (if re-running)
-- =========================================
-- Drop existing objects to allow clean re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_manim_jobs ON public.manim_jobs;
DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
DROP TRIGGER IF EXISTS set_updated_at_video_metadata ON public.video_metadata;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;

DROP VIEW IF EXISTS public.recent_activity;
DROP VIEW IF EXISTS public.user_stats;

-- =========================================
-- 1. MANIM JOBS TABLE
-- =========================================
-- Stores information about Manim video generation jobs
--

CREATE TABLE IF NOT EXISTS public.manim_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL,
    prompt TEXT NOT NULL,
    code TEXT,
    url TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Check constraint for valid status values
    CONSTRAINT manim_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_manim_jobs_status ON public.manim_jobs(status);
CREATE INDEX IF NOT EXISTS idx_manim_jobs_created_at ON public.manim_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manim_jobs_user_id ON public.manim_jobs(user_id);

-- Enable Row Level Security
ALTER TABLE public.manim_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manim_jobs
-- Allow anyone to insert jobs (for anonymous users)
CREATE POLICY "Anyone can create manim jobs"
ON public.manim_jobs
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read jobs (for now - you can restrict this later)
CREATE POLICY "Anyone can view manim jobs"
ON public.manim_jobs
FOR SELECT
TO public
USING (true);

-- Allow users to update their own jobs
CREATE POLICY "Users can update their own manim jobs"
ON public.manim_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own jobs
CREATE POLICY "Users can delete their own manim jobs"
ON public.manim_jobs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =========================================
-- 2. PROJECTS TABLE
-- =========================================
-- Stores user-created animation projects
--

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Project content
    scenes JSONB DEFAULT '[]'::jsonb,
    clips JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '{"tracks": []}'::jsonb,
    
    -- Metadata
    thumbnail TEXT,
    duration INTEGER DEFAULT 0, -- in milliseconds
    fps INTEGER DEFAULT 30,
    resolution TEXT DEFAULT '1920x1080',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT projects_name_not_empty CHECK (char_length(name) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
-- Users can only see their own projects
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =========================================
-- 3. VIDEO METADATA TABLE (Optional)
-- =========================================
-- Stores metadata about videos in storage
--

CREATE TABLE IF NOT EXISTS public.video_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.manim_jobs(id) ON DELETE SET NULL,
    
    -- Video information
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    
    -- Video properties
    title TEXT,
    description TEXT,
    duration REAL, -- in seconds
    width INTEGER,
    height INTEGER,
    size_bytes BIGINT,
    
    -- Metadata
    tags TEXT[],
    category TEXT,
    thumbnail_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT video_metadata_filename_not_empty CHECK (char_length(filename) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_video_metadata_user_id ON public.video_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_video_metadata_job_id ON public.video_metadata(job_id);
CREATE INDEX IF NOT EXISTS idx_video_metadata_created_at ON public.video_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_metadata_tags ON public.video_metadata USING gin(tags);

-- Enable RLS
ALTER TABLE public.video_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_metadata
CREATE POLICY "Anyone can view video metadata"
ON public.video_metadata
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create their own video metadata"
ON public.video_metadata
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video metadata"
ON public.video_metadata
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video metadata"
ON public.video_metadata
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =========================================
-- 4. USER PROFILES TABLE
-- =========================================
-- Extended user information beyond auth.users
--

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    
    -- User preferences
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Usage tracking
    total_videos INTEGER DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =========================================
-- 5. FUNCTIONS & TRIGGERS
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_updated_at_manim_jobs
    BEFORE UPDATE ON public.manim_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_projects
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_video_metadata
    BEFORE UPDATE ON public.video_metadata
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- 6. STORAGE BUCKETS
-- =========================================
-- Run this separately in the Supabase Dashboard > Storage
-- or via SQL if you have the necessary permissions
--

-- Create videos bucket (if not exists)
-- This is usually done via the Supabase Dashboard: Storage > New Bucket
-- Bucket name: videos
-- Public: true (for public video access)

-- Note: Bucket creation SQL (run this manually or via Dashboard):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('videos', 'videos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
-- Allow public read access to videos
-- CREATE POLICY "Public can read videos"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
-- CREATE POLICY "Authenticated users can upload videos"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'videos');

-- Allow users to update their own videos
-- CREATE POLICY "Users can update their own videos"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own videos
-- CREATE POLICY "Users can delete their own videos"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================
-- 7. GRANT PERMISSIONS
-- =========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Set default permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- =========================================
-- 8. SAMPLE DATA (Optional - for testing)
-- =========================================

-- Uncomment to insert sample data:

-- INSERT INTO public.manim_jobs (status, prompt, code, message)
-- VALUES 
--     ('completed', 'Create a circle animation', 'from manim import *\n\nclass Scene(Scene):\n    def construct(self):\n        circle = Circle()\n        self.play(Create(circle))\n        self.wait(2)', 'Video generated successfully'),
--     ('pending', 'Create a square animation', NULL, NULL);

-- =========================================
-- 9. VIEWS FOR ANALYTICS (Optional)
-- =========================================

-- View for user statistics
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    COUNT(DISTINCT mj.id) as total_jobs,
    COUNT(DISTINCT pr.id) as total_projects,
    COUNT(DISTINCT vm.id) as total_videos,
    SUM(CASE WHEN mj.status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
    SUM(CASE WHEN mj.status = 'failed' THEN 1 ELSE 0 END) as failed_jobs,
    p.created_at as user_since
FROM public.profiles p
LEFT JOIN public.manim_jobs mj ON p.id = mj.user_id
LEFT JOIN public.projects pr ON p.id = pr.user_id
LEFT JOIN public.video_metadata vm ON p.id = vm.user_id
GROUP BY p.id, p.email, p.full_name, p.created_at;

-- View for recent activity
CREATE OR REPLACE VIEW public.recent_activity AS
SELECT 
    'job' as activity_type,
    mj.id,
    mj.user_id,
    mj.prompt as title,
    mj.status,
    mj.created_at,
    mj.updated_at
FROM public.manim_jobs mj
UNION ALL
SELECT 
    'project' as activity_type,
    pr.id,
    pr.user_id,
    pr.name as title,
    'active' as status,
    pr.created_at,
    pr.updated_at
FROM public.projects pr
ORDER BY created_at DESC
LIMIT 100;

-- =========================================
-- SETUP COMPLETE!
-- =========================================

-- Next steps:
-- 1. Create the 'videos' storage bucket in Supabase Dashboard > Storage
-- 2. Make the bucket public for video access
-- 3. Update your .env file with Supabase credentials
-- 4. Test the connection from your backend and frontend
--
-- For more information, see the project README.md

