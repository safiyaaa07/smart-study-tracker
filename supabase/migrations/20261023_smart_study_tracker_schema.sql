-- ============================================================================
-- SMART STUDY TRACKER — SUPABASE POSTGRESQL MIGRATION SCRIPT
-- ============================================================================
-- This script sets up:
-- 1. Profiles & Role Management (with Security Definer function is_admin)
-- 2. Semester, Subject, Unit, Topic, Subtopic Hierarchy
-- 3. Individual Student Progress Tracking (with uniqueness constraints)
-- 4. Shared Study Resources & Moderation
-- 5. Row Level Security (RLS) policies enforcing student isolation & admin privilege
-- 6. Supabase Storage Bucket setup for 'study-materials'
-- 7. Synthetic Seed Data for 2 full Semesters, Subjects, Units & Topics
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
    semester_enrolled INTEGER NOT NULL DEFAULT 4,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Index for fast roll number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_roll_number ON public.profiles(roll_number);

-- Security Definer function to check if current user is an admin without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
$$;

-- ----------------------------------------------------------------------------
-- 2. SYLLABUS HIERARCHY
-- ----------------------------------------------------------------------------

-- Semesters
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_number INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 4,
    color_code TEXT NOT NULL DEFAULT '#3B82F6',
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_subjects_semester_id ON public.subjects(semester_id);

-- Units
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_subject_unit UNIQUE(subject_id, unit_number)
);
CREATE INDEX IF NOT EXISTS idx_units_subject_id ON public.units(subject_id);

-- Topics
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_hours NUMERIC(4,1) NOT NULL DEFAULT 2.0,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_topics_unit_id ON public.topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_topics_is_important ON public.topics(is_important);

-- Subtopics
CREATE TABLE IF NOT EXISTS public.subtopics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON public.subtopics(topic_id);

-- ----------------------------------------------------------------------------
-- 3. INDIVIDUAL STUDENT PROGRESS TRACKER
-- ----------------------------------------------------------------------------
-- Tracks checked state per student per topic / subtopic
-- Unique constraint guarantees no duplicates per student per item
CREATE TABLE IF NOT EXISTS public.topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('topic', 'subtopic')),
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_user_item UNIQUE (user_id, item_id, item_type)
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON public.topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_item ON public.topic_progress(item_id, item_type);

-- ----------------------------------------------------------------------------
-- 4. SHARED STUDY RESOURCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'document', 'youtube', 'url')),
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploader_name TEXT NOT NULL,
    uploader_roll TEXT NOT NULL,
    file_path TEXT,
    file_size_bytes BIGINT,
    file_mime_type TEXT,
    external_url TEXT,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_exam_prep BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON public.resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_uploader ON public.resources(uploader_id);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 5.1 PROFILES POLICIES
CREATE POLICY "Authenticated users can read all student directory profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update only their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 5.2 USER ROLES POLICIES
CREATE POLICY "Users can read their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert or update user roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- 5.3 SYLLABUS POLICIES (Read by everyone, Admin-only write)
CREATE POLICY "Anyone can read semesters"
    ON public.semesters FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage semesters"
    ON public.semesters FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read subjects"
    ON public.subjects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage subjects"
    ON public.subjects FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read units"
    ON public.units FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage units"
    ON public.units FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read topics"
    ON public.topics FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage topics"
    ON public.topics FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can read subtopics"
    ON public.subtopics FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage subtopics"
    ON public.subtopics FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- 5.4 TOPIC PROGRESS POLICIES (Strict Student Isolation)
-- Student A cannot read, insert, update, or delete Student B's progress!
CREATE POLICY "Students can only read their own progress"
    ON public.topic_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students can insert only their own progress"
    ON public.topic_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update only their own progress"
    ON public.topic_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Students can delete only their own progress"
    ON public.topic_progress FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5.5 RESOURCES POLICIES
CREATE POLICY "Anyone can read approved resources"
    ON public.resources FOR SELECT
    TO authenticated
    USING (status = 'approved' OR auth.uid() = uploader_id OR public.is_admin(auth.uid()));

CREATE POLICY "Students can insert their own resources"
    ON public.resources FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Students can edit pending resources; Admins can edit any"
    ON public.resources FOR UPDATE
    TO authenticated
    USING ((auth.uid() = uploader_id AND status = 'pending') OR public.is_admin(auth.uid()));

CREATE POLICY "Students can delete own resources; Admins can delete any"
    ON public.resources FOR DELETE
    TO authenticated
    USING (auth.uid() = uploader_id OR public.is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 6. STORAGE BUCKET CONFIGURATION (for Supabase Storage)
-- ----------------------------------------------------------------------------
-- Run in Supabase SQL editor:
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read for materials
CREATE POLICY "Public read study materials"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'study-materials');

-- Storage RLS: Authenticated upload
CREATE POLICY "Authenticated users upload study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'study-materials'
    AND auth.role() = 'authenticated'
);

-- Storage RLS: Owner or Admin can delete
CREATE POLICY "Owners or Admin delete study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'study-materials'
    AND (auth.uid() = owner OR public.is_admin(auth.uid()))
);

-- ----------------------------------------------------------------------------
-- 7. SYNTHETIC SEED DATA
-- ----------------------------------------------------------------------------

-- Semesters
INSERT INTO public.semesters (id, semester_number, title, academic_year, display_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 3, 'Semester III — Core Foundations', '2025-2026', 1),
    ('22222222-2222-2222-2222-222222222222', 4, 'Semester IV — Advanced Systems', '2025-2026', 2)
ON CONFLICT (id) DO NOTHING;

-- Subjects
INSERT INTO public.subjects (id, semester_id, code, name, credits, color_code, display_order)
VALUES
    -- Semester 4 Subjects
    ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'CS401', 'Database Management Systems', 4, '#2563EB', 1),
    ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'CS402', 'Design & Analysis of Algorithms', 4, '#7C3AED', 2),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'CS403', 'Operating Systems', 4, '#0D9488', 3),
    ('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222222', 'CS404', 'Computer Networks', 3, '#EA580C', 4),
    -- Semester 3 Subjects
    ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', 'CS301', 'Data Structures & OOP', 4, '#0284C7', 1),
    ('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', 'CS302', 'Discrete Mathematics', 3, '#4F46E5', 2)
ON CONFLICT (id) DO NOTHING;

-- Units for CS401: DBMS
INSERT INTO public.units (id, subject_id, unit_number, title, description, display_order)
VALUES
    ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 1, 'Unit I: Relational Architecture & ER Modeling', 'Entity modeling, relational algebra, and calculus foundations', 1),
    ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 2, 'Unit II: SQL & Relational Database Design', 'Schema refinement, normal forms (1NF through BCNF), and triggers', 2),
    ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 3, 'Unit III: Transaction Processing & Concurrency', 'ACID guarantees, serializability, 2PL, and deadlock handling', 3),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333331', 4, 'Unit IV: Indexing, B-Trees & Query Optimization', 'B+ Trees, hashing, cost estimations, and recovery systems', 4)
ON CONFLICT (id) DO NOTHING;

-- Units for CS402: Algorithms
INSERT INTO public.units (id, subject_id, unit_number, title, description, display_order)
VALUES
    ('44444444-4444-4444-4444-444444444451', '33333333-3333-3333-3333-333333333332', 1, 'Unit I: Asymptotic Analysis & Divide-and-Conquer', 'Big-O notation, recurrence trees, Master theorem, and Sorting', 1),
    ('44444444-4444-4444-4444-444444444452', '33333333-3333-3333-3333-333333333332', 2, 'Unit II: Dynamic Programming & Greedy Algorithms', 'Optimal substructure, memoization, 0/1 Knapsack, Bellman-Ford', 2),
    ('44444444-4444-4444-4444-444444444453', '33333333-3333-3333-3333-333333333332', 3, 'Unit III: Graph Algorithms & NP-Completeness', 'Max Flow, Ford-Fulkerson, P vs NP, and reduction techniques', 3)
ON CONFLICT (id) DO NOTHING;

-- Topics for DBMS Unit I
INSERT INTO public.topics (id, unit_id, title, description, is_important, estimated_hours, display_order)
VALUES
    ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444441', 'Database System Concepts & 3-Tier Architecture', 'Physical, logical, and view levels of data abstraction', false, 1.5, 1),
    ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444441', 'Entity-Relationship Diagrams & Schema Mapping', 'Entities, relationships, attributes, and reduction to relational tables', true, 2.5, 2),
    ('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444441', 'Relational Algebra Operators & Query Trees', 'Select, project, Cartesian product, joins, and set operations', true, 3.0, 3)
ON CONFLICT (id) DO NOTHING;

-- Subtopics for Topic 55555555-5555-5555-5555-555555555502 (ER Diagrams)
INSERT INTO public.subtopics (id, topic_id, title, display_order)
VALUES
    ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555502', 'Weak Entity Sets & Identifying Relationships', 1),
    ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', 'Extended ER: Specialization, Generalization & Aggregation', 2),
    ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', 'Converting ER Schemas to DDL Tables with Foreign Keys', 3)
ON CONFLICT (id) DO NOTHING;

-- Topics for DBMS Unit II (Normalization)
INSERT INTO public.topics (id, unit_id, title, description, is_important, estimated_hours, display_order)
VALUES
    ('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444442', 'Functional Dependencies & Armstrong Axioms', 'Inference rules, canonical cover, and attribute closure', false, 2.0, 1),
    ('55555555-5555-5555-5555-555555555505', '44444444-4444-4444-4444-444444444442', 'Normalization: 1NF, 2NF, 3NF & Boyce-Codd (BCNF)', 'Lossless decomposition and dependency preservation rules', true, 3.5, 2),
    ('55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444442', 'Complex SQL: Correlated Subqueries & Window Functions', 'OVER clause, PARTITION BY, RANK, and analytics queries', false, 2.0, 3)
ON CONFLICT (id) DO NOTHING;

-- Topics for DBMS Unit III (Transactions)
INSERT INTO public.topics (id, unit_id, title, description, is_important, estimated_hours, display_order)
VALUES
    ('55555555-5555-5555-5555-555555555507', '44444444-4444-4444-4444-444444444443', 'ACID Properties & Transaction States', 'Atomicity, Consistency, Isolation, and Durability guarantees', false, 1.5, 1),
    ('55555555-5555-5555-5555-555555555508', '44444444-4444-4444-4444-444444444443', 'Conflict Serializability & Precedence Graphs', 'Schedule testing, dirty read anomalies, and recoverable schedules', true, 3.0, 2),
    ('55555555-5555-5555-5555-555555555509', '44444444-4444-4444-4444-444444444443', 'Two-Phase Locking (2PL) Protocol & Deadlock Prevention', 'Strict 2PL, wait-die and wound-wait schemes', true, 2.5, 3)
ON CONFLICT (id) DO NOTHING;

-- Topics for Algorithms Unit II
INSERT INTO public.topics (id, unit_id, title, description, is_important, estimated_hours, display_order)
VALUES
    ('55555555-5555-5555-5555-555555555510', '44444444-4444-4444-4444-444444444452', '0/1 Knapsack Problem & DP Formulations', 'Bottom-up table construction and space optimization', true, 3.0, 1),
    ('55555555-5555-5555-5555-555555555511', '44444444-4444-4444-4444-444444444452', 'Longest Common Subsequence (LCS) & Edit Distance', 'Character alignment, backpointers, and recursion equations', true, 2.5, 2),
    ('55555555-5555-5555-5555-555555555512', '44444444-4444-4444-4444-444444444452', 'Huffman Coding & Optimal Prefix Codes', 'Greedy frequency-driven tree construction and bit efficiency', false, 2.0, 3)
ON CONFLICT (id) DO NOTHING;

-- Example Resources
-- Note: Replace uploader_id with an actual auth user ID when deploying
-- ============================================================================
