
-- Fix RLS: Drop restrictive policies and recreate as permissive (default)
-- festival_sections
DROP POLICY IF EXISTS "Anyone can read sections" ON public.festival_sections;
CREATE POLICY "Anyone can read sections" ON public.festival_sections FOR SELECT USING (true);

-- events
DROP POLICY IF EXISTS "Anyone can read events" ON public.events;
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);

-- app_settings
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);

-- map_areas
DROP POLICY IF EXISTS "Anyone can read map areas" ON public.map_areas;
CREATE POLICY "Anyone can read map areas" ON public.map_areas FOR SELECT USING (true);

-- sponsor_banners
DROP POLICY IF EXISTS "Anyone can read active sponsors" ON public.sponsor_banners;
CREATE POLICY "Anyone can read active sponsors" ON public.sponsor_banners FOR SELECT USING (true);

-- profiles (public lookup)
DROP POLICY IF EXISTS "Anyone can lookup profiles by username" ON public.profiles;
CREATE POLICY "Anyone can lookup profiles by username" ON public.profiles FOR SELECT USING (true);
