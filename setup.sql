-- Supabase Setup Script for AI-SRS Studio
-- Run this script in the Supabase SQL Editor to create the necessary tables.

-- We assume Auth is handled by Supabase Auth (auth.users). We will map projects to auth.users.id

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" 
  ON public.projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
  ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON public.projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON public.projects FOR DELETE USING (auth.uid() = user_id);


-- 2. Create SRS Documents Table
CREATE TABLE IF NOT EXISTS public.srs_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for SRS Documents
ALTER TABLE public.srs_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SRS documents" 
  ON public.srs_documents FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = srs_documents.project_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert their own SRS documents" 
  ON public.srs_documents FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = srs_documents.project_id AND user_id = auth.uid()));

CREATE POLICY "Users can update their own SRS documents" 
  ON public.srs_documents FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = srs_documents.project_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete their own SRS documents" 
  ON public.srs_documents FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = srs_documents.project_id AND user_id = auth.uid()));


-- 3. Create Evaluation Metrics Table
CREATE TABLE IF NOT EXISTS public.evaluation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  srs_id UUID NOT NULL REFERENCES public.srs_documents(id) ON DELETE CASCADE,
  completeness_score FLOAT,
  consistency_score FLOAT,
  unambiguity_score FLOAT,
  traceability_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Evaluation Metrics
ALTER TABLE public.evaluation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for their own documents" 
  ON public.evaluation_metrics FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.srs_documents sd 
    JOIN public.projects p ON sd.project_id = p.id 
    WHERE sd.id = evaluation_metrics.srs_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert metrics for their own documents" 
  ON public.evaluation_metrics FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.srs_documents sd 
    JOIN public.projects p ON sd.project_id = p.id 
    WHERE sd.id = evaluation_metrics.srs_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update metrics for their own documents" 
  ON public.evaluation_metrics FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.srs_documents sd 
    JOIN public.projects p ON sd.project_id = p.id 
    WHERE sd.id = evaluation_metrics.srs_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete metrics for their own documents" 
  ON public.evaluation_metrics FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.srs_documents sd 
    JOIN public.projects p ON sd.project_id = p.id 
    WHERE sd.id = evaluation_metrics.srs_id AND p.user_id = auth.uid()
  ));
