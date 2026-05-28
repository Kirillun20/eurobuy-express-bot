
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_value numeric NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'total', -- 'total' | 'service' | 'delivery'
  min_order_byn numeric NOT NULL DEFAULT 0,
  max_discount_byn numeric,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO anon;
GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads promo codes"
ON public.promo_codes FOR SELECT
USING (true);

CREATE POLICY "Admins insert promo codes"
ON public.promo_codes FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update promo codes"
ON public.promo_codes FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete promo codes"
ON public.promo_codes FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code text;

CREATE OR REPLACE FUNCTION public.consume_promo_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.promo_codes WHERE code = upper(_code) FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT rec.active THEN RETURN false; END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN RETURN false; END IF;
  IF rec.usage_limit IS NOT NULL AND rec.used_count >= rec.usage_limit THEN RETURN false; END IF;
  UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = rec.id;
  RETURN true;
END;
$$;
