-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Owner inserts categories" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Owner updates categories" ON public.categories FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Owner deletes categories" ON public.categories FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role));

INSERT INTO public.categories (slug, name, sort_order) VALUES
  ('sports','Sports',10),
  ('abstract','Abstract',20),
  ('nature','Nature',30),
  ('portrait','Portrait',40),
  ('architecture','Architecture',50),
  ('surreal','Surreal',60),
  ('still-life','Still Life',70),
  ('fantasy','Fantasy',80);

-- Paintings: add new columns
ALTER TABLE public.paintings
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN status text NOT NULL DEFAULT 'approved',
  ADD COLUMN source_image_url text,
  ADD COLUMN etsy_listing_id text,
  ADD COLUMN pinterest_pin_id text,
  ADD COLUMN auto_suggested boolean NOT NULL DEFAULT false,
  ADD COLUMN tags text[] DEFAULT '{}'::text[];

CREATE INDEX idx_paintings_category ON public.paintings(category_id);
CREATE INDEX idx_paintings_status ON public.paintings(status);

-- Make published paintings visibility require approval too
DROP POLICY "Anyone can view published paintings" ON public.paintings;
CREATE POLICY "Anyone views approved published paintings"
  ON public.paintings FOR SELECT
  USING (is_published = true AND status = 'approved');

-- Allow owner self-promotion: first user to sign up can claim owner role
CREATE POLICY "User can claim owner if none exists"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'owner'::app_role
    AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'owner'::app_role)
  );