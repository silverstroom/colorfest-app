
-- Table for user favorites with optional notes
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only read their own favorites
CREATE POLICY "Users can read own favorites"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own favorites (notes)
CREATE POLICY "Users can update own favorites"
ON public.user_favorites FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins can manage favorites"
ON public.user_favorites FOR ALL
USING (has_role(auth.uid(), 'admin'));
