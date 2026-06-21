
CREATE OR REPLACE FUNCTION public.record_user_points(
  _profile_id uuid, _amount int, _type text, _description text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_profile_owner(_profile_id) OR public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _type NOT IN ('earned','spent') THEN RAISE EXCEPTION 'invalid type'; END IF;
  IF _amount <= 0 OR _amount > 100000 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  INSERT INTO public.points_transactions (profile_id, amount, type, description)
  VALUES (_profile_id, _amount, _type, COALESCE(_description,''));
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_user_points(uuid,int,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_user_points(uuid,int,text,text) TO authenticated;
