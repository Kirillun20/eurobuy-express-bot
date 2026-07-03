DROP POLICY IF EXISTS "Authenticated post reviews" ON public.reviews;
CREATE POLICY "Anyone can post reviews" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (
  length(trim(name)) BETWEEN 1 AND 100
  AND length(trim(text)) BETWEEN 1 AND 2000
  AND rating BETWEEN 1 AND 5
  AND profile_id IS NULL
);
GRANT INSERT ON public.reviews TO anon;