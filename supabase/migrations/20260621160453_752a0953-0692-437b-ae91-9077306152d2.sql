
-- 1) Restrict promo_codes SELECT to admins; provide validate RPC for clients
DROP POLICY IF EXISTS "Anyone reads promo codes" ON public.promo_codes;
CREATE POLICY "Admins read promo codes" ON public.promo_codes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_promo_code(_code text)
RETURNS TABLE(
  id uuid, code text, discount_type text, discount_value numeric,
  applies_to text, min_order_byn numeric, active boolean,
  expires_at timestamptz, usage_limit int, used_count int, description text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, code, discount_type, discount_value, applies_to, min_order_byn,
         active, expires_at, usage_limit, used_count, description
  FROM public.promo_codes
  WHERE code = upper(_code)
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR used_count < usage_limit)
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text) TO anon, authenticated;

-- 2) site_settings: remove public read, allow authenticated only
DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;
CREATE POLICY "Authenticated read settings" ON public.site_settings
  FOR SELECT TO authenticated USING (true);

-- 3) points_transactions: remove user-driven inserts; only admins
DROP POLICY IF EXISTS "Insert own points tx" ON public.points_transactions;
CREATE POLICY "Admins insert points tx" ON public.points_transactions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Lock down SECURITY DEFINER RPC execution to the minimum needed
REVOKE EXECUTE ON FUNCTION public.consume_promo_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_promo_code(text) TO authenticated;

-- get_order_by_track is intentionally public (anonymous track lookup)
REVOKE EXECUTE ON FUNCTION public.get_order_by_track(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_track(text) TO anon, authenticated;

-- 5) Server-side helper to award points (admin only)
CREATE OR REPLACE FUNCTION public.award_points(_profile_id uuid, _amount int, _description text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.points_transactions (profile_id, amount, type, description)
  VALUES (_profile_id, _amount, CASE WHEN _amount >= 0 THEN 'earned' ELSE 'spent' END, _description);
  UPDATE public.profiles SET euro_points = COALESCE(euro_points,0) + _amount WHERE id = _profile_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, int, text) TO authenticated;
