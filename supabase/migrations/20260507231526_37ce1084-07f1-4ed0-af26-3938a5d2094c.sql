
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  vision TEXT NOT NULL,
  room_description TEXT,
  preferred_size TEXT,
  budget TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit a commission request
CREATE POLICY "Anyone can submit commission requests"
ON public.commissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only owners can read commission requests
CREATE POLICY "Owners can view commission requests"
ON public.commissions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner'));
