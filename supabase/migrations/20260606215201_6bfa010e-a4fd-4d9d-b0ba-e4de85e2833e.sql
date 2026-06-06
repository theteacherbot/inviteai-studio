
-- event_types catalog
CREATE TABLE public.event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_types TO anon, authenticated;
GRANT ALL ON public.event_types TO service_role;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_types are public readable" ON public.event_types FOR SELECT USING (true);

-- events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_slug TEXT NOT NULL,
  event_type_name TEXT NOT NULL,
  form_data JSONB NOT NULL,
  w4h1 JSONB NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events public insert" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "events public read" ON public.events FOR SELECT USING (true);

-- prompts
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO anon, authenticated;
GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompts public insert" ON public.prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "prompts public read" ON public.prompts FOR SELECT USING (true);

-- generated_images
CREATE TABLE public.generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO anon, authenticated;
GRANT ALL ON public.generated_images TO service_role;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generated_images public insert" ON public.generated_images FOR INSERT WITH CHECK (true);
CREATE POLICY "generated_images public read" ON public.generated_images FOR SELECT USING (true);

-- generated_qrs
CREATE TABLE public.generated_qrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  data_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_qrs TO anon, authenticated;
GRANT ALL ON public.generated_qrs TO service_role;
ALTER TABLE public.generated_qrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generated_qrs public insert" ON public.generated_qrs FOR INSERT WITH CHECK (true);
CREATE POLICY "generated_qrs public read" ON public.generated_qrs FOR SELECT USING (true);

-- Seed event types
INSERT INTO public.event_types (slug, name, description, icon) VALUES
  ('cumpleanos', 'Cumpleaños', 'Celebra un año más con una invitación memorable.', '🎂'),
  ('matrimonio', 'Matrimonio', 'Una invitación elegante para el día más especial.', '💍'),
  ('quince', 'Quince Años', 'Diseño sofisticado para una noche inolvidable.', '👑')
ON CONFLICT (slug) DO NOTHING;
