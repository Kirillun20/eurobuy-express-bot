-- =============================================================
-- 1. ROLES
-- =============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================
-- 2. LINK PROFILES TO AUTH.USERS
-- =============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.is_profile_owner(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _profile_id AND user_id = auth.uid()
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone, euro_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone',''),
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 3. PROFILES POLICIES
-- =============================================================
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update profiles" ON public.profiles
FOR UPDATE USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- INSERT happens only via trigger -> no client policy

-- =============================================================
-- 4. ORDERS POLICIES
-- =============================================================
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Orders viewable by everyone" ON public.orders;

CREATE POLICY "View own or admin orders" ON public.orders
FOR SELECT USING (
  (profile_id IS NOT NULL AND public.is_profile_owner(profile_id))
  OR public.has_role(auth.uid(),'admin')
);

CREATE POLICY "Create order (anon ok)" ON public.orders
FOR INSERT WITH CHECK (
  profile_id IS NULL
  OR public.is_profile_owner(profile_id)
  OR public.has_role(auth.uid(),'admin')
);

CREATE POLICY "Admins update orders" ON public.orders
FOR UPDATE USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete orders" ON public.orders
FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- Public lookup by track number for guests: small RPC
CREATE OR REPLACE FUNCTION public.get_order_by_track(_track text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders WHERE track_number ILIKE _track LIMIT 1;
$$;

-- =============================================================
-- 5. POINTS TRANSACTIONS POLICIES
-- =============================================================
DROP POLICY IF EXISTS "Anyone can insert points_transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Points transactions viewable by everyone" ON public.points_transactions;

CREATE POLICY "View own points tx" ON public.points_transactions
FOR SELECT USING (public.is_profile_owner(profile_id) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Insert own points tx" ON public.points_transactions
FOR INSERT WITH CHECK (public.is_profile_owner(profile_id) OR public.has_role(auth.uid(),'admin'));

-- =============================================================
-- 6. REVIEWS POLICIES
-- =============================================================
DROP POLICY IF EXISTS "Anyone can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;

CREATE POLICY "Reviews public read" ON public.reviews
FOR SELECT USING (true);

CREATE POLICY "Authenticated post reviews" ON public.reviews
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND (profile_id IS NULL OR public.is_profile_owner(profile_id))
);

CREATE POLICY "Admins delete reviews" ON public.reviews
FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- =============================================================
-- 7. CHAT MESSAGES POLICIES
-- (anonymous support chat by session_id stays public read/insert)
-- =============================================================
DROP POLICY IF EXISTS "Anyone can delete chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can update chat messages" ON public.chat_messages;

CREATE POLICY "Admins delete chats" ON public.chat_messages
FOR DELETE USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins update chats" ON public.chat_messages
FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- Prevent anonymous senders from posing as admin
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;
CREATE POLICY "Insert chat messages (no impersonation)" ON public.chat_messages
FOR INSERT WITH CHECK (
  is_admin = false OR public.has_role(auth.uid(),'admin')
);

-- =============================================================
-- 8. SITE SETTINGS POLICIES
-- =============================================================
DROP POLICY IF EXISTS "Anyone can delete settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can insert settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.site_settings;

CREATE POLICY "Admins insert settings" ON public.site_settings
FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins update settings" ON public.site_settings
FOR UPDATE USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete settings" ON public.site_settings
FOR DELETE USING (public.has_role(auth.uid(),'admin'));