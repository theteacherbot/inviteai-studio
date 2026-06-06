
-- Rename events -> projects
ALTER TABLE public.events RENAME TO projects;
ALTER TABLE public.projects RENAME CONSTRAINT events_pkey TO projects_pkey;

-- Rename prompts -> generated_prompts
ALTER TABLE public.prompts RENAME TO generated_prompts;
ALTER TABLE public.generated_prompts RENAME CONSTRAINT prompts_pkey TO generated_prompts_pkey;
ALTER TABLE public.generated_prompts RENAME CONSTRAINT prompts_event_id_fkey TO generated_prompts_project_id_fkey;
ALTER TABLE public.generated_prompts RENAME COLUMN event_id TO project_id;

-- Rename generated_qrs.event_id -> project_id
ALTER TABLE public.generated_qrs RENAME CONSTRAINT generated_qrs_event_id_fkey TO generated_qrs_project_id_fkey;
ALTER TABLE public.generated_qrs RENAME COLUMN event_id TO project_id;

-- Rename generated_images.event_id -> project_id
ALTER TABLE public.generated_images RENAME CONSTRAINT generated_images_event_id_fkey TO generated_images_project_id_fkey;
ALTER TABLE public.generated_images RENAME COLUMN event_id TO project_id;

-- New table: generated_jsons (W4H1 history per project)
CREATE TABLE public.generated_jsons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  w4h1 jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_jsons TO anon, authenticated;
GRANT ALL ON public.generated_jsons TO service_role;
ALTER TABLE public.generated_jsons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generated_jsons public read" ON public.generated_jsons FOR SELECT USING (true);
CREATE POLICY "generated_jsons public insert" ON public.generated_jsons FOR INSERT WITH CHECK (true);

-- Add UPDATE/DELETE policies so user can manage their projects (no auth yet → public)
CREATE POLICY "projects public delete" ON public.projects FOR DELETE USING (true);
CREATE POLICY "projects public update" ON public.projects FOR UPDATE USING (true) WITH CHECK (true);

-- Cascade deletes on child tables for cleanliness
ALTER TABLE public.generated_prompts DROP CONSTRAINT generated_prompts_project_id_fkey;
ALTER TABLE public.generated_prompts ADD CONSTRAINT generated_prompts_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.generated_qrs DROP CONSTRAINT generated_qrs_project_id_fkey;
ALTER TABLE public.generated_qrs ADD CONSTRAINT generated_qrs_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.generated_images DROP CONSTRAINT generated_images_project_id_fkey;
ALTER TABLE public.generated_images ADD CONSTRAINT generated_images_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
