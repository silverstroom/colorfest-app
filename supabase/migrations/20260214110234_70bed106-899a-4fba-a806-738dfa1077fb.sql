
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  marketing_consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Festival sections (concerti, bar, food, drink, mostre, camping, custom...)
CREATE TABLE public.festival_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'MapPin',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.festival_sections ENABLE ROW LEVEL SECURITY;

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.festival_sections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  artist TEXT DEFAULT '',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  day INT DEFAULT 1,
  stage TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Sponsor banners
CREATE TABLE public.sponsor_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsor_banners ENABLE ROW LEVEL SECURITY;

-- Map areas (interactive zones on the festival map)
CREATE TABLE public.map_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  section_id UUID REFERENCES public.festival_sections(id) ON DELETE SET NULL,
  x_percent FLOAT NOT NULL DEFAULT 50,
  y_percent FLOAT NOT NULL DEFAULT 50,
  icon TEXT DEFAULT 'MapPin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.map_areas ENABLE ROW LEVEL SECURITY;

-- App settings (white-label config)
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, marketing_consent)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'marketing_consent')::boolean, true)
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: users can read own, admins can read all
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- festival_sections: everyone can read, admins can CRUD
CREATE POLICY "Anyone can read sections" ON public.festival_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage sections" ON public.festival_sections FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- events: everyone can read, admins can CRUD
CREATE POLICY "Anyone can read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.events FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- sponsor_banners: everyone can read active, admins can CRUD
CREATE POLICY "Anyone can read active sponsors" ON public.sponsor_banners FOR SELECT USING (true);
CREATE POLICY "Admins can manage sponsors" ON public.sponsor_banners FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- map_areas: everyone can read, admins can CRUD
CREATE POLICY "Anyone can read map areas" ON public.map_areas FOR SELECT USING (true);
CREATE POLICY "Admins can manage map areas" ON public.map_areas FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- app_settings: everyone can read, admins can CRUD
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed default sections
INSERT INTO public.festival_sections (name, description, icon, sort_order) VALUES
  ('Concerti', 'Programma concerti e orari', 'Music', 1),
  ('Area Bar', 'Bar e bevande', 'Wine', 2),
  ('Area Food', 'Cibo e ristorazione', 'UtensilsCrossed', 3),
  ('Area Drink', 'Bevande speciali', 'Beer', 4),
  ('Mostre', 'Esposizioni e installazioni artistiche', 'Palette', 5),
  ('Camping', 'Area camping e alloggi', 'Tent', 6);

-- Seed default app settings
INSERT INTO public.app_settings (key, value) VALUES
  ('festival_name', 'Color Fest XIV'),
  ('festival_subtitle', 'Summer on a Solitary Beach'),
  ('festival_dates', '12-13-14 Agosto 2026'),
  ('festival_location', 'Lamezia Terme, Calabria'),
  ('sponsors_enabled', 'true'),
  ('primary_color', '224 90% 50%'),
  ('accent_color', '43 100% 50%');
